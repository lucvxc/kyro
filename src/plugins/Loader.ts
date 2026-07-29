import { resolve } from "node:path";
import { moduleUrl, scan } from "../core/Files.ts";
import type { Kyro } from "../Kyro.ts";
import type { Plugin } from "./Plugin.ts";
import { log } from "../core/Log.ts";
import { FrameworkError, type FrameworkErrorHandler } from "../core/Errors.ts";

export class Loader {
  readonly #items: readonly (string | Plugin)[];
  readonly #names = new Set<string>();
  readonly #loaded: Plugin[] = [];
  #loads = 0;
  readonly #onError?: FrameworkErrorHandler;
  public get size(): number {
    return this.#loaded.length;
  }
  public constructor(
    items: readonly (string | Plugin)[],
    onError?: FrameworkErrorHandler,
  ) {
    this.#items = items.map((item) =>
      typeof item === "string" ? resolve(item) : item,
    );
    this.#onError = onError;
  }
  public async load(kyro: Kyro): Promise<void> {
    try {
      for (const path of this.#items) {
        if (typeof path !== "string") {
          await this.#use(path, kyro);
          continue;
        }
        const files = await scan(path);
        for (const file of files) {
          const module = (await import(moduleUrl(file, this.#loads > 0))) as {
            default?: unknown;
          };
          const value = module.default;
          if (
            !value ||
            typeof value !== "object" ||
            typeof (value as Plugin).name !== "string" ||
            typeof (value as Plugin).setup !== "function"
          )
            throw new TypeError(`Plugin file "${file}" is invalid.`);
          await this.#use(value as Plugin, kyro);
        }
      }
      this.#loads += 1;
    } catch (error) {
      await this.unload(kyro).catch(() => undefined);
      throw error;
    }
  }

  public async unload(kyro: Kyro): Promise<void> {
    for (const item of this.#loaded.reverse()) {
      try {
        await item.stop?.(kyro);
      } catch (cause) {
        await this.#report(item.name, cause);
      }
    }
    this.#loaded.length = 0;
    this.#names.clear();
  }

  public async reload(kyro: Kyro): Promise<void> {
    await this.unload(kyro);
    await this.load(kyro);
  }

  async #use(item: Plugin, kyro: Kyro): Promise<void> {
    if (this.#names.has(item.name))
      throw new Error(`Plugin "${item.name}" is already loaded.`);
    const missing = (item.requires ?? []).filter(
      (dependency) => !this.#names.has(dependency),
    );
    if (missing.length)
      throw new Error(
        `Plugin "${item.name}" requires earlier plugin${missing.length === 1 ? "" : "s"}: ${missing.join(", ")}.`,
      );
    if (item.kyro && !compatible(kyro.version, item.kyro))
      throw new Error(
        `Plugin "${item.name}" requires Kyro ${item.kyro}; running ${kyro.version}.`,
      );
    this.#names.add(item.name);
    try {
      await item.setup(kyro);
    } catch (error) {
      this.#names.delete(item.name);
      await this.#report(item.name, error);
      throw error;
    }
    this.#loaded.push(item);
    log.info(`Plugin "${item.name}" loaded.`);
  }

  async #report(name: string, cause: unknown): Promise<void> {
    const error = new FrameworkError({
      phase: "plugin",
      route: name,
      cause,
    });
    if (this.#onError)
      await Promise.resolve(this.#onError(error)).catch(() => undefined);
    else log.error(error.message, cause);
  }
}

function compatible(version: string, range: string): boolean {
  const major = version.split(".")[0];
  const required = range.replace(/^[~^>=< ]+/, "").split(".")[0];
  return required === "*" || required === major;
}
