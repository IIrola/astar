function deepFreeze(value) {
  if (value && typeof value === 'object') {
    for (const child of Object.values(value)) deepFreeze(child);
    Object.freeze(value);
  }
  return value;
}
export class HistoryStack {
  #snapshots = [];
  get size() {
    return this.#snapshots.length;
  }
  push(state) {
    this.#snapshots.push(deepFreeze(structuredClone(state)));
  }
  pop() {
    const state = this.#snapshots.pop();
    return state ? structuredClone(state) : null;
  }
  peek() {
    return this.#snapshots.at(-1);
  }
  clear() {
    this.#snapshots = [];
  }
}
