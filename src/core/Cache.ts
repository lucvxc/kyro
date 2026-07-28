export interface CacheOptions {
  ttl?: number;
  max?: number;
}
type Item<T> = { value: T; expires: number };

export class Cache<T = unknown> {
  readonly #items = new Map<string, Item<T>>();
  readonly #ttl: number;
  readonly #max: number;
  public constructor(options: CacheOptions = {}) {
    this.#ttl = (options.ttl ?? 60) * 1_000;
    this.#max = options.max ?? 1_000;
  }
  public get(key: string): T | undefined {
    const item = this.#items.get(key);
    if (!item) return undefined;
    if (item.expires <= Date.now()) {
      this.#items.delete(key);
      return undefined;
    }
    return item.value;
  }
  public set(key: string, value: T, ttl = this.#ttl): this {
    this.#items.set(key, { value, expires: Date.now() + ttl });
    if (this.#items.size > this.#max)
      this.#items.delete(this.#items.keys().next().value!);
    return this;
  }
  public delete(key: string): boolean {
    return this.#items.delete(key);
  }
  public clear(): void {
    this.#items.clear();
  }
  public has(key: string): boolean {
    return this.get(key) !== undefined;
  }
}
