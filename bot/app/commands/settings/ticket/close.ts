import { PermissionFlagsBits } from "discord.js";
import { cmd } from "../../../../../index.ts";
import { closeTicket } from "../../../../features/tickets/index.ts";
import embeds from "../../../../shared/config/embeds.ts";

export default cmd({
  name: "ticket close",
  description: "Close the current ticket.",
  syntax: "ticket close",
  example: "ticket close",
  type: "message",
  context: "guild",
  permissions: [PermissionFlagsBits.ManageChannels],
  run: async (ctx) => {
    const ticket = await closeTicket(
      ctx.guild!,
      ctx.message!.channelId,
      ctx.author.id,
    );
    const channel = ctx.guild!.channels.cache.get(ctx.message!.channelId);
    if (channel && "permissionOverwrites" in channel) {
      await channel.permissionOverwrites.edit(ticket.userId, {
        SendMessages: false,
      });
      await channel.setName(`closed-${ticket.number}`).catch(() => undefined);
    }
    return ctx.reply(embeds.success("Ticket closed."));
  },
});
