import type { Guild } from "discord.js";
import { UserError } from "../../../index.ts";

export function requireSecurityAccess(
  guild: Guild,
  userId: string,
  admins: string[],
): void {
  if (guild.ownerId !== userId && !admins.includes(userId)) {
    throw new UserError(
      "Only the server owner or a configured security admin can do that.",
    );
  }
}

export function requireOwner(guild: Guild, userId: string): void {
  if (guild.ownerId !== userId)
    throw new UserError("Only the server owner can do that.");
}

export function listWith(value: string[], id: string): string[] {
  return [...new Set([...value, id])];
}

export function listWithout(value: string[], id: string): string[] {
  return value.filter((entry) => entry !== id);
}
