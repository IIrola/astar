import { PHASES, coords } from '../shared/constants.js';
import { projectTelemetry } from '../application/TelemetryProjector.js';
import { TacticalRadar } from './TacticalRadar.js';
import { icon } from './icons.js';

const pad = (value) => String(value).padStart(2, '0');
const phaseNames = {
  BOOT_INTRO: 'INICIALIZANDO SISTEMAS',
  READY_WAIT: 'EN ESPERA · RUTA TRAZADA',
  SCAN_AND_RECALC: 'ESCANEANDO · RECALCULANDO',
  ROTATING_NOSE: 'CORRIGIENDO RUMBO',
  MOVING_FORWARD: 'PROPULSIÓN DE AVANCE',
  BACKTRACKING_REV: 'PROPULSIÓN INVERSA',
  CAPTURED_END: 'OBJETIVO INTERCEPTADO',
  BLOCKED_END: 'DESTINO INALCANZABLE',
  FUGITIVE_ESCAPE: 'SALTO HIPERESPACIAL',
};
export class CockpitUI {
  constructor(simulation) {
    this.sim = simulation;
    this.elements = new Map();
    document.querySelector('.math-grid').append(document.querySelector('.f-line'));
    const screens = {
      map: 'radar',
      telemetry: 'telemetry',
      scanner: 'scanner',
      open: 'open',
      log: 'log',
    };
    const tabs = [...document.querySelectorAll('.mfd-tabs [role=tab]')];
    const selectScreen = (name) => {
      document.querySelector('.flight-deck').dataset.mfd = name;
      tabs.forEach((tab) => {
        const selected = tab.dataset.screen === name;
        tab.setAttribute('aria-selected', String(selected));
        tab.tabIndex = selected ? 0 : -1;
      });
    };
    for (const [name, selector] of Object.entries(screens)) {
      const panel = document.querySelector(`.${selector}-panel`);
      panel.id = `mfd-${name}`;
      panel.setAttribute('aria-label', document.getElementById(`tab-${name}`).textContent);
    }
    tabs.forEach((tab, index) => {
      tab.addEventListener('click', () => selectScreen(tab.dataset.screen));
      tab.addEventListener('keydown', (event) => {
        if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
        event.preventDefault();
        event.stopPropagation();
        const next =
          event.key === 'Home'
            ? 0
            : event.key === 'End'
              ? tabs.length - 1
              : (index + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
        selectScreen(tabs[next].dataset.screen);
        tabs[next].focus();
      });
    });
    this.radar = new TacticalRadar(this.el('radar'), this.el('radar-tooltip'));
    for (const [id, name] of [
      ['back-button', 'back'],
      ['step-button', 'step'],
      ['new-button', 'new'],
    ]) {
      this.el(id).querySelector('span').innerHTML = icon(name);
    }
    this.el('step-button').addEventListener('click', () => {
      this.sim.bus.emit('gesture');
      this.run(() => this.sim.step());
    });
    this.el('back-button').addEventListener('click', () => {
      this.sim.bus.emit('gesture');
      this.run(() => this.sim.undo());
    });
    this.el('auto-button').addEventListener('click', () => {
      this.sim.bus.emit('gesture');
      this.run(() => this.sim.toggleAuto());
    });
    this.el('speed').addEventListener('change', (event) => {
      this.sim.speed = Number(event.target.value);
    });
    this.el('blocked-mode').addEventListener('change', () =>
      this.toast('Modo bloqueo actualizado. Se aplicará en la nueva persecución.'),
    );
    const dialog = this.el('guide-dialog');
    for (const id of ['help-button', 'guide-button'])
      this.el(id).addEventListener('click', () => {
        this.sim.stopAuto();
        this.sim.emit();
        dialog.showModal();
      });
    for (const id of ['close-guide', 'start-flight'])
      this.el(id).addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', (event) => {
      if (event.target === dialog) {
        const r = dialog.getBoundingClientRect();
        if (
          event.clientX < r.left ||
          event.clientX > r.right ||
          event.clientY < r.top ||
          event.clientY > r.bottom
        )
          dialog.close();
      }
    });
    document.addEventListener('keydown', (event) => {
      if (
        dialog.open ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        ['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement?.tagName)
      )
        return;
      const ids = {
        ArrowRight: 'step-button',
        ArrowLeft: 'back-button',
        a: 'auto-button',
        A: 'auto-button',
        n: 'new-button',
        N: 'new-button',
      };
      if (ids[event.key]) {
        event.preventDefault();
        this.el(ids[event.key]).click();
      }
      // Preserve native space-to-activate behavior when a button has focus.
      if (event.key === ' ' && document.activeElement?.tagName !== 'BUTTON') {
        event.preventDefault();
        this.el('auto-button').click();
      }
    });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.sim.stopAuto();
        this.sim.emit();
      }
    });
    simulation.bus.on('change', (state) => this.update(state));
    simulation.bus.on('error', (error) => {
      console.error(error);
      this.toast('Se ha detenido el vuelo por un error. Consulta la consola.');
    });
    this.update(simulation.state);
  }
  el(id) {
    if (!this.elements.has(id)) this.elements.set(id, document.getElementById(id));
    return this.elements.get(id);
  }
  text(id, text) {
    this.el(id).textContent = text;
  }
  async run(action) {
    try {
      await action();
    } catch (error) {
      this.sim.stopAuto();
      this.sim.bus.emit('error', error);
      this.sim.emit();
    }
  }
  toast(text) {
    this.text('toast', text);
    this.el('toast').classList.add('visible');
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.el('toast').classList.remove('visible'), 4200);
  }
  update(state) {
    const t = projectTelemetry(state, this.sim.graph);
    this.text('biome-label', t.biome);
    this.text('sector-label', `SECTOR ${pad(t.sector)} / 03`);
    this.text('phase-label', phaseNames[state.phase]);
    this.text('hud-position', `${pad(t.position.x)} : ${pad(t.position.z)}`);
    const degrees = { N: '000', E: '090', S: '180', O: '270' }[t.heading];
    this.text('hud-heading', `${degrees}° ${t.heading}`);
    this.text('compass-heading', degrees);
    this.text('hud-distance', pad(state.h));
    this.text('node-value', `(${pad(t.position.x)}, ${pad(t.position.z)})`);
    for (const [id, value] of [
      ['g-value', state.g],
      ['h-value', state.h],
      ['f-value', state.f],
      ['recalc-value', state.recalculations],
      ['step-value', state.step],
    ])
      this.text(id, pad(value));
    this.text('known-count', `${t.discovered} / 336 NODOS`);
    this.text('mission-seed', `MISIÓN ${state.seed}`);
    this.text('expanded-count', `${state.expanded} EXP.`);
    this.text(
      'scanner-status',
      state.phase === PHASES.SCAN_AND_RECALC
        ? 'EMITIENDO PULSO LOCAL'
        : state.step
          ? 'VECINOS · ÚLTIMO PULSO'
          : 'A LA ESPERA DE PULSO',
    );
    for (const n of t.neighbors) {
      const el = this.el(`scan-${n.name}`);
      el.classList.toggle('solid', n.type === 'solid');
      el.classList.toggle('anomaly', n.type === 'anomaly');
      el.classList.toggle('selected', n.selected);
      el.querySelector('span').textContent =
        n.cost === Infinity ? '∞' : n.cost === '?' ? '?' : `+${n.cost}`;
      el.title =
        n.id === null
          ? 'Límite de cuadrícula'
          : `${n.name}: ${n.type === null ? 'sin explorar' : n.type} · coste ${n.cost}`;
    }
    const terminal = [PHASES.CAPTURED_END, PHASES.BLOCKED_END].includes(state.phase),
      busy = this.sim.busy;
    this.el('back-button').disabled = busy || !this.sim.history.size;
    this.el('step-button').disabled = busy || terminal || this.sim.auto;
    this.el('new-button').disabled = busy;
    this.el('auto-button').disabled = (busy && !this.sim.auto) || terminal;
    this.el('auto-button').classList.toggle('active', this.sim.auto);
    this.el('auto-button').setAttribute('aria-pressed', String(this.sim.auto));
    this.el('auto-button').innerHTML =
      `<span>${icon(this.sim.auto ? 'pause' : 'play')}</span> ${this.sim.auto ? 'Pausar piloto' : 'Piloto automático'} <kbd>A</kbd>`;
    const reversed = state.phase === PHASES.BACKTRACKING_REV;
    this.text(
      'reticle-label',
      terminal
        ? state.report
          ? 'CAPTURA CONFIRMADA'
          : 'SIN RUTA VIABLE'
        : reversed
          ? 'REVERSA ACTIVA'
          : 'RUTA TRAZADA',
    );
    this.text(
      'flight-instruction',
      terminal
        ? state.report
          ? 'RAYO TRACTOR ACTIVO · OBJETIVO ASEGURADO'
          : 'OPEN SET AGOTADO · REINICIA LA MISIÓN'
        : this.sim.auto
          ? 'PILOTO AUTOMÁTICO · SEGUIMIENTO ACTIVO'
          : reversed
            ? 'RETROCESO AL NODO PADRE · NARIZ EN OPOSICIÓN AL MOVIMIENTO'
            : 'ESCÁNER LISTO · AVANZA PARA EXPLORAR',
    );
    this.text(
      'footer-status',
      terminal
        ? state.report
          ? 'MISIÓN COMPLETADA'
          : 'MISIÓN BLOQUEADA'
        : busy
          ? phaseNames[state.phase]
          : this.sim.auto
            ? 'PILOTO AUTOMÁTICO ACTIVO'
            : 'LISTO PARA DESPEGAR',
    );
    const alert = this.el('flight-alert');
    alert.textContent = terminal
      ? state.report
        ? '◇ INTERCEPCIÓN COMPLETADA'
        : '⚠ DESTINO INALCANZABLE'
      : reversed
        ? '◁ RETROCESO EN REVERSA'
        : state.phase === PHASES.FUGITIVE_ESCAPE
          ? 'FUGITIVO EN SALTO WARP'
          : '';
    alert.className = `flight-alert ${state.report ? 'success' : state.phase === PHASES.BLOCKED_END ? 'danger' : ''}`;
    this.updateOpen(state);
    if (this.lastEvents !== JSON.stringify(state.events)) {
      this.lastEvents = JSON.stringify(state.events);
      this.el('event-log').replaceChildren(
        ...state.events.map((event) => {
          const row = document.createElement('div');
          row.className = `log-event ${event.tone}`;
          const step = document.createElement('span');
          step.className = 'event-step';
          step.textContent = `[${pad(event.step)}]`;
          const text = document.createElement('span');
          text.className = 'event-text';
          text.textContent = event.text;
          row.append(step, text);
          return row;
        }),
      );
      this.text(
        'log-count',
        `${pad(state.events.length)} EVENTO${state.events.length === 1 ? '' : 'S'}`,
      );
    }
    this.radar.update(state, this.sim.graph);
  }
  updateOpen(state) {
    const content = this.el('open-content');
    this.text('open-title', state.report ? 'REPORTE FINAL' : 'OPEN SET');
    if (state.report) {
      content.innerHTML = `<p class="report-label">✓ FUGITIVO INTERCEPTADO</p><div class="report-grid"><div>ÓPTIMO GLOBAL<strong>${pad(state.report.optimalCost)}</strong></div><div>COSTE REAL<strong>${pad(state.report.actualCost)}</strong></div></div><p class="report-note">+${state.report.overhead} combustible · ${state.report.steps} pasos</p><p class="open-note">ÓPTIMO CON MAPA COMPLETO · RUTA EN VIOLETA</p>`;
      return;
    }
    const rows = state.open
      .slice(0, 3)
      .map((n) => {
        const p = coords(n.id);
        return `<tr><td>(${pad(p.x)},${pad(p.z)})</td><td>${n.g}</td><td>${n.h}</td><td>${n.f}</td></tr>`;
      })
      .join('');
    content.innerHTML = `<table class="open-table" aria-label="Mejores candidatos en la frontera de la última búsqueda A estrella"><thead><tr><th>NODO</th><th>g</th><th>h</th><th>f ↓</th></tr></thead><tbody>${rows || '<tr><td colspan="4">SIN CANDIDATOS</td></tr>'}</tbody></table><p class="open-note">ÚLTIMA BÚSQUEDA · f ↑ / h ↑ / INERCIA</p>`;
  }
}
