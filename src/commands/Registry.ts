import type { Cmd, CmdType, Entry } from "./Cmd.ts";
import { checkArgs } from "./Arg.ts";
import { Catalog } from "./Catalog.ts";

export interface Match {
  command: Entry;
  args: readonly string[];
}

export class Registry {
  readonly #commands = new Map<string, Entry>();
  readonly #aliases = new Map<string, Entry>();
  #sealed = false;
  #catalog: Catalog | undefined;

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

  public get catalog(): Catalog {
    return (this.#catalog ??= new Catalog(this.values()));
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
    const botPermissions = command.botPermissions ?? [];
    const guilds = [...new Set(command.guilds ?? [])].sort();
    const category = normalizeCategory(command.category ?? "general");
    const syntax =
      command.syntax?.trim() || makeSyntax(path.join(" "), command.args);

    validate(command, path, type, aliases, context, guilds);

    const name = path.join(" ");
    this.#assertAvailable(name);

    for (const alias of aliases) this.#assertAvailable(alias);
    this.#assertScope(path[0]!, type, guilds);

    const registered = Object.freeze({
      ...command,
      name,
      path,
      type,
      context,
      aliases,
      permissions,
      botPermissions,
      guilds,
      category,
      syntax,
    });
    this.#commands.set(name, registered);
    this.#catalog = undefined;

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

  public matchAs(command: Entry, input: string): Match {
    return { command, args: tokenize(input) };
  }

  public subs(input: string): readonly Entry[] {
    const name = normalize(input);
    if (!name) return [];

    return this.values().filter(
      (command) =>
        command.type !== "slash" &&
        command.meta?.help !== false &&
        [command.name, ...command.aliases].some((path) =>
          path.startsWith(`${name} `),
        ),
    );
  }

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
    this.#catalog = undefined;
  }

  #assertAvailable(name: string): void {
    if (this.#commands.has(name) || this.#aliases.has(name)) {
      throw new Error(
        `The command name or alias "${name}" is already registered.`,
      );
    }
  }

  #assertScope(root: string, type: CmdType, guilds: readonly string[]): void {
    if (type === "message") return;
    const scope = guilds.join(",");
    const conflict = this.values().find(
      (command) =>
        command.type !== "message" &&
        command.path[0] === root &&
        command.guilds.join(",") !== scope,
    );
    if (conflict)
      throw new TypeError(
        `Slash command root "${root}" must use the same guild scope for every subcommand.`,
      );
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

function normalizeCategory(value: string): string {
  const category = value.trim().toLowerCase();
  if (!category) throw new TypeError("Command categories cannot be empty.");
  return category;
}

function makeSyntax(name: string, args: Cmd["args"]): string {
  const values = Object.entries(args ?? {}).map(([key, arg]) =>
    arg.required ? `<${key}>` : `(${key})`,
  );
  return [name, ...values].join(" ");
}

function validate(
  command: Cmd,
  path: readonly string[],
  type: CmdType,
  aliases: readonly string[],
  context: Cmd["context"],
  guilds: readonly string[],
): void {
  if (typeof command.run !== "function") {
    throw new TypeError(`Command "${path.join(" ")}" requires a run function.`);
  }

  checkArgs(command.args);

  if (!command.description.trim() || command.description.length > 100) {
    throw new TypeError(
      "Command descriptions must contain between 1 and 100 characters.",
    );
  }

  if (type !== "message" && path.length > 3) {
    throw new TypeError(
      "Slash and hybrid command paths can contain at most three parts.",
    );
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
    throw new TypeError(
      "Aliases are only supported by message and hybrid commands.",
    );
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

  if (
    (command.permissions?.length || command.botPermissions?.length) &&
    context !== "guild"
  ) {
    throw new TypeError('Commands with permissions must use context: "guild".');
  }

  for (const guild of guilds) {
    if (!/^\d{15,22}$/.test(guild))
      throw new TypeError(`Command guild ID "${guild}" is invalid.`);
  }
  if (guilds.length && context !== "guild")
    throw new TypeError('Guild-scoped commands must use context: "guild".');

  for (const value of Object.values(command.nameLocalizations ?? {})) {
    if (value !== null && !/^[\p{Ll}\p{Lm}\p{Lo}\p{N}_-]{1,32}$/u.test(value))
      throw new TypeError(
        "Localized command names must be valid slash command names.",
      );
  }

  for (const value of Object.values(command.descriptionLocalizations ?? {})) {
    if (value !== null && (!value.trim() || value.length > 100))
      throw new TypeError(
        "Localized command descriptions must contain 1-100 characters.",
      );
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
