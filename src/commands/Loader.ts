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
      const commands = Array.isArray(module.default) ? module.default : [module.default];
      if (!commands.length) throw new TypeError(`Command file "${file}" cannot export an empty array.`);

      const folder = relative(this.#directory, dirname(file)).split(sep)[0];
      for (const command of commands) {
        validate(command, file);
        this.#registry.add({
          ...command,
          category: command.category ?? (folder || "general"),
        });
      }
    }

    this.#loaded = true;
  }

  public async reload(): Promise<void> { this.#registry.reset(); this.#loaded = false; await this.load(); }
}

function validate(value: unknown, file: string): asserts value is Cmd {
  if (typeof value !== "object" || value === null) fail(file, "must export a command or command array");
  const command = value as Partial<Cmd>;
  if (!command.name?.trim()) fail(file, "has a command without a name");
  if (!command.description?.trim()) fail(file, `command "${command.name}" needs a description`);
  if (typeof command.run !== "function") fail(file, `command "${command.name}" needs a run function`);
  if (command.type && !["slash", "message", "hybrid"].includes(command.type)) fail(file, `command "${command.name}" has an invalid type`);
  if (command.context && !["both", "guild", "dms"].includes(command.context)) fail(file, `command "${command.name}" has an invalid context`);
}

function fail(file: string, issue: string): never {
  throw new TypeError(`Command file "${file}" ${issue}.`);
}
