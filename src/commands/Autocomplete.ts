import {
  ApplicationCommandOptionTypes,
  type Guild,
  type InteractionDataOption,
  type User,
} from "discordeno";
import type {
  DiscordBot,
  DiscordInteraction as Interaction,
} from "../core/Discord.ts";
import { Services, type ServiceToken } from "../core/Services.ts";

export interface Choice {
  name: string;
  value: string | number;
}
export class AutocompleteContext {
  public readonly client: DiscordBot;
  public readonly user: User;
  public readonly guild: Guild | null;
  public readonly name: string;
  public readonly value: string;
  public constructor(
    public readonly interaction: Interaction,
    public readonly services: Services = new Services(),
    public readonly signal: AbortSignal = new AbortController().signal,
  ) {
    this.client = interaction.bot;
    this.user = interaction.user;
    this.guild = interaction.guildId ? interaction.guild : null;
    const focused = findFocused(interaction.data?.options ?? []);
    this.name = focused?.name ?? "";
    this.value = String(focused?.value ?? "");
  }
  public service<T>(token: ServiceToken<T>): T {
    return this.services.get(token);
  }
  public respond(choices: readonly Choice[]): Promise<void> {
    return this.interaction
      .respond({ choices: choices.slice(0, 25) })
      .then(() => undefined);
  }
}

function findFocused(
  options: InteractionDataOption[] = [],
): InteractionDataOption | undefined {
  for (const option of options) {
    if (option.focused) return option;
    if (
      option.type === ApplicationCommandOptionTypes.SubCommand ||
      option.type === ApplicationCommandOptionTypes.SubCommandGroup
    ) {
      const nested: InteractionDataOption | undefined = findFocused(
        option.options,
      );
      if (nested) return nested;
    }
  }
}
