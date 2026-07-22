import type { Guild, GuildMember, User } from "discord.js";
import {
  parseBoost,
  parseLeave,
  parseMessageFormat,
  parseWelcome,
} from "../../utils/parser.ts";
import { communitySettings } from "./community.ts";

export async function configuredMessage(
  guild: Guild,
  kind: "welcome" | "leave" | "boost",
  user: User,
  member?: GuildMember,
) {
  const config = (await communitySettings(guild.id))[kind];
  if (!config.enabled || !config.channelId || !config.message) return null;
  const content =
    kind === "welcome" && member
      ? parseWelcome(config.message, member, guild)
      : kind === "leave"
        ? parseLeave(config.message, user, guild)
        : parseBoost(config.message, user, guild);
  return { config, payload: parseMessageFormat(content) };
}
