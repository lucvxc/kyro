import { cmd, UserError } from "../../../../index.ts";
import { formatRanks, getRanks } from "../../../features/lastfm/ranks.ts";
import { card } from "../../../features/lastfm/view.ts";
import { artistInfo, image } from "../../../features/lastfm/client.ts";

export default cmd({
  name: "lastfm whoknows artist",
  aliases: ["lastfm whoknows", "fm whoknows", "lf whoknows", "wk"],
  description: "View the top listeners for an artist in this server.",
  syntax: "lastfm whoknows artist <artist>",
  example: "fm whoknows Sade",
  type: "message",
  context: "guild",
  run: async (ctx) => {
    const artist = ctx.raw.join(" ").trim();
    if (!artist) throw new UserError("Provide an artist.");
    const members = await ctx.guild!.members.fetch();
    const [items, info] = await Promise.all([
      getRanks(
        members.map((member) => member.user),
        "artist",
        artist,
      ),
      artistInfo(artist).catch(() => null),
    ]);
    const total = items.reduce((sum, item) => sum + item.plays, 0);
    await ctx.reply(
      card(info?.name ?? artist, formatRanks(items), image(info?.image), {
        subtitle: info?.url ? `[View on Last.fm](${info.url})` : undefined,
        footer: `**${total.toLocaleString()}** total plays  ·  **${items.length}** listener${items.length === 1 ? "" : "s"}`,
      }),
    );
  },
});
