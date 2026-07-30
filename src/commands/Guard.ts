import { BitwisePermissionFlags } from "discordeno";
import type { Context } from "./Context.ts";
import type { Entry } from "./Cmd.ts";
import {
  MemoryRateLimitAdapter,
  type RateLimitPolicy,
  validateRateLimit,
} from "../core/RateLimit.ts";

export type PermissionResolver = (
  ctx: Context,
  missing: readonly string[],
) => boolean | Promise<boolean>;

export class Guard {
  readonly #cooldown: number;
  readonly #permissions: PermissionResolver | undefined;
  readonly #uses = new Map<string, { expires: number; warned: boolean }>();
  readonly #rateLimit?: RateLimitPolicy;
  readonly #defaultAdapter = new MemoryRateLimitAdapter();

  public constructor(
    cooldown = 0,
    permissions?: PermissionResolver,
    rateLimit?: RateLimitPolicy,
  ) {
    this.#cooldown = cooldown * 1_000;
    this.#permissions = permissions;
    if (rateLimit) validateRateLimit(rateLimit);
    this.#rateLimit = rateLimit;
  }

  public async check(
    command: Entry,
    ctx: Context,
  ): Promise<string | null | undefined> {
    if (command.context === "guild" && !ctx.guild) {
      return "This command can only be used in a server.";
    }

    if (command.context === "dms" && ctx.guild) {
      return "This command can only be used in DMs.";
    }

    if (command.permissions.length > 0) {
      const permissions =
        ctx.interaction?.member?.permissions ??
        ctx.message?.member?.permissions;
      const missing = permissions?.missing([...command.permissions]) ?? [];

      if (missing.length > 0 && !(await this.#permissions?.(ctx, missing))) {
        const names = missing.map((name) =>
          name.replace(/([a-z])([A-Z])/g, "$1 $2"),
        );
        return permissionError(names);
      }
    }

    if (command.botPermissions.length > 0) {
      const permissions = ctx.interaction?.appPermissions;
      const missing = command.botPermissions.filter(
        (permission) =>
          permissions === undefined ||
          (permissions & BitwisePermissionFlags[permission]) !==
            BitwisePermissionFlags[permission],
      );
      if (missing.length > 0) {
        const names = missing.map((name) =>
          name.replace(/([a-z])([A-Z])/g, "$1 $2"),
        );
        return permissionError(names, true);
      }
    }

    const policy = command.rateLimit ?? this.#rateLimit;
    if (policy) {
      validateRateLimit(policy);
      const scope = policy.scope ?? "user";
      const subject =
        scope === "global"
          ? "global"
          : scope === "guild"
            ? String(ctx.guildId ?? "dm")
            : scope === "channel"
              ? String(ctx.channelId)
              : String(ctx.author.id);
      const adapter = policy.adapter ?? this.#defaultAdapter;
      const retry = await adapter.consume(
        `${command.name}:${scope}:${subject}`,
        policy.limit,
        policy.window * 1_000,
      );
      if (retry > 0) return `Try again in ${retry}s.`;
      return undefined;
    }

    if (this.#cooldown <= 0) return undefined;

    const now = Date.now();
    const key = `${command.name}:${ctx.author.id}`;
    const active = this.#uses.get(key);

    if (active && active.expires > now) {
      if (active.warned) return null;

      active.warned = true;
      return `Try again in ${Math.ceil((active.expires - now) / 1_000)}s.`;
    }

    this.#uses.set(key, {
      expires: now + this.#cooldown,
      warned: false,
    });
    if (this.#uses.size > 1_000) this.#sweep(now);
    return undefined;
  }

  #sweep(now: number): void {
    for (const [key, use] of this.#uses) {
      if (use.expires <= now) this.#uses.delete(key);
    }
  }
}

export function permissionError(
  permissions: readonly string[],
  bot = false,
): string {
  const names = permissions.map(
    (permission) => `**\`${permission.replace(/([a-z])([A-Z])/g, "$1 $2")}\`**`,
  );
  const list =
    names.length === 1
      ? names[0]
      : `${names.slice(0, -1).join(", ")} and ${names.at(-1)}`;
  return bot
    ? `I need the ${list} permission${names.length === 1 ? "" : "s"} to do that.`
    : `You need the ${list} permission${names.length === 1 ? "" : "s"} to use this.`;
}
