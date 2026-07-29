import { ApplicationCommandOptionTypes, InteractionTypes } from "discordeno";
import type {
  DiscordInteraction as Interaction,
  DiscordMessage as Message,
  DiscordRuntime,
} from "../core/Discord.ts";

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
import type { Services } from "../core/Services.ts";
import type { WorkTracker } from "../core/Work.ts";
import { FrameworkError, type FrameworkErrorHandler } from "../core/Errors.ts";
import type { MessagePolicy } from "../ui/Message.ts";
import {
  noInstrumentation,
  type Instrumentation,
} from "../core/Instrumentation.ts";

export type ErrorHandler = (
  error: unknown,
  ctx: Context,
  command: Entry,
) => void | Promise<void>;

export interface CommandReplies {
  usage?(text: string, ctx: Context): Reply | Promise<Reply>;
  error?(text: string, ctx?: Context): Reply | Promise<Reply>;
  subcommands?(
    group: string,
    commands: readonly Entry[],
    prefix: string,
    message: Message,
  ): Reply | Promise<Reply>;
}

export interface RouterOptions {
  runtime: DiscordRuntime;
  registry: Registry;
  prefix: string | PrefixResolver;
  getAlias?: AliasLookup;
  guard: Guard;
  onError?: ErrorHandler;
  middleware?: readonly Middleware[];
  replies?: CommandReplies;
  services: Services;
  work: WorkTracker;
  onFrameworkError?: FrameworkErrorHandler;
  autoDefer?: false | { after?: number; private?: boolean };
  timeout?: number;
  messagePolicy?: MessagePolicy;
  groupMiddleware?: Readonly<Record<string, readonly Middleware[]>>;
  instrumentation?: Instrumentation;
}

export class Router {
  readonly #runtime: DiscordRuntime;
  readonly #registry: Registry;
  readonly #prefix: string | PrefixResolver;
  readonly #getAlias: AliasLookup | undefined;
  readonly #guard: Guard;
  readonly #onError: ErrorHandler;
  readonly #middleware: readonly Middleware[];
  readonly #replies: CommandReplies;
  readonly #services: Services;
  readonly #work: WorkTracker;
  readonly #onFrameworkError?: FrameworkErrorHandler;
  readonly #autoDefer: false | { after?: number; private?: boolean };
  readonly #timeout: number;
  readonly #messagePolicy: MessagePolicy;
  readonly #groupMiddleware: Readonly<Record<string, readonly Middleware[]>>;
  readonly #concurrency = new Map<string, number>();
  readonly #instrumentation: Instrumentation;
  #attached = false;

  public constructor(options: RouterOptions) {
    this.#runtime = options.runtime;
    this.#registry = options.registry;
    this.#prefix = options.prefix;
    this.#getAlias = options.getAlias;
    this.#guard = options.guard;
    this.#onError = options.onError ?? logError;
    this.#middleware = options.middleware ?? [];
    this.#replies = options.replies ?? {};
    this.#services = options.services;
    this.#work = options.work;
    this.#onFrameworkError = options.onFrameworkError;
    this.#autoDefer = options.autoDefer ?? false;
    this.#timeout = options.timeout ?? 30_000;
    this.#messagePolicy = options.messagePolicy ?? {};
    this.#groupMiddleware = options.groupMiddleware ?? {};
    this.#instrumentation = options.instrumentation ?? noInstrumentation;
  }

  public attach(): void {
    if (this.#attached) return;

    this.#runtime.on("interactionCreate", this.#onInteraction);
    this.#runtime.on("messageCreate", this.#onMessage);
    this.#attached = true;
  }

  public detach(): void {
    if (!this.#attached) return;

    this.#runtime.off("interactionCreate", this.#onInteraction);
    this.#runtime.off("messageCreate", this.#onMessage);
    this.#attached = false;
  }

  readonly #onInteraction = (interaction: Interaction): void => {
    if (interaction.type === InteractionTypes.ApplicationCommandAutocomplete) {
      void this.#autocomplete(interaction);
      return;
    }
    if (interaction.type !== InteractionTypes.ApplicationCommand) return;

    const path = getPath(interaction);
    const command = this.#registry.get(path, "slash");
    if (!command) return;

    const signal = commandSignal(
      this.#work.signal,
      command.timeout ?? this.#timeout,
    );
    const ctx = new Context(
      "slash",
      interaction,
      command,
      [],
      this.#registry.catalog,
      "/",
      this.#runtime.bot,
      this.#services,
      signal,
      this.#messagePolicy,
    );
    void this.#work.run(() => this.#run(command, ctx)).catch(() => undefined);
  };

  async #autocomplete(interaction: Interaction): Promise<void> {
    const command = this.#registry.get(getPath(interaction), "slash");
    if (!command?.autocomplete) return;
    try {
      const result = await command.autocomplete(
        new AutocompleteContext(interaction, this.#services, this.#work.signal),
      );
      if (Array.isArray(result))
        await interaction.respond({ choices: result.slice(0, 25) });
      else if (!interaction.acknowledged)
        await interaction.respond({ choices: [] });
    } catch (error) {
      await this.#report(
        new FrameworkError({
          phase: "autocomplete",
          route: command.name,
          cause: error,
          userId: interaction.user.id,
          guildId: interaction.guildId,
          interactionId: interaction.id,
        }),
      );
      if (!interaction.acknowledged)
        await interaction.respond({ choices: [] }).catch(() => undefined);
    }
  }

  readonly #onMessage = (message: Message): void => {
    void this.#message(message).catch((cause) =>
      this.#report(
        new FrameworkError({
          phase: "command",
          route: "message-routing",
          cause,
          userId: message.author.id,
          guildId: message.guildId,
        }),
      ),
    );
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
      await this.#runtime.bot.helpers.sendMessage(message.channelId, {
        ...messageOptions(reply),
        messageReference: { messageId: message.id, failIfNotExists: false },
      });
      return;
    }

    const signal = commandSignal(
      this.#work.signal,
      match.command.timeout ?? this.#timeout,
    );
    const ctx = new Context(
      "message",
      message,
      match.command,
      match.args,
      this.#registry.catalog,
      prefix,
      this.#runtime.bot,
      this.#services,
      signal,
      this.#messagePolicy,
    );
    void this.#work
      .run(() => this.#run(match.command, ctx))
      .catch(() => undefined);
  }

  async #run(command: Entry, ctx: Context): Promise<void> {
    const span = this.#instrumentation.start("kyro.command", {
      command: command.name,
      source: ctx.source,
      userId: ctx.author.id,
      guildId: ctx.guildId,
    });
    let failure: unknown;
    const concurrencyKey = concurrencyKeyFor(command, ctx);
    if (concurrencyKey) {
      const active = this.#concurrency.get(concurrencyKey) ?? 0;
      if (active >= command.concurrency!.max) {
        await ctx.reply(
          await this.#error(
            "That command is already busy. Try again shortly.",
            ctx,
          ),
        );
        span.end();
        return;
      }
      this.#concurrency.set(concurrencyKey, active + 1);
    }
    const autoDefer = command.autoDefer ?? this.#autoDefer;
    const timer =
      ctx.interaction && autoDefer
        ? setTimeout(
            () => {
              if (!ctx.interaction?.acknowledged)
                void ctx
                  .defer(typeof autoDefer === "object" && autoDefer.private)
                  .catch(() => undefined);
            },
            typeof autoDefer === "object" ? (autoDefer.after ?? 2_000) : 2_000,
          )
        : undefined;
    try {
      await runMiddleware(
        [
          ...this.#middleware,
          ...(this.#groupMiddleware[command.category] ?? []),
          ...(this.#groupMiddleware[command.path[0]!] ?? []),
          ...(command.middleware ?? []),
        ],
        ctx,
        () => this.#runCommand(command, ctx),
      );
    } catch (error) {
      failure = error;
      if (error instanceof UserError) {
        await ctx
          .reply(await this.#error(error.message, ctx))
          .catch(() => undefined);
        return;
      }

      await Promise.resolve(this.#onError(error, ctx, command)).catch(
        () => undefined,
      );
      await this.#report(
        new FrameworkError({
          phase: "command",
          route: command.name,
          cause: error,
          userId: ctx.author.id,
          guildId: ctx.guildId,
          interactionId: ctx.interaction?.id,
        }),
      );
      if (ctx.source === "slash" && !ctx.interaction?.acknowledged) {
        await ctx
          .reply(
            await this.#error(
              "Something went wrong while running that command.",
              ctx,
            ),
          )
          .catch(() => undefined);
      }
    } finally {
      if (timer) clearTimeout(timer);
      span.end(failure);
      if (concurrencyKey) {
        const active = (this.#concurrency.get(concurrencyKey) ?? 1) - 1;
        if (active > 0) this.#concurrency.set(concurrencyKey, active);
        else this.#concurrency.delete(concurrencyKey);
      }
    }
  }

  async #runCommand(command: Entry, ctx: Context): Promise<void> {
    const blocked = await this.#guard.check(command, ctx);
    if (blocked === null) return;
    if (blocked) {
      await ctx.reply(await this.#error(blocked, ctx));
      return;
    }

    if (ctx.issue) {
      await ctx.reply(
        this.#replies.usage
          ? await this.#replies.usage(
              `\`${ctx.prefix}${ctx.command.syntax}\``,
              ctx,
            )
          : `Usage: \`${ctx.prefix}${ctx.command.syntax}\``,
      );
      return;
    }

    await command.run(ctx);
  }

  async #error(message: string, ctx?: Context): Promise<Reply> {
    return this.#replies.error ? this.#replies.error(message, ctx) : message;
  }

  async #report(error: FrameworkError): Promise<void> {
    if (this.#onFrameworkError)
      await Promise.resolve(this.#onFrameworkError(error)).catch(
        () => undefined,
      );
    else log.error(error.message, error.cause);
  }
}

function concurrencyKeyFor(command: Entry, ctx: Context): string | undefined {
  const policy = command.concurrency;
  if (!policy) return undefined;
  if (!Number.isInteger(policy.max) || policy.max < 1)
    throw new TypeError(`Command "${command.name}" has invalid concurrency.`);
  const scope = policy.scope ?? "global";
  const subject =
    scope === "user"
      ? ctx.author.id
      : scope === "guild"
        ? (ctx.guildId ?? "dm")
        : scope === "channel"
          ? ctx.channelId
          : "global";
  return `${command.name}:${scope}:${subject}`;
}

function commandSignal(parent: AbortSignal, timeout: number): AbortSignal {
  return timeout > 0
    ? AbortSignal.any([parent, AbortSignal.timeout(timeout)])
    : parent;
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

function getPath(interaction: Interaction): string {
  const names = [interaction.data?.name];
  let options = interaction.data?.options;
  while (
    options?.[0] &&
    (options[0].type === ApplicationCommandOptionTypes.SubCommand ||
      options[0].type === ApplicationCommandOptionTypes.SubCommandGroup)
  ) {
    names.push(options[0].name);
    options = options[0].options;
  }
  return names.filter((name): name is string => Boolean(name)).join(" ");
}

function logError(error: unknown, _ctx: Context, command: Entry): void {
  log.error(`Command "${command.name}" failed.`, error);
}

function defaultSubs(commands: readonly Entry[], prefix: string): string {
  return commands
    .map((command) => `**${prefix}${command.syntax}**\n${command.description}`)
    .join("\n\n");
}
