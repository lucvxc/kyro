import { cmd } from "../../../index.ts";

export default cmd({
  name: "stop",
  description: "Stop playing and clear the queue.",
  type: "message",
  aliases: ["disconnect", "leave"],
  context: "guild",
  run: async (ctx) => {
    await ctx.music.stop();
    return ctx.reply("Stopped the music and cleared the queue.");
  },
});
