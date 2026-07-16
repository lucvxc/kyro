import { cmd, container } from "../../../index.ts";

export default cmd({
  name: "channels",
  description: "List this server's channels.",
  type: "message",
  aliases: ["channellist"],
  syntax: "channels",
  example: "channels",
  context: "guild",
  run: async (ctx) => {
    const channels = ctx.guild!.stats.channelList();
    return ctx.reply(container()
      .accent(await ctx.guild!.stats.accent())
      .text(`## ${ctx.guild!.stats.name} Channels\n-# Showing ${channels.length} of ${ctx.guild!.stats.channels}`)
      .separator()
      .text(channels.join(" · ") || "No channels."));
  },
});
