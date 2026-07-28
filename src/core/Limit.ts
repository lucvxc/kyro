export interface LimitOptions {
  max: number;
  window: number;
}
export class Limit {
  readonly #max: number;
  readonly #window: number;
  readonly #uses = new Map<string, number[]>();
  public constructor(options: LimitOptions) {
    if (options.max < 1 || options.window <= 0)
      throw new TypeError("Invalid rate limit.");
    this.#max = options.max;
    this.#window = options.window * 1_000;
  }
  public check(key: string): number {
    const now = Date.now();
    const uses = (this.#uses.get(key) ?? []).filter(
      (time) => time > now - this.#window,
    );
    if (uses.length >= this.#max) {
      this.#uses.set(key, uses);
      return Math.ceil((uses[0]! + this.#window - now) / 1_000);
    }
    uses.push(now);
    this.#uses.set(key, uses);
    return 0;
  }
  public clear(): void {
    this.#uses.clear();
  }
}
