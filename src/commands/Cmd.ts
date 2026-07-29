import type { Context } from "./Context.ts";
import type { Args } from "./Arg.ts";
import type {
  DiscordApplicationIntegrationType,
  Localization,
  PermissionStrings,
} from "discordeno";
import type { AutocompleteContext, Choice } from "./Autocomplete.ts";
import type { Middleware } from "./Middleware.ts";
import type { RateLimitPolicy } from "../core/RateLimit.ts";

export type CmdType = "slash" | "message" | "hybrid";
export type CmdContext = "both" | "guild" | "dms";
export interface ConcurrencyPolicy {
  max: number;
  scope?: "user" | "guild" | "channel" | "global";
}

export interface Cmd {
  name: string;
  description: string;
  type?: CmdType;
  aliases?: readonly string[];
  args?: Args;
  context?: CmdContext;
  permissions?: readonly PermissionStrings[];
  botPermissions?: readonly PermissionStrings[];
  guilds?: readonly string[];
  integrationTypes?: readonly DiscordApplicationIntegrationType[];
  nameLocalizations?: Localization;
  descriptionLocalizations?: Localization;
  category?: string;
  syntax?: string;
  example?: string;
  meta?: Readonly<Record<string, unknown>>;
  middleware?: readonly Middleware[];
  rateLimit?: RateLimitPolicy;
  timeout?: number;
  autoDefer?: boolean | { after?: number; private?: boolean };
  concurrency?: ConcurrencyPolicy;
  run(ctx: Context): void | Promise<void>;
  autocomplete?(
    ctx: AutocompleteContext,
  ): readonly Choice[] | Promise<readonly Choice[]> | void | Promise<void>;
}

export interface Entry extends Cmd {
  readonly path: readonly string[];
  readonly type: CmdType;
  readonly aliases: readonly string[];
  readonly context: CmdContext;
  readonly permissions: readonly PermissionStrings[];
  readonly botPermissions: readonly PermissionStrings[];
  readonly guilds: readonly string[];
  readonly category: string;
  readonly syntax: string;
}

export function cmd(command: Cmd): Cmd {
  return command;
}
