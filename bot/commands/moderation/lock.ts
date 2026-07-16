import { PermissionFlagsBits } from "discord.js";
import { cmd } from "../../../index.ts";
import embeds from "../../utils/config/embeds.ts";

export default cmd({
  name: "lock", description: "Lock the current channel.", type: "message", context: "guild",
  permissions: [PermissionFlagsBits.ManageChannels], syntax: "lock (reason)", example: "lock Raid cleanup",
  args: { reason: { type: "string" } },
  run: async ctx => {
    const channel = ctx.guild!.channels.cache.get(ctx.input.channelId)!;
    await ctx.server.channels.lock(channel, ctx.string("reason") ?? undefined);
    return ctx.reply(embeds.success(`Locked ${channel}.`));
  },
});
