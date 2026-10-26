import '../css/variables.css';
import { SimulationController } from './application/SimulationController.js';
import { SpaceScene } from './view3d/SpaceScene.js';
import { CockpitUI } from './ui/CockpitUI.js';
import { Synthesizer } from './audio/Synthesizer.js';
import { PHASES } from './shared/constants.js';

const params = new URLSearchParams(location.search);
const seed = params.get('seed')?.slice(0, 64) || 'ORION-042';
const simulation = new SimulationController({ seed, blocked: params.get('blocked') === '1' });
const ui = new CockpitUI(simulation);
const audio = new Synthesizer();
let scene;
try {
  scene = new SpaceScene(document.getElementById('space-view'), { quality: params.get('quality') });
  scene.reset(simulation.graph, simulation.state);
  document.getElementById('scene-loading').hidden = true;
  const qualityControl = document.getElementById('render-quality');
  qualityControl.value = scene.quality;
  scene.setQuality(scene.quality);
  qualityControl.addEventListener('change', () => scene.setQuality(qualityControl.value));
  scene.onContextLost = () => {
    simulation.stopAuto();
    simulation.emit();
    ui.toast(
      'Se perdió el contexto WebGL. Recarga la página para recuperar la vista 3D. El radar sigue disponible.',
    );
  };
  simulation.animate = (motion) => scene.rig.fly(motion);
  simulation.bus.on('change', (state) => scene.update(state));
  simulation.bus.on('reset', (state) => scene.reset(simulation.graph, state));
} catch (error) {
  document.getElementById('scene-loading').hidden = true;
  document.getElementById('render-quality').disabled = true;
  scene = null;
  console.warn('WebGL no disponible:', error);
  const note = document.createElement('p');
  note.className = 'webgl-fallback';
  note.textContent = 'VISTA 3D NO DISPONIBLE · EL RADAR TÁCTICO PERMANECE OPERATIVO';
  Object.assign(note.style, {
    position: 'absolute',
    inset: '70% 15% auto',
    textAlign: 'center',
    color: '#e0b67a',
    font: '8px monospace',
    letterSpacing: '1px',
  });
  document.getElementById('space-view').append(note);
  ui.toast(
    'Tu navegador no ha podido activar WebGL. Puedes usar todos los controles con el radar 2D.',
  );
}
simulation.bus.on('sound', (effect) => audio.play(effect));
simulation.bus.on('gesture', () => {
  audio.unlock().catch(() => ui.toast('No se pudo activar el audio en este navegador.'));
});
document.getElementById('audio-button').addEventListener('click', async () => {
  try {
    const enabled = await audio.toggle(),
      button = document.getElementById('audio-button');
    button.setAttribute('aria-pressed', String(enabled));
    button.querySelector('b').textContent = enabled ? 'ON' : 'OFF';
  } catch {
    audio.enabled = false;
    ui.toast('El navegador no permite iniciar el audio.');
  }
});
document.getElementById('blocked-mode').checked = simulation.state.blocked;
document.getElementById('new-button').addEventListener('click', () =>
  ui.run(async () => {
    if (simulation.busy) return;
    simulation.stopAuto();
    simulation.busy = true;
    simulation.setPhase(PHASES.FUGITIVE_ESCAPE);
    try {
      await audio.unlock().catch(() => ui.toast('El audio no está disponible en este navegador.'));
      audio.play('warp');
      if (scene) await scene.escape();
    } finally {
      simulation.busy = false;
    }
    const bytes = new Uint32Array(1);
    crypto.getRandomValues(bytes);
    const nextSeed = `ORION-${bytes[0].toString(36).toUpperCase().padStart(6, '0')}`;
    simulation.reset(nextSeed, document.getElementById('blocked-mode').checked);
    const url = new URL(location.href);
    url.searchParams.set('seed', nextSeed);
    if (simulation.state.blocked) url.searchParams.set('blocked', '1');
    else url.searchParams.delete('blocked');
    history.replaceState({}, '', url);
    setTimeout(() => simulation.ready(), 450);
  }),
);
setTimeout(() => simulation.ready(), 700);

// Read-only diagnostics support browser smoke tests without exposing mutable domain state.
Object.defineProperty(window, 'orion', {
  value: Object.freeze({
    getSnapshot: () => structuredClone(simulation.state),
    getStatus: () => ({
      busy: simulation.busy,
      auto: simulation.auto,
      history: simulation.history.size,
      webgl: Boolean(scene),
      quality: scene?.quality ?? null,
    }),
  }),
});
