export const WIDTH = 24;
export const HEIGHT = 14;
export const CELL_SIZE = 12;
export const TYPES = Object.freeze({
  CLEAR: 'clear',
  ANOMALY: 'anomaly',
  SOLID: 'solid',
  GATE: 'gate',
  WORMHOLE: 'wormhole',
});
export const PHASES = Object.freeze({
  BOOT_INTRO: 'BOOT_INTRO',
  READY_WAIT: 'READY_WAIT',
  SCAN_AND_RECALC: 'SCAN_AND_RECALC',
  ROTATING_NOSE: 'ROTATING_NOSE',
  MOVING_FORWARD: 'MOVING_FORWARD',
  BACKTRACKING_REV: 'BACKTRACKING_REV',
  CAPTURED_END: 'CAPTURED_END',
  BLOCKED_END: 'BLOCKED_END',
  FUGITIVE_ESCAPE: 'FUGITIVE_ESCAPE',
});
export const DIRECTIONS = Object.freeze([
  { name: 'N', dx: 0, dz: -1 },
  { name: 'E', dx: 1, dz: 0 },
  { name: 'S', dx: 0, dz: 1 },
  { name: 'O', dx: -1, dz: 0 },
]);
export const BIOMES = ['ESPACIO PROFUNDO', 'ÓRBITA PLANETARIA', 'OTRA GALAXIA'];
export const idOf = (x, z) => z * WIDTH + x;
export const coords = (id) => ({ x: id % WIDTH, z: Math.floor(id / WIDTH) });
export const manhattan = (a, b) => {
  const p = coords(a),
    q = coords(b);
  return Math.abs(p.x - q.x) + Math.abs(p.z - q.z);
};
export const costOf = (type) => (type === TYPES.SOLID ? Infinity : type === TYPES.ANOMALY ? 2 : 1);
export const biomeOf = (id) => Math.min(2, Math.floor(coords(id).x / 8));
