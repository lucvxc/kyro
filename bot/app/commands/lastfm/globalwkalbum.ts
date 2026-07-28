import { cmd } from "../../../../index.ts";
import {
  formatGlobalRanks,
  getGlobalRanks,
} from "../../../features/lastfm/ranks.ts";
import { card, pair } from "../../../features/lastfm/view.ts";

export default cmd({
  name: "lastfm global album",
  aliases: [
    "lastfm globalwkalbum",
    "fm globalwkalbum",
    "lf globalwkalbum",
    "gwka",
  ],
  description: "View the bot's top listeners for an album.",
  syntax: "lastfm global album <artist | album>",
  example: "fm globalwkalbum Sade | Love Deluxe",
  type: "message",
  run: async (ctx) => {
    const [artist, album] = pair(ctx.raw.join(" "));
    const ranks = await getGlobalRanks("album", artist, album);
    await ctx.reply(
      card(`Global listeners · ${album}`, formatGlobalRanks(ranks)),
    );
  },
});
