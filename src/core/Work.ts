export class WorkTracker {
  readonly #active = new Set<Promise<unknown>>();
  readonly #controller = new AbortController();
  #accepting = true;

  public get signal(): AbortSignal {
    return this.#controller.signal;
  }
  public get size(): number {
    return this.#active.size;
  }
  public get accepting(): boolean {
    return this.#accepting;
  }
  public run<T>(work: () => Promise<T>): Promise<T> {
    if (!this.#accepting)
      return Promise.reject(new Error("Kyro is shutting down."));
    const promise = work();
    this.#active.add(promise);
    void promise.finally(() => this.#active.delete(promise)).catch(() => {});
    return promise;
  }
  public stop(): void {
    this.#accepting = false;
    this.#controller.abort(new Error("Kyro is shutting down."));
  }
  public async drain(timeout = 10_000): Promise<void> {
    if (!this.#active.size) return;
    await Promise.race([
      Promise.allSettled([...this.#active]).then(() => undefined),
      new Promise<void>((resolve) => setTimeout(resolve, timeout)),
    ]);
  }
}
