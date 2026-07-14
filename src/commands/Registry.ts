import type { Cmd, CmdType, Entry } from "./Cmd.ts";
import { checkArgs } from "./Arg.ts";

export interface Match {
  command: Entry;
  args: readonly string[];
}

export class Registry {
  readonly #commands = new Map<string, Entry>();
  readonly #aliases = new Map<string, Entry>();
  #sealed = false;

  public get size(): number {
    return this.#commands.size;
  }

  public get hasGuildMessages(): boolean {
    return this.values().some(
      (command) => command.type !== "slash" && command.context !== "dms",
    );
  }

  public get hasDMs(): boolean {
    return this.values().some(
      (command) => command.type !== "slash" && command.context !== "guild",
    );
  }

  public add(command: Cmd): this {
    if (this.#sealed) {
      throw new Error("Commands must be added before Kyro starts.");
    }

    const path = parsePath(command.name);
    const type = command.type ?? "slash";
    const context = command.context ?? "both";
    const aliases = (command.aliases ?? []).map(normalize);
    const permissions = command.permissions ?? [];

    validate(command, path, type, aliases, context);

    const name = path.join(" ");
    this.#assertAvailable(name);

    for (const alias of aliases) this.#assertAvailable(alias);

    const registered = Object.freeze({
      ...command,
      name,
      path,
      type,
      context,
      aliases,
      permissions,
    });
    this.#commands.set(name, registered);

    for (const alias of aliases) this.#aliases.set(alias, registered);
    return this;
  }

  public get(path: string, source: "slash" | "message"): Entry | undefined {
    const name = normalize(path);
    const command =
      this.#commands.get(name) ??
      (source === "message" ? this.#aliases.get(name) : undefined);

    if (!command) return undefined;

    const supportsSource =
      command.type === "hybrid" ||
      (source === "slash" && command.type === "slash") ||
      (source === "message" && command.type === "message");

    return supportsSource ? command : undefined;
  }

  public match(input: string): Match | undefined {
    const tokens = tokenize(input);

    for (let length = tokens.length; length > 0; length -= 1) {
      const command = this.get(tokens.slice(0, length).join(" "), "message");
      if (command) {
        return { command, args: tokens.slice(length) };
      }
    }

    return undefined;
  }

  public matchAs(command: Entry, input: string): Match { return { command, args: tokenize(input) }; }

  public values(): Entry[] {
    return [...this.#commands.values()];
  }

  public seal(): void {
    this.#sealed = true;
  }

  public reset(): void {
    this.#commands.clear();
    this.#aliases.clear();
    this.#sealed = false;
  }

  #assertAvailable(name: string): void {
    if (this.#commands.has(name) || this.#aliases.has(name)) {
      throw new Error(`The command name or alias "${name}" is already registered.`);
    }
  }
}

function parsePath(name: string): readonly string[] {
  const path = normalize(name).split(" ").filter(Boolean);

  if (path.length === 0) {
    throw new TypeError("A command name cannot be empty.");
  }

  return path;
}

function normalize(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

function validate(
  command: Cmd,
  path: readonly string[],
  type: CmdType,
  aliases: readonly string[],
  context: Cmd["context"],
): void {
  if (typeof command.run !== "function") {
    throw new TypeError(`Command "${path.join(" ")}" requires a run function.`);
  }

  checkArgs(command.args);

  if (!command.description.trim() || command.description.length > 100) {
    throw new TypeError("Command descriptions must contain between 1 and 100 characters.");
  }

  if (type !== "message" && path.length > 3) {
    throw new TypeError("Slash and hybrid command paths can contain at most three parts.");
  }

  if (type !== "message") {
    for (const part of path) {
      if (!/^[a-z0-9_-]{1,32}$/.test(part)) {
        throw new TypeError(
          `Slash command path part "${part}" must use 1-32 lowercase letters, numbers, hyphens, or underscores.`,
        );
      }
    }
  }

  if (type === "slash" && aliases.length > 0) {
    throw new TypeError("Aliases are only supported by message and hybrid commands.");
  }

  if (new Set(aliases).size !== aliases.length) {
    throw new TypeError("A command cannot contain duplicate aliases.");
  }

  if (aliases.includes(path.join(" "))) {
    throw new TypeError("A command alias cannot match its primary name.");
  }

  if (aliases.some((alias) => !alias)) {
    throw new TypeError("Command aliases cannot be empty.");
  }

  if (!context || !["both", "guild", "dms"].includes(context)) {
    throw new TypeError('Command context must be "both", "guild", or "dms".');
  }

  if (command.permissions?.length && context !== "guild") {
    throw new TypeError('Commands with permissions must use context: "guild".');
  }
}

function tokenize(input: string): string[] {
  const matches = input.trim().match(/"[^"]*"|'[^']*'|\S+/g) ?? [];

  return matches.map((token) => {
    const isQuoted =
      (token.startsWith('"') && token.endsWith('"')) ||
      (token.startsWith("'") && token.endsWith("'"));

    return isQuoted ? token.slice(1, -1) : token;
  });
}
