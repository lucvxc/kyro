import { Cache, type CacheOptions } from "./Cache.ts";

export interface StoreOptions<K, V> extends CacheOptions {
  key?(key: K): string;
  load(key: K): V | Promise<V>;
  save?(key: K, value: V): void | Promise<void>;
}

export class Store<K, V> {
  readonly #cache: Cache<V>;
  readonly #pending = new Map<string, Promise<V>>();
  readonly #key: (key: K) => string;
  readonly #load: (key: K) => V | Promise<V>;
  readonly #save?: (key: K, value: V) => void | Promise<void>;

  public constructor(options: StoreOptions<K, V>) {
    this.#cache = new Cache(options);
    this.#key = options.key ?? (value => String(value));
    this.#load = options.load;
    this.#save = options.save;
  }

  public async get(key: K): Promise<V> {
    const id = this.#key(key);
    const cached = this.#cache.get(id);
    if (cached !== undefined) return cached;

    const active = this.#pending.get(id);
    if (active) return active;

    const request = Promise.resolve(this.#load(key)).then(value => {
      this.#cache.set(id, value);
      return value;
    }).finally(() => this.#pending.delete(id));
    this.#pending.set(id, request);
    return request;
  }

  public async set(key: K, value: V): Promise<V> {
    if (!this.#save) throw new Error("This store is read-only.");
    await this.#save(key, value);
    this.#cache.set(this.#key(key), value);
    return value;
  }

  public async update(key: K, change: (value: V) => V | Promise<V>): Promise<V> {
    return this.set(key, await change(await this.get(key)));
  }

  public prime(key: K, value: V): this { this.#cache.set(this.#key(key), value); return this; }
  public delete(key: K): boolean { return this.#cache.delete(this.#key(key)); }
  public clear(): void { this.#cache.clear(); }
}

export function store<K, V>(options: StoreOptions<K, V>): Store<K, V> {
  return new Store(options);
}
