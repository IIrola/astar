import { coords, manhattan } from '../shared/constants.js';

class MinHeap {
  #items = [];
  constructor(compare) {
    this.compare = compare;
  }
  get size() {
    return this.#items.length;
  }
  push(item) {
    const a = this.#items;
    a.push(item);
    let i = a.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (this.compare(a[p], a[i]) <= 0) break;
      [a[p], a[i]] = [a[i], a[p]];
      i = p;
    }
  }
  pop() {
    const a = this.#items,
      first = a[0],
      last = a.pop();
    if (a.length) {
      a[0] = last;
      let i = 0;
      while (true) {
        let best = i;
        const left = i * 2 + 1,
          right = left + 1;
        if (left < a.length && this.compare(a[left], a[best]) < 0) best = left;
        if (right < a.length && this.compare(a[right], a[best]) < 0) best = right;
        if (best === i) break;
        [a[i], a[best]] = [a[best], a[i]];
        i = best;
      }
    }
    return first;
  }
}

export class DynamicAStar {
  search(graph, start, goal, known, initialG = 0, heading = { dx: 1, dz: 0 }) {
    const compare = (a, b) => a.f - b.f || a.h - b.h || a.inertia - b.inertia || a.order - b.order;
    const open = new MinHeap(compare),
      frontier = new Map(),
      closed = new Set();
    const scores = new Map([[start, initialG]]),
      parents = new Map();
    let order = 0;
    const firstH = manhattan(start, goal);
    const first = {
      id: start,
      g: initialG,
      h: firstH,
      f: initialG + firstH,
      inertia: 0,
      order: order++,
    };
    open.push(first);
    frontier.set(start, first);
    while (open.size) {
      const current = open.pop();
      if (closed.has(current.id) || current.g !== scores.get(current.id)) continue;
      frontier.delete(current.id);
      if (current.id === goal) {
        const path = [goal];
        while (parents.has(path[0])) path.unshift(parents.get(path[0]));
        return {
          path,
          cost: current.g,
          expanded: closed.size,
          open: [...frontier.values()].sort(compare).slice(0, 6),
        };
      }
      closed.add(current.id);
      for (const id of graph.neighbors(current.id)) {
        const cost = graph.cost(id, known);
        if (!Number.isFinite(cost) || closed.has(id)) continue;
        const g = current.g + cost;
        if (g >= (scores.get(id) ?? Infinity)) continue;
        const from = coords(current.id),
          to = coords(id);
        const h = manhattan(id, goal);
        const candidate = {
          id,
          g,
          h,
          f: g + h,
          inertia: to.x - from.x === heading.dx && to.z - from.z === heading.dz ? 0 : 1,
          order: order++,
        };
        scores.set(id, g);
        parents.set(id, current.id);
        frontier.set(id, candidate);
        open.push(candidate);
      }
    }
    return { path: [], cost: Infinity, expanded: closed.size, open: [] };
  }
}
