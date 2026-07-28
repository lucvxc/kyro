import { cmd } from "../../../../index.ts";

export default cmd({
  name: "shuffle",
  description: "Shuffle the music queue.",
  syntax: "shuffle",
  example: "shuffle",
  type: "message",
  context: "guild",
  run: async (ctx) => {
    await ctx.music.shuffle();
    return ctx.reply("Shuffled the queue.");
  },
});
