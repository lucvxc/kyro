import { cmd } from "../../../index.ts";

export default cmd({
  name: "resume",
  description: "Resume the current song.",
  syntax: "resume",
  example: "resume",
  type: "message",
  context: "guild",
  run: async (ctx) => {
    await ctx.music.resume();
    return ctx.reply("Resumed the music.");
  },
});
