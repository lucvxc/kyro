import { PermissionFlagsBits } from "discord.js";
import { cmd } from "../../../index.ts";
import embeds from "../../utils/config/embeds.ts";

export default cmd({
  name: "slowmode", aliases: ["slow"], description: "Set this channel's slowmode.", type: "message", context: "guild",
  permissions: [PermissionFlagsBits.ManageChannels], syntax: "slowmode <seconds> (reason)", example: "slowmode 10 Chat is moving too fast",
  args: { seconds: { type: "number", required: true }, reason: { type: "string" } },
  run: async ctx => {
    const channel = ctx.guild!.channels.cache.get(ctx.input.channelId)!;
    const seconds = ctx.number("seconds")!;
    await ctx.server.channels.slowmode(channel, seconds, ctx.string("reason") ?? undefined);
    return ctx.reply(embeds.success(seconds ? `Set slowmode to **${seconds} seconds**.` : "Disabled slowmode."));
  },
});
