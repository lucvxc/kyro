import { cmd, song } from "../../../index.ts";

export default cmd({
  name: "play",
  description: "Play a song or add it to the queue.",
  type: "message",
  aliases: ["p"],
  syntax: "play <query>",
  example: "play Die For You",
  context: "guild",
  args: { query: { type: "string", required: true, description: "Song name or URL" } },
  run: async (ctx) => {
    const result = await ctx.music.play(ctx.string("query")!);
    const added = result.tracks.length;
    if (result.playlist) {
      return ctx.reply(`${result.started ? "Playing" : "Added"} **${added} songs** from **${result.playlist}**.`);
    }
    return ctx.reply(`${result.started ? "Playing" : "Added"} ${song(result.tracks[0]!)}${result.started ? "." : " to the queue."}`);
  },
});
