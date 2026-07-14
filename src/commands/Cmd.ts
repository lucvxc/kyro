import type { Context } from "./Context.ts";
import type { Args } from "./Arg.ts";
import type { PermissionResolvable } from "discord.js";
import type { AutocompleteContext, Choice } from "./Autocomplete.ts";

export type CmdType = "slash" | "message" | "hybrid";
export type CmdContext = "both" | "guild" | "dms";

export interface Cmd {
  name: string;
  description: string;
  type?: CmdType;
  aliases?: readonly string[];
  args?: Args;
  context?: CmdContext;
  permissions?: readonly PermissionResolvable[];
  run(ctx: Context): void | Promise<void>;
  autocomplete?(ctx: AutocompleteContext): readonly Choice[] | Promise<readonly Choice[]> | void | Promise<void>;
}

export interface Entry extends Cmd {
  readonly path: readonly string[];
  readonly type: CmdType;
  readonly aliases: readonly string[];
  readonly context: CmdContext;
  readonly permissions: readonly PermissionResolvable[];
}

export function cmd(command: Cmd): Cmd {
  return command;
}
