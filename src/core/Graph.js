import { WIDTH, HEIGHT, DIRECTIONS, coords, idOf, costOf } from '../shared/constants.js';

export class Graph {
  constructor(cells, start, goal, beacons = [], sectorWalls = []) {
    if (cells.length !== WIDTH * HEIGHT) throw new Error('El grafo debe contener 336 celdas.');
    this.cells = Object.freeze([...cells]);
    this.start = start;
    this.goal = goal;
    this.beacons = Object.freeze([...beacons]);
    this.sectorWalls = Object.freeze([...sectorWalls]);
    Object.freeze(this);
  }
  neighbors(id) {
    const { x, z } = coords(id);
    return DIRECTIONS.flatMap((d) => {
      const nx = x + d.dx,
        nz = z + d.dz;
      return nx >= 0 && nx < WIDTH && nz >= 0 && nz < HEIGHT ? [idOf(nx, nz)] : [];
    });
  }
  cost(id, known = this.cells) {
    return costOf(known[id]);
  }
  initialKnowledge() {
    const known = Array(WIDTH * HEIGHT).fill(null);
    // The sector boundary geometry and long-range beacons are charted;
    // only internal hazards are hidden behind radius-one fog.
    for (const id of [...this.beacons, ...this.sectorWalls, this.start, this.goal])
      known[id] = this.cells[id];
    return known;
  }
  scan(id, known) {
    const next = [...known],
      discoveries = [];
    for (const neighbor of this.neighbors(id)) {
      if (next[neighbor] === null) discoveries.push({ id: neighbor, type: this.cells[neighbor] });
      next[neighbor] = this.cells[neighbor];
    }
    next[id] = this.cells[id];
    return { known: next, discoveries };
  }
}
