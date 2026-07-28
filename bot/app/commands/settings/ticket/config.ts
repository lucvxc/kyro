import { PermissionFlagsBits } from "discord.js";
import { cmd, container } from "../../../../../index.ts";
import { getTicketSettings } from "../../../../features/settings/tickets.ts";
import { colors } from "../../../../shared/config/constants.ts";

export default cmd({
  name: "ticket config",
  aliases: ["tickets config"],
  description: "View the ticket configuration.",
  syntax: "ticket config",
  example: "ticket config",
  type: "message",
  context: "guild",
  permissions: [PermissionFlagsBits.ManageGuild],
  run: async (ctx) => {
    const settings = await getTicketSettings(ctx.guild!.id);
    return ctx.reply(
      container()
        .accent(colors.default)
        .text(
          `## Ticket Configuration\n-# ${settings.enabled ? "Enabled" : "Disabled"} · ${settings.counter ?? 0} tickets created\n**Category** ${settings.categoryId ? `<#${settings.categoryId}>` : "Not set"}\n**Logs** ${settings.logChannelId ? `<#${settings.logChannelId}>` : "Not set"}\n**Panel** ${settings.panelChannelId ? `<#${settings.panelChannelId}>` : "Not sent"}\n**Staff** ${(settings.staffRoleIds ?? []).map((id) => `<@&${id}>`).join(", ") || "None"}`,
        ),
    );
  },
});
