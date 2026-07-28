import { cmd } from "../../../../index.ts";
import { account, prefs } from "../../../features/lastfm/users.ts";

export default cmd({
  name: "lastfm settings visibility",
  aliases: ["lastfm hide", "fm hide", "lf hide"],
  description: "Toggle whether you appear on Last.fm leaderboards.",
  syntax: "lastfm settings visibility",
  example: "fm hide",
  type: "message",
  run: async (ctx) => {
    const user = await account(ctx.author.id);
    const hidden = !user!.lastfmHidden;
    await prefs(ctx.author.id, { lastfmHidden: hidden });
    await ctx.reply(
      hidden
        ? "You are now hidden from Last.fm leaderboards."
        : "You are now visible on Last.fm leaderboards.",
    );
  },
});
