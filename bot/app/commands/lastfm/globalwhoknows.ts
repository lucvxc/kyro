import { cmd, UserError } from "../../../../index.ts";
import {
  formatGlobalRanks,
  getGlobalRanks,
} from "../../../features/lastfm/ranks.ts";
import { card } from "../../../features/lastfm/view.ts";

export default cmd({
  name: "lastfm global artist",
  aliases: [
    "lastfm globalwhoknows",
    "fm globalwhoknows",
    "lf globalwhoknows",
    "gwk",
  ],
  description: "View the bot's top listeners for an artist.",
  syntax: "lastfm global artist <artist>",
  example: "fm globalwhoknows Sade",
  type: "message",
  run: async (ctx) => {
    const artist = ctx.raw.join(" ").trim();
    if (!artist) throw new UserError("Provide an artist.");
    const ranks = await getGlobalRanks("artist", artist);
    await ctx.reply(
      card(`Global listeners · ${artist}`, formatGlobalRanks(ranks)),
    );
  },
});
