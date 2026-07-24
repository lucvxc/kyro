import { cmd } from "../../../index.ts";

export default cmd({
  name: "pause",
  description: "Pause the current song.",
  syntax: "pause",
  example: "pause",
  type: "message",
  context: "guild",
  run: async (ctx) => {
    await ctx.music.pause();
    return ctx.reply("Paused the music.");
  },
});
