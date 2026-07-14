import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import type { Client, ClientEvents } from "discord.js";

import { scan } from "../core/Files.ts";
import { log } from "../core/Log.ts";

interface LoadedEvt {
  name: keyof ClientEvents;
  once?: boolean;
  priority?: number;
  when?(...args: unknown[]): boolean | Promise<boolean>;
  run(...args: unknown[]): void | Promise<void>;
  error?(error: unknown, ...args: unknown[]): void | Promise<void>;
}

interface Listener {
  name: keyof ClientEvents;
  run(...args: unknown[]): void;
}

export class Loader {
  readonly #client: Client;
  readonly #directory: string;
  readonly #listeners: Listener[] = [];
  #loaded = false;

  public constructor(client: Client, directory: string) {
    this.#client = client;
    this.#directory = resolve(directory);
  }

  public async load(): Promise<void> {
    if (this.#loaded) return;

    const events: LoadedEvt[] = [];

    for (const file of await scan(this.#directory)) {
      const module = (await import(pathToFileURL(file).href)) as { default?: unknown };

      if (!isEvt(module.default)) {
        throw new TypeError(`Event file "${file}" must have a default event export.`);
      }

      events.push(module.default);
    }

    events.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
    for (const event of events) this.#listen(event);

    this.#loaded = true;
  }

  public unload(): void {
    for (const event of this.#listeners) {
      this.#client.off(event.name, event.run as never);
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

      void (async () => {
        try {
          if (event.when && !(await event.when(...args))) return;

          if (event.once) {
            done = true;
            this.#client.off(event.name, run as never);
          }

          await event.run(...args);
        } catch (error) {
          await this.#error(event, error, args);
        } finally {
          checking = false;
        }
      })();
    };

    this.#client.on(event.name, run as never);
    this.#listeners.push({ name: event.name, run });
  }

  async #error(event: LoadedEvt, error: unknown, args: unknown[]): Promise<void> {
    if (!event.error) {
      log.error(`Event "${String(event.name)}" failed.`, error);
      return;
    }

    try {
      await event.error(error, ...args);
    } catch (handlerError) {
      log.error(`Error handler for "${String(event.name)}" failed.`, handlerError);
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
