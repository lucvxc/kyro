import { PermissionFlagsBits } from "discord.js";
import { eq } from "drizzle-orm";
import { cmd, container } from "../../../../index.ts";
import { db } from "../../../db/database.ts";
import { guilds } from "../../../db/schema.ts";
import { colors } from "../../../shared/config/constants.ts";

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
    const [settings] = await db
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
          item("Welcome", settings?.welcome.enabled),
          item("Leave", settings?.leave.enabled),
          item("Boost", settings?.boost.enabled),
          item("AutoMessages", Boolean(settings?.automessages.length)),
        ]),
      )
      .text(
        group("Community", [
          item("AutoRoles", Boolean(settings?.autoroles.length)),
          item("AutoResponders", Boolean(settings?.autoresponders.length)),
          item("Starboard", Boolean(settings?.starboard.channelId)),
          item("Counting", Boolean(settings?.counting.channelId)),
          item("StickyMessages", Boolean(settings?.stickyMessages.length)),
          item("Confessions", settings?.confessions.enabled),
        ]),
      )
      .text(
        group("Safety", [
          item("Logging", settings?.logging.enabled),
          item("AutoMod", Boolean(settings?.automodLog)),
          item("AntiLink", settings?.antilink.enabled),
          item("AntiInvite", settings?.antiinvite.enabled),
          item("AntiNuke", settings?.antinuke.enabled),
          item("AntiRaid", settings?.antiraid.enabled),
          item("Honeypot", settings?.honeypot.enabled),
          item("Jail", Boolean(settings?.jail.roleId)),
          item("Tickets", settings?.tickets.enabled),
          item("CaseLogs", Boolean(settings?.caseLogChannelId)),
        ]),
      )
      .text(
        group("Roles and Voice", [
          item("ReactionRoles", Boolean(settings?.reactionRoles.length)),
          item(
            "BoosterRoles",
            Boolean(settings?.boosterRoleSettings.baseRoleId),
          ),
          item("StickyRoles", settings?.stickyRoles),
          item("VoiceMaster", settings?.voiceMaster.enabled),
          item("ButtonRoles", Boolean(settings?.buttonRoles.length)),
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
