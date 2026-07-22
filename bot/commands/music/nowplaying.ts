import { cmd, container, song, songLength, thumb } from "../../../index.ts";
import { colors } from "../../utils/config/config.ts";

export default cmd({
  name: "nowplaying",
  description: "Show the current song.",
  type: "message",
  aliases: ["np"],
  context: "guild",
  run: (ctx) => {
    const track = ctx.music.current;
    if (!track) return ctx.reply("Nothing is playing right now.");
    const time = `${songLength(ctx.music.position)} / ${track.info.isStream ? "Live" : songLength(track.info.length)}`;

    return ctx.reply(
      container()
        .accent(colors.default)
        .section(
          `## Now Playing\n${song(track)}\n-# ${time}`,
          track.info.artworkUrl ? thumb(track.info.artworkUrl) : undefined,
        ),
    );
  },
});
