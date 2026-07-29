export type ServiceToken<T = unknown> =
  string | symbol | (abstract new (...args: never[]) => T);
export interface Disposable {
  dispose(): void | Promise<void>;
}
export class Services {
  readonly #values = new Map<ServiceToken, unknown>();
  public constructor(entries?: Iterable<readonly [ServiceToken, unknown]>) {
    for (const [token, value] of entries ?? []) this.set(token, value);
  }
  public set<T>(token: ServiceToken<T>, value: T): this {
    if (this.#values.has(token))
      throw new Error(`Service ${label(token)} is already registered.`);
    this.#values.set(token, value);
    return this;
  }
  public replace<T>(token: ServiceToken<T>, value: T): this {
    this.#values.set(token, value);
    return this;
  }
  public has(token: ServiceToken): boolean {
    return this.#values.has(token);
  }
  public get<T>(token: ServiceToken<T>): T {
    if (!this.#values.has(token))
      throw new Error(`Service ${label(token)} is not registered.`);
    return this.#values.get(token) as T;
  }
  public optional<T>(token: ServiceToken<T>): T | undefined {
    return this.#values.get(token) as T | undefined;
  }
  public async dispose(): Promise<void> {
    const values = [...new Set(this.#values.values())].reverse();
    this.#values.clear();
    for (const value of values) if (isDisposable(value)) await value.dispose();
  }
}
function isDisposable(value: unknown): value is Disposable {
  return (
    typeof value === "object" &&
    value !== null &&
    "dispose" in value &&
    typeof value.dispose === "function"
  );
}
function label(token: ServiceToken): string {
  return typeof token === "function" ? token.name : String(token);
}
