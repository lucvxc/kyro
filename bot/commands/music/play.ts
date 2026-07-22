import { cmd, container, song, thumb } from "../../../index.ts";
import { colors } from "../../utils/config/config.ts";

export default cmd({
  name: "play",
  description: "Play a song or add it to the queue.",
  type: "message",
  aliases: ["p"],
  syntax: "play <query>",
  example: "play Die For You",
  context: "guild",
  args: {
    query: { type: "string", required: true, description: "Song name or URL" },
  },
  run: async (ctx) => {
    const result = await ctx.music.play(ctx.string("query")!);
    const added = result.tracks.length;
    if (result.playlist) {
      return ctx.reply(
        container()
          .accent(colors.default)
          .text(
            `## ${result.started ? "Playing Playlist" : "Playlist Added"}\n**${added} songs** from **${result.playlist}**.`,
          ),
      );
    }

    const track = result.tracks[0]!;
    return ctx.reply(
      container()
        .accent(colors.default)
        .section(
          `## ${result.started ? "Now Playing" : "Added to Queue"}\n${song(track)}`,
          track.info.artworkUrl ? thumb(track.info.artworkUrl) : undefined,
        ),
    );
  },
});
