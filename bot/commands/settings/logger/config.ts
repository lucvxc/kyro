import { PermissionFlagsBits } from "discord.js";
import { cmd } from "../../../../index.ts";
import {
  logEvents,
  loggerSettings,
} from "../../../services/settings/logger.ts";
import embeds from "../../../utils/config/embeds.ts";

export default cmd({
  name: "logger config",
  description: "Show this server's logger configuration.",
  type: "message",
  context: "guild",
  permissions: [PermissionFlagsBits.ManageGuild],
  syntax: "logger config",
  example: "logger config",
  run: async (ctx) => {
    const config = await loggerSettings(ctx.guild!.id);
    const eventCount = config.events?.length || logEvents.length;
    const ignored =
      config.ignoredChannels?.map((id) => `<#${id}>`).join(", ") || "None";
    return ctx.reply(
      embeds.info(
        [
          `**Status:** ${config.enabled ? "Enabled" : "Disabled"}`,
          `**Channel:** ${config.channelId ? `<#${config.channelId}>` : "Not configured"}`,
          `**Events:** ${eventCount}/${logEvents.length} enabled`,
          `**Ignored channels:** ${ignored}`,
        ].join("\n"),
      ),
    );
  },
});
