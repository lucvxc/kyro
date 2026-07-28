import { PermissionFlagsBits } from "discord.js";
import { cmd, UserError } from "../../../../../index.ts";
import { editTicketSettings } from "../../../../features/settings/tickets.ts";
import embeds from "../../../../shared/config/embeds.ts";

export default cmd({
  name: "ticket log",
  aliases: ["tickets log"],
  description: "Set the ticket transcript and action log channel.",
  syntax: "ticket log <channel>",
  example: "ticket log #ticket-logs",
  type: "message",
  context: "guild",
  permissions: [PermissionFlagsBits.ManageGuild],
  args: { channel: { type: "channel", required: true } },
  run: async (ctx) => {
    const channel = ctx.channel("channel")!;
    if (!channel.isTextBased() || channel.isDMBased())
      throw new UserError("Choose a server text channel.");
    await editTicketSettings(ctx.guild!.id, (settings) => ({
      ...settings,
      logChannelId: channel.id,
    }));
    return ctx.reply(
      embeds.success(
        `Ticket transcripts and actions will be logged in ${channel}.`,
      ),
    );
  },
});
