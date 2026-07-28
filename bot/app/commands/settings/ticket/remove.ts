import { PermissionFlagsBits } from "discord.js";
import { cmd } from "../../../../../index.ts";
import { ticketFor } from "../../../../features/tickets/index.ts";
import embeds from "../../../../shared/config/embeds.ts";

export default cmd({
  name: "ticket remove",
  description: "Remove a member from the current ticket.",
  syntax: "ticket remove <member>",
  example: "ticket remove @user",
  type: "message",
  context: "guild",
  permissions: [PermissionFlagsBits.ManageChannels],
  args: { user: { type: "user", required: true } },
  run: async (ctx) => {
    await ticketFor(ctx.message!.channelId);
    const channel = ctx.guild!.channels.cache.get(ctx.message!.channelId);
    if (!channel || !("permissionOverwrites" in channel))
      return ctx.reply(embeds.warning("This ticket channel is unavailable."));
    await channel.permissionOverwrites.delete(ctx.user("user")!.id);
    return ctx.reply(embeds.success(`Removed **${ctx.user("user")!.tag}**.`));
  },
});
