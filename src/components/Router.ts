import {
  Events,
  MessageFlags,
  type Client,
  type Interaction,
} from "discord.js";
import { log } from "../core/Log.ts";
import { UserError } from "../commands/Errors.ts";
import { ComponentContext } from "./Context.ts";
import { isComponentInteraction } from "./Cmp.ts";
import type { Loader } from "./Loader.ts";

export class Router {
  readonly #client: Client;
  readonly #loader: Loader;
  readonly #cooldown: number;
  readonly #uses = new Map<string, { expires: number; warned: boolean }>();
  #attached = false;

  public constructor(client: Client, loader: Loader, cooldown = 0) {
    this.#client = client;
    this.#loader = loader;
    this.#cooldown = cooldown * 1_000;
  }
  public attach(): void {
    if (!this.#attached) {
      this.#client.on(Events.InteractionCreate, this.#onInteraction);
      this.#attached = true;
    }
  }
  public detach(): void {
    if (this.#attached) {
      this.#client.off(Events.InteractionCreate, this.#onInteraction);
      this.#attached = false;
    }
  }

  readonly #onInteraction = (interaction: Interaction): void => {
    if (!isComponentInteraction(interaction)) return;
    const match = this.#loader.get(interaction.customId);
    if (!match) return;
    const item = match.item;
    const wait = item.cooldown ?? this.#cooldown / 1_000;
    if (wait > 0) {
      const key = `${String(item.id)}:${interaction.user.id}`;
      const now = Date.now();
      const active = this.#uses.get(key);
      if (active && active.expires > now) {
        if (active.warned) return;
        active.warned = true;
        return void interaction.reply({
          content: `Try again in ${Math.ceil((active.expires - now) / 1_000)}s.`,
          flags: MessageFlags.Ephemeral,
        });
      }
      this.#uses.set(key, { expires: now + wait * 1_000, warned: false });
    }
    if (item.context === "guild" && !interaction.guild)
      return void interaction.reply({
        content: "This component can only be used in a server.",
        flags: MessageFlags.Ephemeral,
      });
    if (item.context === "dms" && interaction.guild)
      return void interaction.reply({
        content: "This component can only be used in DMs.",
        flags: MessageFlags.Ephemeral,
      });
    if (item.permissions?.length) {
      const missing =
        interaction.memberPermissions?.missing(item.permissions) ?? [];
      if (missing.length)
        return void interaction.reply({
          content: `Missing permissions: ${missing.join(", ")}.`,
          flags: MessageFlags.Ephemeral,
        });
    }
    const ctx = new ComponentContext(interaction, interaction.customId);
    void Promise.resolve(item.run(ctx)).catch(async (error) => {
      if (item.error) await item.error(error, ctx);
      else if (error instanceof UserError) {
        const response = {
          content: error.message,
          flags: MessageFlags.Ephemeral,
        } as const;
        if (interaction.replied || interaction.deferred)
          await interaction.followUp(response);
        else await interaction.reply(response);
      } else log.error(`Component "${String(item.id)}" failed.`, error);
    });
  };
}
