import { PermissionFlagsBits } from "discord.js";
import { eq } from "drizzle-orm";
import { button, cmp, container, UserError } from "../../../index.ts";
import { db } from "../../db/database.ts";
import { tickets } from "../../db/schema.ts";
import {
  claimTicket,
  closeTicket,
  openTicket,
} from "../../features/tickets/index.ts";
import { ticketControlView } from "../../features/tickets/panel.ts";
import { colors } from "../../shared/config/constants.ts";
import embeds from "../../shared/config/embeds.ts";

export default cmp({
  id: /^ticket:(?:create:\d{17,20}|(?:claim|unclaim|close|confirm|cancel):\d+)$/,
  context: "guild",
  run: async (ctx) => {
    const [, action, id] = ctx.id.split(":");
    const member = await ctx.guild!.members.fetch(ctx.user.id);
    if (action === "create") {
      const channel = await openTicket(ctx.guild!, member);
      return ctx.private(`Your ticket is ready: ${channel}`);
    }
    const [ticket] = await db
      .select()
      .from(tickets)
      .where(eq(tickets.id, Number(id)))
      .limit(1);
    if (!ticket || ticket.channelId !== ctx.interaction.channelId)
      throw new UserError("That ticket no longer exists.");
    if (action === "claim" || action === "unclaim") {
      if (!member.permissions.has(PermissionFlagsBits.ManageChannels))
        throw new UserError("Only ticket staff can claim tickets.");
      const next = await claimTicket(ctx.guild!, ticket.channelId, member.id);
      return ctx.update(ticketControlView(ticket.id, Boolean(next.claimedBy)));
    }
    if (action === "cancel")
      return ctx.update(
        ticketControlView(ticket.id, Boolean(ticket.claimedBy)),
      );
    if (
      ticket.userId !== member.id &&
      !member.permissions.has(PermissionFlagsBits.ManageChannels)
    )
      throw new UserError("You cannot close this ticket.");
    if (action === "close")
      return ctx.update(
        container()
          .accent(colors.default)
          .text(
            "## Close this ticket?\n-# A transcript will be saved to the ticket log.",
          )
          .row(
            button({
              id: `ticket:confirm:${ticket.id}`,
              label: "Close",
              style: "secondary",
            }),
            button({
              id: `ticket:cancel:${ticket.id}`,
              label: "Cancel",
              style: "secondary",
            }),
          ),
      );
    await closeTicket(ctx.guild!, ticket.channelId, member.id);
    const channel = ctx.guild!.channels.cache.get(ticket.channelId);
    if (channel && "permissionOverwrites" in channel)
      await channel.permissionOverwrites.edit(ticket.userId, {
        SendMessages: false,
      });
    return ctx.update(embeds.success("Ticket closed."));
  },
});
