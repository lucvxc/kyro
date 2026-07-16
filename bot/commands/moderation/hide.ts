import { PermissionFlagsBits } from "discord.js";
import { cmd } from "../../../index.ts";
import embeds from "../../utils/config/embeds.ts";

export default cmd({
  name: "hide", description: "Hide the current channel from everyone.", type: "message", context: "guild",
  permissions: [PermissionFlagsBits.ManageChannels], syntax: "hide (reason)", example: "hide Staff cleanup",
  args: { reason: { type: "string" } },
  run: async ctx => {
    const channel = ctx.guild!.channels.cache.get(ctx.input.channelId)!;
    await ctx.server.channels.hide(channel, ctx.string("reason") ?? undefined);
    return ctx.reply(embeds.success(`Hidden ${channel}.`));
  },
});
