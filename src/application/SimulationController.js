import { PHASES, TYPES, coords, manhattan } from '../shared/constants.js';
import { EventBus } from '../shared/EventBus.js';
import { generateGraph } from '../core/Generator.js';
import { DynamicAStar } from '../core/DynamicAStar.js';
import { HistoryStack } from '../core/HistoryStack.js';

export class SimulationController {
  constructor({ seed = 'ORION-042', blocked = false, animate = async () => {} } = {}) {
    this.bus = new EventBus();
    this.solver = new DynamicAStar();
    this.history = new HistoryStack();
    this.animate = animate;
    this.speed = 1;
    this.auto = false;
    this.busy = false;
    this.reset(seed, blocked);
  }
  reset(seed = this.state.seed, blocked = false) {
    if (this.busy) return false;
    this.stopAuto();
    this.graph = generateGraph(seed, blocked);
    this.history.clear();
    const { start, goal } = this.graph;
    const known = this.graph.initialKnowledge();
    const result = this.solver.search(this.graph, start, goal, known);
    this.state = {
      seed,
      blocked,
      phase: PHASES.BOOT_INTRO,
      node: start,
      heading: { dx: 1, dz: 0 },
      g: 0,
      h: manhattan(start, goal),
      f: manhattan(start, goal),
      step: 0,
      recalculations: 0,
      known,
      route: result.path,
      open: result.open,
      expanded: result.expanded,
      ancestry: [start],
      trail: [start],
      discarded: [],
      reverseCount: 0,
      events: [{ step: 0, tone: 'info', text: 'Sistemas en línea. Ruta hipotética calculada.' }],
      report: null,
    };
    this.bus.emit('reset', this.state);
    this.emit();
    return true;
  }
  emit() {
    this.bus.emit('change', this.state);
  }
  setPhase(phase) {
    this.state.phase = phase;
    this.emit();
  }
  ready() {
    if (this.state.phase === PHASES.BOOT_INTRO || this.state.phase === PHASES.FUGITIVE_ESCAPE)
      this.setPhase(PHASES.READY_WAIT);
  }
  log(text, tone = 'info') {
    this.state.events.unshift({ step: this.state.step, tone, text });
    this.state.events = this.state.events.slice(0, 70);
  }
  async step() {
    if (
      this.busy ||
      [PHASES.CAPTURED_END, PHASES.BLOCKED_END, PHASES.FUGITIVE_ESCAPE].includes(this.state.phase)
    )
      return false;
    this.busy = true;
    this.history.push(this.state);
    try {
      this.setPhase(PHASES.SCAN_AND_RECALC);
      this.bus.emit('sound', 'scan');
      const scanned = this.graph.scan(this.state.node, this.state.known);
      this.state.known = scanned.known;
      const surprises = scanned.discoveries.filter(
        (d) => d.type === TYPES.SOLID || d.type === TYPES.ANOMALY,
      );
      if (surprises.length) {
        this.state.recalculations++;
        this.log(
          `${surprises.length} anomalía${surprises.length > 1 ? 's' : ''} detectada${surprises.length > 1 ? 's' : ''}. Recalculando A*.`,
          'warning',
        );
        this.bus.emit('sound', 'obstacle');
      }
      const plan = this.solver.search(
        this.graph,
        this.state.node,
        this.graph.goal,
        this.state.known,
        this.state.g,
        this.state.heading,
      );
      this.state.route = plan.path;
      this.state.open = plan.open;
      this.state.expanded = plan.expanded;
      this.emit();
      if (!plan.path.length) {
        this.log('Open Set agotado. No existe una ruta al fugitivo.', 'danger');
        this.state.phase = PHASES.BLOCKED_END;
        this.stopAuto();
        this.bus.emit('sound', 'blocked');
        return true;
      }
      const next = plan.path[1];
      if (next === undefined) return false;
      const from = this.state.node,
        a = coords(from),
        b = coords(next);
      const direction = { dx: b.x - a.x, dz: b.z - a.z };
      const reverse = this.state.ancestry.at(-2) === next;
      const heading = reverse ? { dx: -direction.dx || 0, dz: -direction.dz || 0 } : direction;
      if (reverse) {
        this.state.ancestry.pop();
        this.state.discarded = [...new Set([...this.state.discarded, from])];
        this.state.reverseCount++;
        this.log('Propulsión inversa. Retroceso al nodo padre.', 'warning');
        this.bus.emit('sound', 'reverse');
      } else {
        const prior = this.state.ancestry.indexOf(next);
        this.state.ancestry =
          prior >= 0 ? this.state.ancestry.slice(0, prior + 1) : [...this.state.ancestry, next];
      }
      const turning = heading.dx !== this.state.heading.dx || heading.dz !== this.state.heading.dz;
      this.setPhase(
        turning ? PHASES.ROTATING_NOSE : reverse ? PHASES.BACKTRACKING_REV : PHASES.MOVING_FORWARD,
      );
      await this.animate({
        from,
        to: next,
        heading,
        reverse,
        turning,
        speed: this.speed,
        onMove: () => this.setPhase(reverse ? PHASES.BACKTRACKING_REV : PHASES.MOVING_FORWARD),
      });
      this.state.node = next;
      this.state.heading = heading;
      this.state.g += this.graph.cost(next);
      this.state.step++;
      this.state.h = manhattan(next, this.graph.goal);
      this.state.f = this.state.g + this.state.h;
      this.state.route = plan.path.slice(1);
      this.state.trail.push(next);
      if (next === this.graph.goal) {
        const optimal = this.solver.search(
          this.graph,
          this.graph.start,
          this.graph.goal,
          this.graph.cells,
        );
        this.state.report = {
          optimalCost: optimal.cost,
          optimalPath: optimal.path,
          actualCost: this.state.g,
          overhead: this.state.g - optimal.cost,
          steps: this.state.step,
        };
        this.state.phase = PHASES.CAPTURED_END;
        this.log(
          `Fugitivo interceptado. Coste real: ${this.state.g} · óptimo global: ${optimal.cost}.`,
          'success',
        );
        this.stopAuto();
        this.bus.emit('sound', 'capture');
      } else {
        this.state.phase = PHASES.READY_WAIT;
      }
      return true;
    } finally {
      this.busy = false;
      this.emit();
    }
  }
  async undo() {
    if (this.busy || !this.history.size) return false;
    this.stopAuto();
    this.busy = true;
    const previous = this.history.pop(),
      from = this.state.node;
    this.state = previous;
    this.emit();
    try {
      await this.animate({
        from,
        to: previous.node,
        heading: previous.heading,
        reverse: true,
        turning: true,
        speed: this.speed,
        undo: true,
        onMove: () => {},
      });
      return true;
    } finally {
      this.busy = false;
      this.emit();
    }
  }
  stopAuto() {
    this.auto = false;
    clearTimeout(this.autoTimer);
  }
  async toggleAuto() {
    if (this.auto) {
      this.stopAuto();
      this.emit();
      return;
    }
    if (this.busy || [PHASES.CAPTURED_END, PHASES.BLOCKED_END].includes(this.state.phase)) return;
    this.auto = true;
    this.emit();
    const tick = async () => {
      if (!this.auto) return;
      try {
        await this.step();
      } catch (error) {
        this.stopAuto();
        this.bus.emit('error', error);
        this.emit();
        return;
      }
      if (this.auto) this.autoTimer = setTimeout(tick, 180 / this.speed);
    };
    await tick();
  }
}
