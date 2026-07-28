import { cmd, dominant } from "../../../../index.ts";
import { image, top, type Album } from "../../../features/lastfm/client.ts";
import {
  card,
  period,
  periodLabel,
  getLastfmUser,
} from "../../../features/lastfm/view.ts";

export default cmd({
  name: "lastfm top albums",
  aliases: [
    "fm topalbums",
    "fm top albums",
    "lf topalbums",
    "lf top albums",
    "fm tal",
    "lf tal",
  ],
  description: "Show a user's top Last.fm albums.",
  syntax: "lastfm top albums (week/month/year/all) (@user)",
  example: "fm topalbums month",
  type: "message",
  args: {
    period: { type: "string", required: false },
    user: { type: "user", required: false },
  },
  run: async (ctx) => {
    const linked = await getLastfmUser(ctx.author, ctx.user("user"));
    const range = period(ctx.string("period"));
    const items = (await top(linked.name, "albums", range)) as Album[];
    const rows = items
      .map(
        (album, i) =>
          `**${i + 1}.** [${album.name}](${album.url})  ·  ${typeof album.artist === "string" ? album.artist : album.artist.name}  ·  ${Number(album.playcount).toLocaleString()} plays`,
      )
      .join("\n");
    const thumb = image(items[0]?.image) ?? linked.discord.displayAvatarURL();
    await ctx.reply(
      card("top albums", rows || "No albums found.", thumb, {
        subtitle: `${linked.name}  ·  ${periodLabel(range)}`,
        url: `https://www.last.fm/user/${encodeURIComponent(linked.name)}/library/albums?date_preset=${range}`,
        accent: await dominant(thumb, "#D51007"),
      }),
    );
  },
});
