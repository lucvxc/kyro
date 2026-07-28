import {
  Events,
  type ChatInputCommandInteraction,
  type AutocompleteInteraction,
  type Client,
  type Interaction,
  type Message,
} from "discord.js";

import type { Entry } from "./Cmd.ts";
import { Context, type Reply } from "./Context.ts";
import { messageOptions } from "../ui/Message.ts";
import type { Guard } from "./Guard.ts";
import type { Registry } from "./Registry.ts";
import { log } from "../core/Log.ts";
import { AutocompleteContext } from "./Autocomplete.ts";
import { UserError } from "./Errors.ts";
import type { Middleware } from "./Middleware.ts";
import type { AliasLookup, PrefixResolver } from "./RouterTypes.ts";

export type ErrorHandler = (
  error: unknown,
  ctx: Context,
  command: Entry,
) => void | Promise<void>;

export interface CommandReplies {
  usage?(text: string): Reply | Promise<Reply>;
  error?(text: string): Reply | Promise<Reply>;
  subcommands?(
    group: string,
    commands: readonly Entry[],
    prefix: string,
    message: Message,
  ): Reply | Promise<Reply>;
}

export interface RouterOptions {
  client: Client;
  registry: Registry;
  prefix: string | PrefixResolver;
  getAlias?: AliasLookup;
  guard: Guard;
  onError?: ErrorHandler;
  middleware?: readonly Middleware[];
  replies?: CommandReplies;
}

export class Router {
  readonly #client: Client;
  readonly #registry: Registry;
  readonly #prefix: string | PrefixResolver;
  readonly #getAlias: AliasLookup | undefined;
  readonly #guard: Guard;
  readonly #onError: ErrorHandler;
  readonly #middleware: readonly Middleware[];
  readonly #replies: CommandReplies;
  #attached = false;

  public constructor(options: RouterOptions) {
    this.#client = options.client;
    this.#registry = options.registry;
    this.#prefix = options.prefix;
    this.#getAlias = options.getAlias;
    this.#guard = options.guard;
    this.#onError = options.onError ?? logError;
    this.#middleware = options.middleware ?? [];
    this.#replies = options.replies ?? {};
  }

  public attach(): void {
    if (this.#attached) return;

    this.#client.on(Events.InteractionCreate, this.#onInteraction);
    this.#client.on(Events.MessageCreate, this.#onMessage);
    this.#attached = true;
  }

  public detach(): void {
    if (!this.#attached) return;

    this.#client.off(Events.InteractionCreate, this.#onInteraction);
    this.#client.off(Events.MessageCreate, this.#onMessage);
    this.#attached = false;
  }

  readonly #onInteraction = (interaction: Interaction): void => {
    if (interaction.isAutocomplete()) {
      void this.#autocomplete(interaction);
      return;
    }
    if (!interaction.isChatInputCommand()) return;

    const path = getPath(interaction);
    const command = this.#registry.get(path, "slash");
    if (!command) return;

    const ctx = new Context(
      "slash",
      interaction,
      command,
      [],
      this.#registry.catalog,
    );
    void this.#run(command, ctx);
  };

  async #autocomplete(interaction: AutocompleteInteraction): Promise<void> {
    const command = this.#registry.get(getPath(interaction), "slash");
    if (!command?.autocomplete) return;
    try {
      const result = await command.autocomplete(
        new AutocompleteContext(interaction),
      );
      if (Array.isArray(result))
        await interaction.respond(result.slice(0, 25) as never);
      else if (!interaction.responded) await interaction.respond([]);
    } catch (error) {
      log.error(`Autocomplete for "${command.name}" failed.`, error);
      if (!interaction.responded)
        await interaction.respond([]).catch(() => undefined);
    }
  }

  readonly #onMessage = (message: Message): void => {
    void this.#message(message);
  };

  async #message(message: Message): Promise<void> {
    if (message.author.bot) return;
    const input = message.content;
    const available =
      typeof this.#prefix === "function"
        ? await this.#prefix(message)
        : this.#prefix;
    const prefixes = typeof available === "string" ? [available] : available;
    const prefix = prefixes.find((value) => input.startsWith(value));
    if (!prefix) return;
    const body = input.slice(prefix.length).trim();
    let match = this.#registry.match(body);
    if (!match && this.#getAlias) {
      const name = await this.#getAlias(message, body);
      const command = name ? this.#registry.get(name, "message") : undefined;
      if (command)
        match = this.#registry.matchAs(
          command,
          body.split(/\s+/).slice(1).join(" "),
        );
    }
    if (!match) {
      const commands = this.#registry.subs(body);
      if (commands.length < 2) return;
      const reply = this.#replies.subcommands
        ? await this.#replies.subcommands(body, commands, prefix, message)
        : defaultSubs(commands, prefix);
      await message.reply(messageOptions(reply) as never);
      return;
    }

    const ctx = new Context(
      "message",
      message,
      match.command,
      match.args,
      this.#registry.catalog,
      prefix,
    );
    void this.#run(match.command, ctx);
  }

  async #run(command: Entry, ctx: Context): Promise<void> {
    try {
      await runMiddleware(this.#middleware, ctx, () =>
        this.#runCommand(command, ctx),
      );
    } catch (error) {
      if (error instanceof UserError) {
        await ctx
          .reply(await this.#error(error.message))
          .catch(() => undefined);
        return;
      }

      await this.#onError(error, ctx, command);
      if (
        ctx.source === "slash" &&
        !ctx.interaction?.replied &&
        !ctx.interaction?.deferred
      ) {
        await ctx
          .reply(
            await this.#error(
              "Something went wrong while running that command.",
            ),
          )
          .catch(() => undefined);
      }
    }
  }

  async #runCommand(command: Entry, ctx: Context): Promise<void> {
    const blocked = await this.#guard.check(command, ctx);
    if (blocked === null) return;
    if (blocked) {
      await ctx.reply(await this.#error(blocked));
      return;
    }

    if (ctx.issue) {
      await ctx.reply(
        this.#replies.usage
          ? await this.#replies.usage(`\`${ctx.prefix}${ctx.command.syntax}\``)
          : `Usage: \`${ctx.prefix}${ctx.command.syntax}\``,
      );
      return;
    }

    await command.run(ctx);
  }

  async #error(message: string): Promise<Reply> {
    return this.#replies.error ? this.#replies.error(message) : message;
  }
}

async function runMiddleware(
  middleware: readonly Middleware[],
  ctx: Context,
  run: () => void | Promise<void>,
  index = 0,
): Promise<void> {
  const current = middleware[index];
  if (!current) {
    await run();
    return;
  }
  await current(ctx, () => runMiddleware(middleware, ctx, run, index + 1));
}

function getPath(
  interaction: ChatInputCommandInteraction | AutocompleteInteraction,
): string {
  const group = interaction.options.getSubcommandGroup(false);
  const subcommand = interaction.options.getSubcommand(false);

  return [interaction.commandName, group, subcommand].filter(Boolean).join(" ");
}

function logError(error: unknown, _ctx: Context, command: Entry): void {
  log.error(`Command "${command.name}" failed.`, error);
}

function defaultSubs(commands: readonly Entry[], prefix: string): string {
  return commands
    .map((command) => `**${prefix}${command.syntax}**\n${command.description}`)
    .join("\n\n");
}
