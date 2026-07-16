import { dirname, relative, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";

import { scan } from "../core/Files.ts";
import type { Cmd } from "./Cmd.ts";
import type { Registry } from "./Registry.ts";

export class Loader {
  readonly #registry: Registry;
  readonly #directory: string;
  #loaded = false;

  public constructor(registry: Registry, directory: string) {
    this.#registry = registry;
    this.#directory = resolve(directory);
  }

  public async load(): Promise<void> {
    if (this.#loaded) return;

    const files = await scan(this.#directory);
    for (const file of files) {
      const module = (await import(pathToFileURL(file).href)) as { default?: unknown };

      if (!isCmd(module.default)) {
        throw new TypeError(`Command file "${file}" must have a default command export.`);
      }

      const folder = relative(this.#directory, dirname(file)).split(sep)[0];
      this.#registry.add({
        ...module.default,
        category: module.default.category ?? (folder || "general"),
      });
    }

    this.#loaded = true;
  }

  public async reload(): Promise<void> { this.#registry.reset(); this.#loaded = false; await this.load(); }
}

function isCmd(value: unknown): value is Cmd {
  return typeof value === "object" && value !== null;
}
