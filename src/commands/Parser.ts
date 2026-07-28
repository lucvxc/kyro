import type { GuildBasedChannel, Role, User } from "discord.js";

import type { Args } from "./Arg.ts";

export interface ArgLookups {
  user(id: string): User | undefined;
  role(id: string): Role | undefined;
  channel(id: string): GuildBasedChannel | undefined;
}

export interface Parsed {
  values: ReadonlyMap<string, unknown>;
  issue?: string;
}

export function parse(
  args: Args | undefined,
  tokens: readonly string[],
  lookup: ArgLookups,
): Parsed {
  const entries = Object.entries(args ?? {});
  const values = new Map<string, unknown>();
  let index = 0;

  for (const [position, [name, arg]] of entries.entries()) {
    const lastString = arg.type === "string" && position === entries.length - 1;
    const remaining = entries
      .slice(position + 1)
      .filter(([, value]) => value.required).length;
    const role =
      arg.type === "role"
        ? readRole(tokens, index, remaining, lookup)
        : undefined;
    const token = lastString ? tokens.slice(index).join(" ") : tokens[index];

    if (!token) {
      if (arg.required)
        return { values, issue: `Missing required argument "${name}".` };
      if (arg.default !== undefined) values.set(name, arg.default);
      continue;
    }

    const value = role?.value ?? read(arg.type, token, lookup);
    if (value === undefined) {
      return { values, issue: `Invalid ${arg.type} value for "${name}".` };
    }

    values.set(name, value);
    index = lastString ? tokens.length : index + (role?.used ?? 1);
  }

  return { values };
}

function readRole(
  tokens: readonly string[],
  index: number,
  remaining: number,
  lookup: ArgLookups,
): { value: Role; used: number } | undefined {
  const available = tokens.length - index - remaining;
  for (let used = available; used > 0; used -= 1) {
    const value = lookup.role(
      readID(tokens.slice(index, index + used).join(" ")),
    );
    if (value) return { value, used };
  }
  return undefined;
}

function read(
  type: Args[string]["type"],
  token: string,
  lookup: ArgLookups,
): unknown {
  switch (type) {
    case "string":
      return token;
    case "number": {
      const value = Number(token);
      return Number.isFinite(value) ? value : undefined;
    }
    case "boolean":
      return readBoolean(token);
    case "user":
      return lookup.user(readID(token));
    case "role":
      return lookup.role(readID(token));
    case "channel":
      return lookup.channel(readID(token));
  }
}

function readBoolean(value: string): boolean | undefined {
  if (["true", "yes", "on", "1"].includes(value.toLowerCase())) return true;
  if (["false", "no", "off", "0"].includes(value.toLowerCase())) return false;
  return undefined;
}

function readID(value: string): string {
  return value.match(/^<(?:@!?|@&|#)(\d+)>$/)?.[1] ?? value;
}
