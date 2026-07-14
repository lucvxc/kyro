import type { Context } from "./Context.ts";
import type { Entry } from "./Cmd.ts";

export class Guard {
  readonly #cooldown: number;
  readonly #uses = new Map<string, { expires: number; warned: boolean }>();

  public constructor(cooldown = 0) {
    this.#cooldown = cooldown * 1_000;
  }

  public check(command: Entry, ctx: Context): string | null | undefined {
    if (command.context === "guild" && !ctx.guild) {
      return "This command can only be used in a server.";
    }

    if (command.context === "dms" && ctx.guild) {
      return "This command can only be used in DMs.";
    }

    if (command.permissions.length > 0) {
      const permissions =
        ctx.interaction?.memberPermissions ?? ctx.message?.member?.permissions;
      const missing = permissions?.missing(command.permissions) ?? [];

      if (missing.length > 0) {
        const names = missing.map((name) => name.replace(/([a-z])([A-Z])/g, "$1 $2"));
        return `Missing permissions: ${names.join(", ")}.`;
      }
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
