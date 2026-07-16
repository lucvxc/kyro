import { PermissionFlagsBits } from "discord.js";
import { cmd } from "../../../index.ts";
import embeds from "../../utils/config/embeds.ts";

export default cmd({
  name: "unhide", description: "Make the current channel visible again.", type: "message", context: "guild",
  permissions: [PermissionFlagsBits.ManageChannels], syntax: "unhide (reason)", example: "unhide",
  args: { reason: { type: "string" } },
  run: async ctx => {
    const channel = ctx.guild!.channels.cache.get(ctx.input.channelId)!;
    await ctx.server.channels.show(channel, ctx.string("reason") ?? undefined);
    return ctx.reply(embeds.success(`Unhidden ${channel}.`));
  },
});
