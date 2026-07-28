import { cmd, dominant } from "../../../../index.ts";
import { top, type Artist } from "../../../features/lastfm/client.ts";
import {
  card,
  list,
  period,
  periodLabel,
  getLastfmUser,
} from "../../../features/lastfm/view.ts";

export default cmd({
  name: "lastfm top artists",
  aliases: [
    "fm topartists",
    "fm top artists",
    "lf topartists",
    "lf top artists",
    "fm ta",
    "lf ta",
  ],
  description: "Show a user's top Last.fm artists.",
  syntax: "lastfm top artists (week/month/year/all) (@user)",
  example: "fm topartists month",
  type: "message",
  args: {
    period: { type: "string", required: false },
    user: { type: "user", required: false },
  },
  run: async (ctx) => {
    const linked = await getLastfmUser(ctx.author, ctx.user("user"));
    const range = period(ctx.string("period"));
    const items = (await top(linked.name, "artists", range)) as Artist[];
    const thumb = linked.discord.displayAvatarURL();
    await ctx.reply(
      card("top artists", list(items, "No top artists were found."), thumb, {
        subtitle: `${linked.name}  ·  ${periodLabel(range)}`,
        url: `https://www.last.fm/user/${encodeURIComponent(linked.name)}/library/artists?date_preset=${range}`,
        accent: await dominant(thumb, "#D51007"),
      }),
    );
  },
});
