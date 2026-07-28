import { PermissionFlagsBits } from "discord.js";
import { cmd } from "../../../../../index.ts";
import { editTicketSettings } from "../../../../features/settings/tickets.ts";
import { ticketPanel } from "../../../../features/tickets/panel.ts";
import embeds from "../../../../shared/config/embeds.ts";

export default cmd({
  name: "ticket panel",
  aliases: ["tickets panel"],
  description: "Send the ticket panel.",
  syntax: "ticket panel (channel)",
  example: "ticket panel #support",
  type: "message",
  context: "guild",
  permissions: [PermissionFlagsBits.ManageGuild],
  args: { channel: { type: "channel", description: "Channel for the panel" } },
  run: async (ctx) => {
    const channel = ctx.channel("channel") ?? ctx.message!.channel;
    if (!channel.isSendable())
      return ctx.reply(embeds.warning("Choose a text channel."));
    const msg = await channel.send(ticketPanel(ctx.guild!.id));
    await editTicketSettings(ctx.guild!.id, (settings) => ({
      ...settings,
      panelChannelId: channel.id,
      panelMessageId: msg.id,
    }));
    return ctx.reply(embeds.success(`Ticket panel sent in ${channel}.`));
  },
});
