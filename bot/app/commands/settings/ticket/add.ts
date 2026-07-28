import { PermissionFlagsBits } from "discord.js";
import { cmd } from "../../../../../index.ts";
import { ticketFor } from "../../../../features/tickets/index.ts";
import embeds from "../../../../shared/config/embeds.ts";

export default cmd({
  name: "ticket add",
  description: "Add a member to the current ticket.",
  syntax: "ticket add <member>",
  example: "ticket add @user",
  type: "message",
  context: "guild",
  permissions: [PermissionFlagsBits.ManageChannels],
  args: { user: { type: "user", required: true } },
  run: async (ctx) => {
    await ticketFor(ctx.message!.channelId);
    const channel = ctx.guild!.channels.cache.get(ctx.message!.channelId);
    if (!channel || !("permissionOverwrites" in channel))
      return ctx.reply(embeds.warning("This ticket channel is unavailable."));
    await channel.permissionOverwrites.edit(ctx.user("user")!.id, {
      ViewChannel: true,
      SendMessages: true,
      ReadMessageHistory: true,
    });
    return ctx.reply(embeds.success(`Added **${ctx.user("user")!.tag}**.`));
  },
});
