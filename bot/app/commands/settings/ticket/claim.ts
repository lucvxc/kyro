import { PermissionFlagsBits } from "discord.js";
import { cmd } from "../../../../../index.ts";
import { claimTicket } from "../../../../features/tickets/index.ts";
import embeds from "../../../../shared/config/embeds.ts";

export default cmd({
  name: "ticket claim",
  description: "Claim or unclaim the current ticket.",
  syntax: "ticket claim",
  example: "ticket claim",
  type: "message",
  context: "guild",
  permissions: [PermissionFlagsBits.ManageChannels],
  run: async (ctx) => {
    const ticket = await claimTicket(
      ctx.guild!,
      ctx.message!.channelId,
      ctx.author.id,
    );
    return ctx.reply(
      embeds.success(
        ticket.claimedBy ? "Ticket claimed." : "Ticket unclaimed.",
      ),
    );
  },
});
