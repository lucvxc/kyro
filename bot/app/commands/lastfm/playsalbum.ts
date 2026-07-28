import { cmd } from "../../../../index.ts";
import { albumInfo } from "../../../features/lastfm/client.ts";
import { card, pair, getLastfmUser } from "../../../features/lastfm/view.ts";

export default cmd({
  name: "lastfm plays album",
  aliases: ["lastfm playsalbum", "fm playsalbum", "lf playsalbum"],
  description: "Check your plays for an album.",
  syntax: "lastfm plays album <artist | album>",
  example: "fm playsalbum Sade | Love Deluxe",
  type: "message",
  run: async (ctx) => {
    const linked = await getLastfmUser(ctx.author);
    const [artist, album] = pair(ctx.raw.join(" "));
    const info = await albumInfo(artist, album, linked.name);
    await ctx.reply(
      card(
        album,
        `**${linked.discord.username}** has **${Number(info.userplaycount ?? 0).toLocaleString()}** plays\n${artist}`,
      ),
    );
  },
});
