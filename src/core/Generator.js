import { WIDTH, HEIGHT, TYPES, idOf } from '../shared/constants.js';
import { seededRandom } from '../shared/Random.js';
import { Graph } from './Graph.js';

export function generateGraph(seed, blocked = false) {
  const random = seededRandom(seed);
  const start = idOf(1, 7),
    goal = idOf(22, 6);
  const cells = Array.from({ length: WIDTH * HEIGHT }, () => {
    const r = random();
    return r < 0.23 ? TYPES.SOLID : r < 0.37 ? TYPES.ANOMALY : TYPES.CLEAR;
  });
  const gates = [3, 10],
    wormholes = [4, 11];
  const beacons = [],
    sectorWalls = [];
  for (const [x, rows, type] of [
    [8, gates, TYPES.GATE],
    [16, wormholes, TYPES.WORMHOLE],
  ]) {
    for (let z = 0; z < HEIGHT; z++) {
      const id = idOf(x, z);
      cells[id] = rows.includes(z) ? type : TYPES.SOLID;
      (rows.includes(z) ? beacons : sectorWalls).push(id);
    }
  }
  // Carve one reproducible, cardinal corridor. The remaining space stays procedural.
  let x = 1,
    z = 7;
  const carve = () => {
    const id = idOf(x, z);
    if (!beacons.includes(id)) cells[id] = TYPES.CLEAR;
  };
  const destinations = [
    [6, 7],
    [6, random() < 0.5 ? 3 : 10],
  ];
  const gateZ = destinations[1][1];
  const wormZ = random() < 0.5 ? 4 : 11;
  destinations.push(
    [10, gateZ],
    [14, gateZ],
    [14, wormZ],
    [18, wormZ],
    [21, wormZ],
    [21, 6],
    [22, 6],
  );
  carve();
  for (const [tx, tz] of destinations) {
    while (x !== tx) {
      x += Math.sign(tx - x);
      carve();
    }
    while (z !== tz) {
      z += Math.sign(tz - z);
      carve();
    }
  }
  cells[start] = TYPES.CLEAR;
  cells[goal] = TYPES.CLEAR;
  if (blocked) {
    for (const [dx, dz] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ])
      cells[idOf(22 + dx, 6 + dz)] = TYPES.SOLID;
  }
  return new Graph(cells, start, goal, beacons, sectorWalls);
}
