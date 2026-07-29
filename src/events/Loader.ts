import { resolve } from "node:path";
import type { DiscordEvent, DiscordRuntime } from "../core/Discord.ts";

import { moduleUrl, scan } from "../core/Files.ts";
import { log } from "../core/Log.ts";
import type { Kyro } from "../Kyro.ts";
import type { WorkTracker } from "../core/Work.ts";
import { FrameworkError, type FrameworkErrorHandler } from "../core/Errors.ts";
import {
  noInstrumentation,
  type Instrumentation,
} from "../core/Instrumentation.ts";

interface LoadedEvt {
  name: DiscordEvent;
  once?: boolean;
  priority?: number;
  when?(...args: unknown[]): boolean | Promise<boolean>;
  run(...args: unknown[]): void | Promise<void>;
  error?(error: unknown, ...args: unknown[]): void | Promise<void>;
}

interface Listener {
  name: DiscordEvent;
  run(...args: unknown[]): void;
}

export class Loader {
  readonly #runtime: DiscordRuntime;
  readonly #bot: Kyro | undefined;
  readonly #directory: string;
  readonly #listeners: Listener[] = [];
  #loaded = false;
  #loads = 0;
  readonly #work?: WorkTracker;
  readonly #onError?: FrameworkErrorHandler;
  readonly #instrumentation: Instrumentation;
  public get size(): number {
    return this.#listeners.length;
  }

  public constructor(
    runtime: DiscordRuntime,
    directory: string,
    bot?: Kyro,
    options: {
      work?: WorkTracker;
      onError?: FrameworkErrorHandler;
      instrumentation?: Instrumentation;
    } = {},
  ) {
    this.#runtime = runtime;
    this.#bot = bot;
    this.#directory = resolve(directory);
    this.#work = options.work;
    this.#onError = options.onError;
    this.#instrumentation = options.instrumentation ?? noInstrumentation;
  }

  public async load(): Promise<void> {
    if (this.#loaded) return;

    const events: LoadedEvt[] = [];

    for (const file of await scan(this.#directory)) {
      const module = (await import(moduleUrl(file, this.#loads > 0))) as {
        default?: unknown;
      };

      const loaded = Array.isArray(module.default)
        ? module.default
        : [module.default];
      if (!loaded.length)
        throw new TypeError(
          `Event file "${file}" cannot export an empty array.`,
        );
      for (const event of loaded) {
        if (!isEvt(event))
          throw new TypeError(
            `Event file "${file}" must export an event or event array.`,
          );
        events.push(event);
      }
    }

    events.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
    for (const event of events) this.#listen(event);

    this.#loaded = true;
    this.#loads += 1;
  }

  public unload(): void {
    for (const event of this.#listeners) {
      this.#runtime.off(event.name, event.run as never);
    }

    this.#listeners.length = 0;
    this.#loaded = false;
  }

  #listen(event: LoadedEvt): void {
    let checking = false;
    let done = false;

    const run = (...args: unknown[]): void => {
      if (done || (event.once && checking)) return;
      if (event.once) checking = true;

      const execute = async () => {
        const span = this.#instrumentation.start("kyro.event", {
          event: String(event.name),
        });
        let failure: unknown;
        try {
          if (event.when && !(await event.when(...args))) return;

          if (event.once) {
            done = true;
            this.#runtime.off(event.name, run as never);
          }

          await event.run(...args, ...(this.#bot ? [this.#bot] : []));
        } catch (error) {
          failure = error;
          await this.#error(event, error, args);
        } finally {
          checking = false;
          span.end(failure);
        }
      };
      if (this.#work) void this.#work.run(execute).catch(() => undefined);
      else void execute();
    };

    this.#runtime.on(event.name, run as never);
    this.#listeners.push({ name: event.name, run });
  }

  async #error(
    event: LoadedEvt,
    error: unknown,
    args: unknown[],
  ): Promise<void> {
    if (!event.error) {
      const wrapped = new FrameworkError({
        phase: "event",
        route: String(event.name),
        cause: error,
      });
      if (this.#onError)
        await Promise.resolve(this.#onError(wrapped)).catch(() => undefined);
      else log.error(wrapped.message, error);
      return;
    }

    try {
      await event.error(error, ...args);
    } catch (handlerError) {
      log.error(
        `Error handler for "${String(event.name)}" failed.`,
        handlerError,
      );
    }
  }
}

function isEvt(value: unknown): value is LoadedEvt {
  if (typeof value !== "object" || value === null) return false;
  if (!("name" in value) || typeof value.name !== "string") return false;
  if (!("run" in value) || typeof value.run !== "function") return false;

  if (
    "priority" in value &&
    value.priority !== undefined &&
    (typeof value.priority !== "number" || !Number.isFinite(value.priority))
  ) {
    return false;
  }

  return true;
}
