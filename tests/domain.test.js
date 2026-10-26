import test from 'node:test';
import assert from 'node:assert/strict';
import { Graph } from '../src/core/Graph.js';
import { generateGraph } from '../src/core/Generator.js';
import { DynamicAStar } from '../src/core/DynamicAStar.js';
import { HistoryStack } from '../src/core/HistoryStack.js';
import { SimulationController } from '../src/application/SimulationController.js';
import { WIDTH, HEIGHT, TYPES, PHASES, idOf, manhattan, coords } from '../src/shared/constants.js';

const solver = new DynamicAStar();
function dijkstraCost(graph, start = graph.start, goal = graph.goal) {
  const distance = new Map([[start, 0]]),
    visited = new Set();
  while (true) {
    let current = null,
      best = Infinity;
    for (const [node, cost] of distance)
      if (!visited.has(node) && cost < best) {
        current = node;
        best = cost;
      }
    if (current === null) return Infinity;
    if (current === goal) return best;
    visited.add(current);
    for (const next of graph.neighbors(current)) {
      const cost = best + graph.cost(next);
      if (cost < (distance.get(next) ?? Infinity)) distance.set(next, cost);
    }
  }
}

test('seeded generator is reproducible, cardinal and preserves known gateway contracts', () => {
  const a = generateGraph('SEED-A'),
    b = generateGraph('SEED-A'),
    c = generateGraph('SEED-B');
  assert.deepEqual(a.cells, b.cells);
  assert.notDeepEqual(a.cells, c.cells);
  assert.equal(a.cells.length, 336);
  assert.equal(a.beacons.length, 4);
  assert.ok(Object.isFrozen(a.cells));
  const known = a.initialKnowledge();
  for (const id of a.beacons) {
    assert.ok([8, 16].includes(coords(id).x));
    assert.notEqual(known[id], null);
  }
  for (let id = 0; id < WIDTH * HEIGHT; id++)
    for (const next of a.neighbors(id)) assert.equal(manhattan(id, next), 1);
  assert.equal(a.neighbors(0).length, 2);
});

test('radius-one scan reveals only current node and four cardinal neighbors', () => {
  const graph = generateGraph('FOG'),
    initial = graph.initialKnowledge();
  const { known, discoveries } = graph.scan(graph.start, initial);
  assert.notStrictEqual(known, initial);
  assert.deepEqual(
    discoveries.map((d) => d.id).sort((a, b) => a - b),
    graph.neighbors(graph.start).sort((a, b) => a - b),
  );
  assert.equal(known[idOf(2, 6)], null);
  assert.equal(initial[idOf(2, 7)], null);
  assert.ok(graph.neighbors(graph.start).every((id) => known[id] === graph.cells[id]));
});

test('A* matches independent Dijkstra cost over forty weighted maps', () => {
  for (let seed = 0; seed < 40; seed++) {
    const graph = generateGraph(`ORACLE-${seed}`);
    const result = solver.search(graph, graph.start, graph.goal, graph.cells);
    assert.equal(result.cost, dijkstraCost(graph), `seed ${seed}`);
    assert.ok(result.path.length > 0);
    for (let i = 1; i < result.path.length; i++) {
      assert.equal(manhattan(result.path[i - 1], result.path[i]), 1);
      assert.ok(Number.isFinite(graph.cost(result.path[i])));
    }
    assert.equal(
      result.path.slice(1).reduce((sum, id) => sum + graph.cost(id), 0),
      result.cost,
    );
  }
});

test('A* uses an optimistic unknown cost, carries initial g, and respects heading tie-breaks', () => {
  const cells = Array(WIDTH * HEIGHT).fill(TYPES.CLEAR);
  const graph = new Graph(cells, idOf(1, 1), idOf(3, 3));
  const known = graph.initialKnowledge();
  const east = solver.search(graph, graph.start, graph.goal, known, 73, { dx: 1, dz: 0 });
  const south = solver.search(graph, graph.start, graph.goal, known, 73, { dx: 0, dz: 1 });
  assert.equal(east.cost, 77);
  assert.equal(south.cost, 77);
  assert.equal(east.path[1], idOf(2, 1));
  assert.equal(south.path[1], idOf(1, 2));
  cells[idOf(2, 1)] = TYPES.ANOMALY;
  const weighted = new Graph(cells, idOf(1, 1), idOf(3, 1));
  assert.equal(solver.search(weighted, weighted.start, weighted.goal, weighted.cells).cost, 3);
});

test('blocked goal exhausts the queue without reporting a false path', () => {
  const graph = generateGraph('BLOCKED', true);
  const result = solver.search(graph, graph.start, graph.goal, graph.cells);
  assert.deepEqual(result.path, []);
  assert.deepEqual(result.open, []);
  assert.equal(result.cost, Infinity);
});

test('history snapshots are deeply immutable and restores are independent copies', () => {
  const history = new HistoryStack(),
    state = { g: 7, nested: { route: [1, 2] } };
  history.push(state);
  state.nested.route.push(3);
  assert.deepEqual(history.peek().nested.route, [1, 2]);
  assert.throws(() => history.peek().nested.route.push(4), TypeError);
  const restored = history.pop();
  restored.nested.route.push(5);
  assert.deepEqual(restored.nested.route, [1, 2, 5]);
  assert.equal(history.size, 0);
});

test('repeated forward A* captures across twenty seeds and g equals every real transition', async () => {
  for (let seed = 0; seed < 20; seed++) {
    const sim = new SimulationController({ seed: `FLIGHT-${seed}` });
    sim.ready();
    let total = 0,
      iterations = 0;
    while (!sim.state.report && iterations++ < 600) {
      const before = sim.state.g,
        node = sim.state.node;
      await sim.step();
      assert.notEqual(sim.state.phase, PHASES.BLOCKED_END);
      assert.equal(manhattan(node, sim.state.node), 1);
      total += sim.graph.cost(sim.state.node);
      assert.equal(sim.state.g, total);
      assert.ok(sim.state.g > before);
      assert.equal(sim.state.f, sim.state.g + sim.state.h);
    }
    assert.equal(sim.state.phase, PHASES.CAPTURED_END, `seed ${seed}`);
    assert.equal(sim.state.report.optimalCost, dijkstraCost(sim.graph));
    assert.equal(sim.state.report.actualCost, total);
  }
});

test('undo restores exact node, g/h/f, direction, route, fog, events and frontier; replay is deterministic', async () => {
  const sim = new SimulationController();
  sim.ready();
  for (let i = 0; i < 16; i++) await sim.step();
  const before = structuredClone(sim.state);
  await sim.step();
  const after = structuredClone(sim.state);
  assert.ok(await sim.undo());
  assert.deepEqual(sim.state, before);
  await sim.step();
  assert.deepEqual(sim.state, after);
});

test('default mission exercises physical reversal with nose opposite travel direction', async () => {
  const motions = [],
    sim = new SimulationController({
      animate: async (motion) => {
        motions.push(motion);
        motion.onMove();
      },
    });
  while (!sim.state.report && sim.state.step < 600) await sim.step();
  const reverses = motions.filter((m) => m.reverse);
  assert.ok(reverses.length >= 1);
  assert.equal(reverses.length, sim.state.reverseCount);
  for (const motion of reverses) {
    const a = coords(motion.from),
      b = coords(motion.to);
    assert.equal(motion.heading.dx, -(b.x - a.x) || 0);
    assert.equal(motion.heading.dz, -(b.z - a.z) || 0);
  }
  assert.ok(sim.state.discarded.length > 0);
});

test('unreachable flight terminates, can undo its failed scan, and clears on reset', async () => {
  const sim = new SimulationController({ blocked: true });
  let iterations = 0;
  while (sim.state.phase !== PHASES.BLOCKED_END && iterations++ < 600) await sim.step();
  assert.equal(sim.state.phase, PHASES.BLOCKED_END);
  assert.equal(sim.state.report, null);
  assert.equal(await sim.step(), false);
  await sim.undo();
  assert.equal(sim.state.phase, PHASES.READY_WAIT);
  sim.reset('FRESH', false);
  assert.equal(sim.state.g, 0);
  assert.equal(sim.state.step, 0);
  assert.equal(sim.history.size, 0);
});

test('concurrent step and undo commands cannot corrupt an in-flight snapshot', async () => {
  let resolve;
  const sim = new SimulationController({
    animate: () =>
      new Promise((r) => {
        resolve = r;
      }),
  });
  const inFlight = sim.step();
  assert.equal(sim.busy, true);
  assert.equal(await sim.step(), false);
  assert.equal(await sim.undo(), false);
  assert.equal(sim.reset('IGNORED'), false);
  resolve();
  await inFlight;
  assert.equal(sim.state.step, 1);
  assert.equal(sim.history.size, 1);
  assert.equal(sim.busy, false);
});
