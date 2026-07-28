import { PermissionFlagsBits } from "discord.js";
import { cmd } from "../../../../../index.ts";
import { reopenTicket } from "../../../../features/tickets/index.ts";
import embeds from "../../../../shared/config/embeds.ts";

export default cmd({
  name: "ticket reopen",
  description: "Reopen the current ticket.",
  syntax: "ticket reopen",
  example: "ticket reopen",
  type: "message",
  context: "guild",
  permissions: [PermissionFlagsBits.ManageChannels],
  run: async (ctx) => {
    const ticket = await reopenTicket(
      ctx.guild!,
      ctx.message!.channelId,
      ctx.author.id,
    );
    const channel = ctx.guild!.channels.cache.get(ticket.channelId);
    if (channel && "permissionOverwrites" in channel) {
      await channel.permissionOverwrites.edit(ticket.userId, {
        SendMessages: true,
      });
      await channel
        .setName(`ticket-${ticket.number.toString().padStart(4, "0")}`)
        .catch(() => undefined);
    }
    return ctx.reply(embeds.success("Ticket reopened."));
  },
});
