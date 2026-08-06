import type {
  DiscordInteraction as Interaction,
  DiscordRuntime,
} from "../core/Discord.ts";
import { log } from "../core/Log.ts";
import { UserError } from "../commands/Errors.ts";
import { permissionError } from "../commands/Guard.ts";
import { missingPermissions } from "../guild/Permissions.ts";
import { ComponentContext } from "./Context.ts";
import { isComponentInteraction } from "./Cmp.ts";
import type { Loader } from "./Loader.ts";
import type { Services } from "../core/Services.ts";
import type { WorkTracker } from "../core/Work.ts";
import { FrameworkError, type FrameworkErrorHandler } from "../core/Errors.ts";
import {
  MemoryRateLimitAdapter,
  validateRateLimit,
} from "../core/RateLimit.ts";
import type { Cmp, CmpContext, ComponentMiddleware } from "./Cmp.ts";
import type { MessagePolicy } from "../ui/Message.ts";
import {
  noInstrumentation,
  type Instrumentation,
} from "../core/Instrumentation.ts";

export interface ComponentRouterOptions {
  runtime: DiscordRuntime;
  loader: Loader;
  services: Services;
  work: WorkTracker;
  cooldown?: number;
  middleware?: readonly ComponentMiddleware[];
  onError?: FrameworkErrorHandler;
  timeout?: number;
  messagePolicy?: MessagePolicy;
  instrumentation?: Instrumentation;
}

export class Router {
  readonly #runtime: DiscordRuntime;
  readonly #loader: Loader;
  readonly #cooldown: number;
  readonly #uses = new Map<string, { expires: number; warned: boolean }>();
  readonly #services: Services;
  readonly #work: WorkTracker;
  readonly #middleware: readonly ComponentMiddleware[];
  readonly #onError?: FrameworkErrorHandler;
  readonly #timeout: number;
  readonly #messagePolicy: MessagePolicy;
  readonly #instrumentation: Instrumentation;
  readonly #rateLimits = new MemoryRateLimitAdapter();
  #attached = false;

  public constructor(options: ComponentRouterOptions) {
    this.#runtime = options.runtime;
    this.#loader = options.loader;
    this.#cooldown = (options.cooldown ?? 0) * 1_000;
    this.#services = options.services;
    this.#work = options.work;
    this.#middleware = options.middleware ?? [];
    this.#onError = options.onError;
    this.#timeout = options.timeout ?? 30_000;
    this.#messagePolicy = options.messagePolicy ?? {};
    this.#instrumentation = options.instrumentation ?? noInstrumentation;
  }
  public attach(): void {
    if (!this.#attached) {
      this.#runtime.on("interactionCreate", this.#onInteraction);
      this.#attached = true;
    }
  }
  public detach(): void {
    if (this.#attached) {
      this.#runtime.off("interactionCreate", this.#onInteraction);
      this.#attached = false;
    }
  }

  readonly #onInteraction = (interaction: Interaction): void => {
    if (!isComponentInteraction(interaction)) return;
    const id = interaction.data?.customId;
    if (!id) return;
    const match = this.#loader.get(id);
    if (!match) return;
    const item = match.item;
    const timeout = item.timeout ?? this.#timeout;
    const signal =
      timeout > 0
        ? AbortSignal.any([this.#work.signal, AbortSignal.timeout(timeout)])
        : this.#work.signal;
    const ctx = new ComponentContext(
      interaction,
      id,
      match.params,
      this.#services,
      signal,
      this.#messagePolicy,
    );
    void this.#work
      .run(() => this.#run(item, ctx))
      .catch((error) => this.#unexpected(item, ctx, error));
  };

  async #run(item: Cmp, ctx: ComponentContext): Promise<void> {
    const interaction = ctx.interaction;
    const wait = item.cooldown ?? this.#cooldown / 1_000;
    if (wait > 0) {
      const key = `${String(item.id)}:${interaction.user.id}`;
      const now = Date.now();
      const active = this.#uses.get(key);
      if (active && active.expires > now) {
        if (active.warned) return;
        active.warned = true;
        return void interaction.respond(
          {
            content: `Try again in ${Math.ceil((active.expires - now) / 1_000)}s.`,
          },
          { isPrivate: true },
        );
      }
      this.#uses.set(key, { expires: now + wait * 1_000, warned: false });
    }
    if (item.rateLimit) {
      validateRateLimit(item.rateLimit);
      const scope = item.rateLimit.scope ?? "user";
      const subject =
        scope === "global"
          ? "global"
          : scope === "guild"
            ? String(interaction.guildId ?? "dm")
            : scope === "channel"
              ? String(interaction.channelId)
              : String(interaction.user.id);
      const retry = await (item.rateLimit.adapter ?? this.#rateLimits).consume(
        `${String(item.id)}:${scope}:${subject}`,
        item.rateLimit.limit,
        item.rateLimit.window * 1_000,
      );
      if (retry) return void (await ctx.private(`Try again in ${retry}s.`));
    }
    if (item.context === "guild" && !interaction.guildId)
      return void interaction.respond(
        {
          content: "This component can only be used in a server.",
        },
        { isPrivate: true },
      );
    if (item.context === "dms" && interaction.guildId)
      return void interaction.respond(
        {
          content: "This component can only be used in DMs.",
        },
        { isPrivate: true },
      );
    if (item.permissions?.length) {
      const missing = missingPermissions(
        interaction.member?.permissions?.bitfield,
        item.permissions,
      );
      if (missing.length)
        return void interaction.respond(
          {
            content: permissionError(missing),
          },
          { isPrivate: true },
        );
    }
    if (item.botPermissions?.length) {
      const missing = missingPermissions(
        interaction.appPermissions,
        item.botPermissions,
      );
      if (missing.length)
        return void interaction.respond(
          {
            content: permissionError(missing, true),
          },
          { isPrivate: true },
        );
    }
    if (!(await owns(item, ctx)))
      return void (await ctx.private("This control belongs to another user."));
    const span = this.#instrumentation.start("kyro.component", {
      component: String(item.id),
      userId: ctx.user.id,
      guildId: ctx.interaction.guildId,
    });
    let failure: unknown;
    try {
      await runComponentMiddleware(
        [...this.#middleware, ...(item.middleware ?? [])],
        ctx,
        () => Promise.resolve(item.run(ctx)),
      );
    } catch (error) {
      failure = error;
      if (item.error)
        await Promise.resolve(item.error(error, ctx)).catch(() => undefined);
      else if (error instanceof UserError) {
        if (!interaction.acknowledged) await ctx.private(error.message);
      } else {
        const wrapped = new FrameworkError({
          phase: "component",
          route: String(item.id),
          cause: error,
          userId: interaction.user.id,
          guildId: interaction.guildId,
          interactionId: interaction.id,
        });
        if (this.#onError)
          await Promise.resolve(this.#onError(wrapped)).catch(() => undefined);
        else log.error(wrapped.message, error);
      }
    } finally {
      span.end(failure);
    }
  }

  async #unexpected(
    item: Cmp,
    ctx: ComponentContext,
    cause: unknown,
  ): Promise<void> {
    const error = new FrameworkError({
      phase: "component",
      route: String(item.id),
      cause,
      userId: ctx.user.id,
      guildId: ctx.interaction.guildId,
      interactionId: ctx.interaction.id,
    });
    if (this.#onError)
      await Promise.resolve(this.#onError(error)).catch(() => undefined);
    else log.error(error.message, cause);
  }
}

async function owns(item: Cmp, ctx: CmpContext): Promise<boolean> {
  if (item.owner === undefined) return true;
  const expected =
    typeof item.owner === "function" ? await item.owner(ctx) : item.owner;
  return typeof expected === "boolean"
    ? expected
    : String(expected) === String(ctx.user.id);
}

async function runComponentMiddleware(
  middleware: readonly ComponentMiddleware[],
  ctx: CmpContext,
  run: () => Promise<void>,
  index = 0,
): Promise<void> {
  const current = middleware[index];
  if (!current) return run();
  await current(ctx, () =>
    runComponentMiddleware(middleware, ctx, run, index + 1),
  );
}
