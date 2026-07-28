import { PermissionFlagsBits } from "discord.js";
import { cmd } from "../../../../../index.ts";
import { closeTicket, ticketFor } from "../../../../features/tickets/index.ts";

export default cmd({
  name: "ticket delete",
  description: "Delete the current ticket channel.",
  syntax: "ticket delete",
  example: "ticket delete",
  type: "message",
  context: "guild",
  permissions: [PermissionFlagsBits.ManageChannels],
  run: async (ctx) => {
    const ticket = await ticketFor(ctx.message!.channelId);
    if (ticket.status === "open")
      await closeTicket(ctx.guild!, ticket.channelId, ctx.author.id);
    await ctx.message!.channel.delete(`Ticket deleted by ${ctx.author.tag}`);
  },
});
