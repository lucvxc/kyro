import { PermissionFlagsBits } from "discord.js";
import { eq } from "drizzle-orm";
import { cmd, container } from "../../../index.ts";
import { db } from "../../db/database.ts";
import { guilds } from "../../db/schema.ts";
import { colors } from "../../utils/config/constants.ts";

export default cmd({
  name: "settings",
  aliases: ["config"],
  description: "View this server's configured systems.",
  syntax: "settings",
  example: "settings",
  type: "message",
  context: "guild",
  permissions: [PermissionFlagsBits.ManageGuild],
  run: async (ctx) => {
    const [cfg] = await db
      .select()
      .from(guilds)
      .where(eq(guilds.id, ctx.guild!.id))
      .limit(1);

    const view = container()
      .accent(colors.default)
      .text("## Server Settings\n-# Configured systems for this server")
      .separator()
      .text(
        group("Messages", [
          item("Welcome", cfg?.welcome.enabled),
          item("Leave", cfg?.leave.enabled),
          item("Boost", cfg?.boost.enabled),
          item("AutoMessages", Boolean(cfg?.automessages.length)),
        ]),
      )
      .text(
        group("Community", [
          item("AutoRoles", Boolean(cfg?.autoroles.length)),
          item("AutoResponders", Boolean(cfg?.autoresponders.length)),
          item("Starboard", Boolean(cfg?.starboard.channelId)),
          item("Counting", Boolean(cfg?.counting.channelId)),
          item("StickyMessages", Boolean(cfg?.stickyMessages.length)),
          item("Confessions", cfg?.confessions.enabled),
        ]),
      )
      .text(
        group("Safety", [
          item("Logging", cfg?.logging.enabled),
          item("AutoMod", Boolean(cfg?.automodLog)),
          item("AntiLink", cfg?.antilink.enabled),
          item("AntiInvite", cfg?.antiinvite.enabled),
          item("AntiNuke", cfg?.antinuke.enabled),
          item("AntiRaid", cfg?.antiraid.enabled),
          item("Honeypot", cfg?.honeypot.enabled),
          item("Jail", Boolean(cfg?.jail.roleId)),
        ]),
      )
      .text(
        group("Roles and Voice", [
          item("ReactionRoles", Boolean(cfg?.reactionRoles.length)),
          item("BoosterRoles", Boolean(cfg?.boosterRoleSettings.baseRoleId)),
          item("StickyRoles", cfg?.stickyRoles),
          item("VoiceMaster", cfg?.voiceMaster.enabled),
        ]),
      );

    return ctx.reply(view);
  },
});

function item(name: string, enabled?: boolean): string {
  return `${enabled ? "On" : "Off"} **${name}**`;
}

function group(name: string, items: string[]): string {
  return `**${name}**\n${items.join(" · ")}`;
}
