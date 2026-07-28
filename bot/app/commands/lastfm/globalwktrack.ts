import { cmd } from "../../../../index.ts";
import {
  formatGlobalRanks,
  getGlobalRanks,
} from "../../../features/lastfm/ranks.ts";
import { card, pair } from "../../../features/lastfm/view.ts";

export default cmd({
  name: "lastfm global track",
  aliases: [
    "lastfm globalwktrack",
    "fm globalwktrack",
    "lf globalwktrack",
    "gwkt",
  ],
  description: "View the bot's top listeners for a track.",
  syntax: "lastfm global track <artist | track>",
  example: "fm globalwktrack Sade | No Ordinary Love",
  type: "message",
  run: async (ctx) => {
    const [artist, track] = pair(ctx.raw.join(" "));
    const ranks = await getGlobalRanks("track", artist, track);
    await ctx.reply(
      card(`Global listeners · ${track}`, formatGlobalRanks(ranks)),
    );
  },
});
