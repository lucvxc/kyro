import type { DiscordRuntime } from "./Discord.ts";

export interface ConnectionOptions {
  runtime: DiscordRuntime;
  beforeStart?: () => void | Promise<void>;
  afterStart?: () => void | Promise<void>;
  beforeStop?: () => void | Promise<void>;
  afterStop?: () => void | Promise<void>;
}

export class Connection {
  readonly #runtime: DiscordRuntime;
  readonly #beforeStart: (() => void | Promise<void>) | undefined;
  readonly #afterStart: (() => void | Promise<void>) | undefined;
  readonly #beforeStop: (() => void | Promise<void>) | undefined;
  readonly #afterStop: (() => void | Promise<void>) | undefined;
  #startPromise: Promise<void> | undefined;
  #stopPromise: Promise<void> | undefined;

  public constructor(options: ConnectionOptions) {
    this.#runtime = options.runtime;
    this.#beforeStart = options.beforeStart;
    this.#afterStart = options.afterStart;
    this.#beforeStop = options.beforeStop;
    this.#afterStop = options.afterStop;
  }

  public get isReady(): boolean {
    return this.#runtime.isReady;
  }

  public start(): Promise<void> {
    if (this.#stopPromise) {
      throw new Error("Kyro cannot start while it is stopping.");
    }

    if (this.isReady) return Promise.resolve();
    if (this.#startPromise) return this.#startPromise;

    this.#startPromise = this.#connect();
    this.#clearAfter(this.#startPromise, "start");
    return this.#startPromise;
  }

  public stop(): Promise<void> {
    if (this.#stopPromise) return this.#stopPromise;

    const startPromise = this.#startPromise;
    this.#stopPromise = this.#disconnect(startPromise);
    this.#clearAfter(this.#stopPromise, "stop");
    return this.#stopPromise;
  }

  async #connect(): Promise<void> {
    try {
      await this.#beforeStart?.();
      await this.#runtime.start();
      await this.#afterStart?.();
    } catch (error) {
      try {
        await this.#beforeStop?.();
      } finally {
        await this.#runtime.stop().catch(() => undefined);
        await this.#afterStop?.();
      }
      throw error;
    }
  }

  async #disconnect(startPromise: Promise<void> | undefined): Promise<void> {
    if (startPromise) {
      await startPromise.catch(() => undefined);
    }

    try {
      await this.#beforeStop?.();
    } finally {
      await this.#runtime.stop();
      await this.#afterStop?.();
    }
  }

  #clearAfter(promise: Promise<void>, operation: "start" | "stop"): void {
    const clear = (): void => {
      if (operation === "start") this.#startPromise = undefined;
      else this.#stopPromise = undefined;
    };

    void promise.then(clear, clear);
  }
}
