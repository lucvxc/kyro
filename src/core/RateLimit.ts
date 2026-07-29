export type RateLimitScope = "user" | "guild" | "channel" | "global";

export interface RateLimitAdapter {
  consume(key: string, limit: number, windowMs: number): Promise<number>;
  clear?(): void | Promise<void>;
}

export interface RateLimitPolicy {
  limit: number;
  window: number;
  scope?: RateLimitScope;
  adapter?: RateLimitAdapter;
}

export class MemoryRateLimitAdapter implements RateLimitAdapter {
  readonly #uses = new Map<string, number[]>();
  public async consume(
    key: string,
    limit: number,
    windowMs: number,
  ): Promise<number> {
    const now = Date.now();
    const uses = (this.#uses.get(key) ?? []).filter(
      (time) => time > now - windowMs,
    );
    if (uses.length >= limit) {
      this.#uses.set(key, uses);
      return Math.max(1, Math.ceil((uses[0]! + windowMs - now) / 1_000));
    }
    uses.push(now);
    this.#uses.set(key, uses);
    if (this.#uses.size > 10_000) this.#sweep(now, windowMs);
    return 0;
  }
  public clear(): void {
    this.#uses.clear();
  }
  #sweep(now: number, windowMs: number): void {
    for (const [key, uses] of this.#uses)
      if (!uses.some((time) => time > now - windowMs)) this.#uses.delete(key);
  }
}

export function validateRateLimit(policy: RateLimitPolicy): void {
  if (!Number.isInteger(policy.limit) || policy.limit < 1)
    throw new TypeError("Rate-limit limit must be a positive integer.");
  if (!Number.isFinite(policy.window) || policy.window <= 0)
    throw new TypeError("Rate-limit window must be positive seconds.");
}
