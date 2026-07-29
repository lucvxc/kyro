import type { DiscordBot } from "../core/Discord.ts";

import { compileSlash } from "./Compiler.ts";
import type { Registry } from "./Registry.ts";

export interface RegistrarOptions {
  bot: DiscordBot;
  appID: string;
  guildID?: string;
  guilds?: readonly string[];
  retries?: number;
  lock?: SyncLock;
}

export interface SyncLock {
  run<T>(key: string, operation: () => Promise<T>): Promise<T>;
}

export interface SyncDiff {
  scope: "global" | `guild:${string}`;
  added: readonly string[];
  removed: readonly string[];
  retained: readonly string[];
  updated: readonly string[];
}

export class Registrar {
  readonly #bot: DiscordBot;
  readonly #guildID: string | undefined;
  readonly #guilds: readonly string[];
  readonly #retries: number;
  readonly #lock?: SyncLock;
  #lastSync?: number;

  public constructor(options: RegistrarOptions) {
    this.#bot = options.bot;
    this.#guildID = options.guildID;
    this.#guilds = options.guilds ?? [];
    this.#retries = options.retries ?? 2;
    this.#lock = options.lock;
  }

  public get lastSync(): number | undefined {
    return this.#lastSync;
  }

  public async sync(registry: Registry): Promise<void> {
    const operation = () => this.#sync(registry);
    await (this.#lock
      ? this.#lock.run(`kyro:commands:${this.#guildID ?? "global"}`, operation)
      : operation());
    this.#lastSync = Date.now();
  }

  async #sync(registry: Registry): Promise<void> {
    const commands = registry
      .values()
      .filter((command) => command.type !== "message");

    if (this.#guildID) {
      await retry(
        () =>
          this.#bot.helpers.upsertGuildApplicationCommands(
            this.#guildID!,
            compileSlash(commands),
          ),
        this.#retries,
      );
      return;
    }

    const guilds = new Set([
      ...this.#guilds,
      ...commands.flatMap((command) => command.guilds),
    ]);
    await Promise.all([
      retry(
        () =>
          this.#bot.helpers.upsertGlobalApplicationCommands(
            compileSlash(commands.filter((command) => !command.guilds.length)),
          ),
        this.#retries,
      ),
      ...[...guilds].map((guild) =>
        retry(
          () =>
            this.#bot.helpers.upsertGuildApplicationCommands(
              guild,
              compileSlash(
                commands.filter((command) => command.guilds.includes(guild)),
              ),
            ),
          this.#retries,
        ),
      ),
    ]);
  }

  public async diff(registry: Registry): Promise<SyncDiff[]> {
    const commands = registry
      .values()
      .filter((command) => command.type !== "message");
    if (this.#guildID) {
      const current = await this.#bot.helpers.getGuildApplicationCommands(
        this.#guildID,
      );
      return [
        makeDiff(`guild:${this.#guildID}`, current, compileSlash(commands)),
      ];
    }
    const current = await this.#bot.helpers.getGlobalApplicationCommands();
    return [
      makeDiff(
        "global",
        current,
        compileSlash(commands.filter((command) => !command.guilds.length)),
      ),
    ];
  }
}

function makeDiff<
  TCurrent extends { name: string },
  TDesired extends { name: string },
>(
  scope: SyncDiff["scope"],
  current: readonly TCurrent[],
  desired: readonly TDesired[],
): SyncDiff {
  const before = new Map(current.map((item) => [item.name, item]));
  const after = new Map(desired.map((item) => [item.name, item]));
  return {
    scope,
    added: [...after.keys()].filter((name) => !before.has(name)),
    removed: [...before.keys()].filter((name) => !after.has(name)),
    retained: [...after.keys()].filter((name) => before.has(name)),
    updated: [...after.keys()].filter(
      (name) =>
        before.has(name) && shape(before.get(name)) !== shape(after.get(name)),
    ),
  };
}

function shape(value: unknown): string {
  if (!value || typeof value !== "object") return JSON.stringify(value);
  const ignored = new Set(["id", "applicationId", "guildId", "version"]);
  return JSON.stringify(
    Object.fromEntries(
      Object.entries(value).filter(
        ([key, item]) => !ignored.has(key) && item !== undefined,
      ),
    ),
  );
}

async function retry<T>(
  operation: () => Promise<T>,
  retries: number,
): Promise<T> {
  let error: unknown;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await operation();
    } catch (cause) {
      error = cause;
      if (attempt < retries)
        await new Promise((resolve) => setTimeout(resolve, 250 * 2 ** attempt));
    }
  }
  throw error;
}
