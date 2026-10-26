import {
  BIOMES,
  DIRECTIONS,
  biomeOf,
  coords,
  costOf,
  idOf,
  WIDTH,
  HEIGHT,
} from '../shared/constants.js';

export function projectTelemetry(state, graph) {
  const position = coords(state.node);
  return {
    position,
    biome: BIOMES[biomeOf(state.node)],
    sector: biomeOf(state.node) + 1,
    heading:
      DIRECTIONS.find((d) => d.dx === state.heading.dx && d.dz === state.heading.dz)?.name ?? 'E',
    progress: Math.round((1 - state.h / 22) * 100),
    discovered: state.known.filter((c) => c !== null).length,
    neighbors: DIRECTIONS.map((d) => {
      const x = position.x + d.dx,
        z = position.z + d.dz;
      const valid = x >= 0 && x < WIDTH && z >= 0 && z < HEIGHT;
      const id = valid ? idOf(x, z) : null;
      const type = valid ? state.known[id] : 'solid';
      return {
        name: d.name,
        id,
        type,
        cost: type === null ? '?' : costOf(type),
        selected: valid && state.route[1] === id,
        goal: id === graph.goal,
      };
    }),
  };
}
