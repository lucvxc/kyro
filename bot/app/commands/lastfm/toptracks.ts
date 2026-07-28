import { cmd, dominant } from "../../../../index.ts";
import { image, top, type Track } from "../../../features/lastfm/client.ts";
import {
  card,
  period,
  periodLabel,
  getLastfmUser,
} from "../../../features/lastfm/view.ts";

export default cmd({
  name: "lastfm top tracks",
  aliases: [
    "fm toptracks",
    "fm top tracks",
    "lf toptracks",
    "lf top tracks",
    "fm tt",
    "lf tt",
  ],
  description: "Show a user's top Last.fm tracks.",
  syntax: "lastfm top tracks (week/month/year/all) (@user)",
  example: "fm toptracks month",
  type: "message",
  args: {
    period: { type: "string", required: false },
    user: { type: "user", required: false },
  },
  run: async (ctx) => {
    const linked = await getLastfmUser(ctx.author, ctx.user("user"));
    const range = period(ctx.string("period"));
    const items = (await top(linked.name, "tracks", range)) as Track[];
    const rows = items
      .map(
        (track, i) =>
          `**${i + 1}.** [${track.name}](${track.url})  ·  ${track.artist.name}  ·  ${Number(track.playcount).toLocaleString()} plays`,
      )
      .join("\n");
    const thumb = image(items[0]?.image) ?? linked.discord.displayAvatarURL();
    await ctx.reply(
      card("top tracks", rows || "No tracks found.", thumb, {
        subtitle: `${linked.name}  ·  ${periodLabel(range)}`,
        url: `https://www.last.fm/user/${encodeURIComponent(linked.name)}/library/tracks?date_preset=${range}`,
        accent: await dominant(thumb, "#D51007"),
      }),
    );
  },
});
