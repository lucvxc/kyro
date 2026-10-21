import type { Kyro } from "../Kyro.ts";
import { help } from "./Help.ts";
import { reload } from "./Reload.ts";
import type { Registry } from "./Registry.ts";
import { version } from "./Version.ts";

export const builtinCommands = ["help", "reload", "version"] as const;
export type BuiltinCommand = (typeof builtinCommands)[number];

export function addBuiltins(
  registry: Registry,
  kyro: Kyro,
  commands: Iterable<BuiltinCommand>,
): void {
  const enabled = new Set(commands);
  if (
    enabled.has("help") &&
    !registry.values().some((command) => command.name === "help")
  )
    registry.add(help(registry));
  if (enabled.has("reload")) registry.add(reload(kyro));
  if (enabled.has("version")) registry.add(version(kyro));
}
