import type { AutocompleteInteraction, Client, User, Guild } from "discord.js";

export interface Choice { name: string; value: string | number; }
export class AutocompleteContext {
  public readonly client: Client;
  public readonly user: User;
  public readonly guild: Guild | null;
  public readonly name: string;
  public readonly value: string;
  public constructor(public readonly interaction: AutocompleteInteraction) {
    this.client = interaction.client;
    this.user = interaction.user;
    this.guild = interaction.guild;
    const focused = interaction.options.getFocused(true);
    this.name = focused.name;
    this.value = String(focused.value);
  }
  public respond(choices: readonly Choice[]): Promise<void> {
    return this.interaction.respond(choices.slice(0, 25) as Choice[]);
  }
}
