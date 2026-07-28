import { REST, Routes } from "discord.js";

import { compileSlash } from "./Compiler.ts";
import type { Registry } from "./Registry.ts";

export interface RegistrarOptions {
  token: string;
  appID: string;
  guildID?: string;
  guilds?: readonly string[];
  rest?: Pick<REST, "put">;
}

export class Registrar {
  readonly #rest: Pick<REST, "put">;
  readonly #appID: string;
  readonly #guildID: string | undefined;
  readonly #guilds: readonly string[];

  public constructor(options: RegistrarOptions) {
    this.#rest = options.rest ?? new REST().setToken(options.token);
    this.#appID = options.appID;
    this.#guildID = options.guildID;
    this.#guilds = options.guilds ?? [];
  }

  public async sync(registry: Registry): Promise<void> {
    const commands = registry
      .values()
      .filter((command) => command.type !== "message");

    if (this.#guildID) {
      await this.#rest.put(
        Routes.applicationGuildCommands(this.#appID, this.#guildID),
        { body: compileSlash(commands) },
      );
      return;
    }

    const guilds = new Set([
      ...this.#guilds,
      ...commands.flatMap((command) => command.guilds),
    ]);
    await Promise.all([
      this.#rest.put(Routes.applicationCommands(this.#appID), {
        body: compileSlash(
          commands.filter((command) => !command.guilds.length),
        ),
      }),
      ...[...guilds].map((guild) =>
        this.#rest.put(Routes.applicationGuildCommands(this.#appID, guild), {
          body: compileSlash(
            commands.filter((command) => command.guilds.includes(guild)),
          ),
        }),
      ),
    ]);
  }
}
