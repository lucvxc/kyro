import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { scan } from "../core/Files.ts";
import type { Cmp } from "./Cmp.ts";

export class Loader {
  readonly #directory: string;
  readonly #items: Cmp[] = [];
  #loaded = false;

  public constructor(directory: string) { this.#directory = resolve(directory); }

  public async load(): Promise<void> {
    if (this.#loaded) return;
    for (const file of await scan(this.#directory)) {
      const module = await import(pathToFileURL(file).href) as { default?: unknown };
      const value = module.default;
      if (!value || typeof value !== "object" || typeof (value as Cmp).id !== "string" || typeof (value as Cmp).run !== "function") {
        throw new TypeError(`Component file "${file}" must have a default component export.`);
      }
      const item = value as Cmp;
      if (this.#items.some(existing => String(existing.id) === String(item.id))) throw new Error(`Duplicate component id "${item.id}".`);
      this.#items.push(item);
    }
    this.#loaded = true;
  }

  public get(id: string): { item: Cmp; params: string[] } | undefined {
    for (const item of this.#items) {
      if (typeof item.id === "string") {
        const base = item.id.split(":");
        if (id.split(":").slice(0, base.length).join(":") === item.id) return { item, params: id.split(":").slice(base.length) };
      } else { const match = id.match(item.id); if (match) return { item, params: match.slice(1) }; }
    }
    return undefined;
  }
}
