import { cmd, song } from "../../../index.ts";

export default cmd({
  name: "skip",
  description: "Skip the current song.",
  syntax: "skip",
  example: "skip",
  type: "message",
  aliases: ["s"],
  context: "guild",
  run: async (ctx) => {
    const next = await ctx.music.skip();
    return ctx.reply(
      next ? `Skipped to ${song(next)}.` : "Stopped—the queue is empty.",
    );
  },
});
