export class EventBus {
  #listeners = new Map();
  on(name, fn) {
    if (!this.#listeners.has(name)) this.#listeners.set(name, new Set());
    this.#listeners.get(name).add(fn);
    return () => this.#listeners.get(name).delete(fn);
  }
  emit(name, payload) {
    for (const fn of this.#listeners.get(name) ?? []) fn(payload);
  }
}
