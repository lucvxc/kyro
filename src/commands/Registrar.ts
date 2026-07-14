import { REST, Routes } from "discord.js";

import { compileSlash } from "./Compiler.ts";
import type { Registry } from "./Registry.ts";

export interface RegistrarOptions {
  token: string;
  appID: string;
  guildID?: string;
}

export class Registrar {
  readonly #rest: REST;
  readonly #appID: string;
  readonly #guildID: string | undefined;

  public constructor(options: RegistrarOptions) {
    this.#rest = new REST().setToken(options.token);
    this.#appID = options.appID;
    this.#guildID = options.guildID;
  }

  public async sync(registry: Registry): Promise<void> {
    const body = compileSlash(registry.values());
    if (body.length === 0) return;

    const route = this.#guildID
      ? Routes.applicationGuildCommands(this.#appID, this.#guildID)
      : Routes.applicationCommands(this.#appID);
    await this.#rest.put(route, { body });
  }
}
