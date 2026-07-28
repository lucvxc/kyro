import { cmd } from "../../../../index.ts";
import { formatRanks, getRanks } from "../../../features/lastfm/ranks.ts";
import { card, pair } from "../../../features/lastfm/view.ts";
import { image, trackInfo } from "../../../features/lastfm/client.ts";

export default cmd({
  name: "lastfm whoknows track",
  aliases: ["lastfm wktrack", "fm wktrack", "lf wktrack", "wkt"],
  description: "View the top listeners for a track in this server.",
  syntax: "lastfm whoknows track <artist | track>",
  example: "fm wktrack Sade | No Ordinary Love",
  type: "message",
  context: "guild",
  run: async (ctx) => {
    const [artist, track] = pair(ctx.raw.join(" "));
    const members = await ctx.guild!.members.fetch();
    const [items, info] = await Promise.all([
      getRanks(
        members.map((member) => member.user),
        "track",
        artist,
        track,
      ),
      trackInfo(artist, track).catch(() => null),
    ]);
    const total = items.reduce((sum, item) => sum + item.plays, 0);
    await ctx.reply(
      card(info?.name ?? track, formatRanks(items), image(info?.image), {
        subtitle: `${artist}${info?.url ? `  ·  [View on Last.fm](${info.url})` : ""}`,
        footer: `**${total.toLocaleString()}** total plays  ·  **${items.length}** listener${items.length === 1 ? "" : "s"}`,
      }),
    );
  },
});
