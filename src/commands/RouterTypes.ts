import type { Message } from "discordeno";
export type PrefixResolver = (
  message: Message,
) => string | readonly string[] | Promise<string | readonly string[]>;
export type AliasLookup = (
  message: Message,
  input: string,
) => string | null | Promise<string | null>;
