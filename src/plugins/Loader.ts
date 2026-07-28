import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { scan } from "../core/Files.ts";
import type { Kyro } from "../Kyro.ts";
import type { Plugin } from "./Plugin.ts";
import { log } from "../core/Log.ts";

export class Loader {
  readonly #items: readonly (string | Plugin)[];
  readonly #names = new Set<string>();
  readonly #loaded: Plugin[] = [];
  public constructor(items: readonly (string | Plugin)[]) {
    this.#items = items.map((item) =>
      typeof item === "string" ? resolve(item) : item,
    );
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
          const module = (await import(pathToFileURL(file).href)) as {
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
    } catch (error) {
      await this.unload(kyro).catch(() => undefined);
      throw error;
    }
  }

  public async unload(kyro: Kyro): Promise<void> {
    for (const item of this.#loaded.reverse()) await item.stop?.(kyro);
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
    this.#names.add(item.name);
    try {
      await item.setup(kyro);
    } catch (error) {
      this.#names.delete(item.name);
      throw error;
    }
    this.#loaded.push(item);
    log.info(`Plugin "${item.name}" loaded.`);
  }
}
