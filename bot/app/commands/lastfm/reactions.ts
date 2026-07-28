import { cmd, UserError } from "../../../../index.ts";
import { account, prefs } from "../../../features/lastfm/users.ts";

export default cmd({
  name: "lastfm settings reactions",
  aliases: ["lastfm reactions", "fm reactions", "lf reactions", "lf react"],
  description: "Set up to two reactions for the fm command.",
  syntax: "lastfm settings reactions <emoji1> (emoji2)",
  example: "fm reactions 👍 👎",
  type: "message",
  run: async (ctx) => {
    await account(ctx.author.id);
    const reactions = ctx.raw.slice(0, 2);
    if (!reactions.length) throw new UserError("Provide one or two emojis.");
    await prefs(ctx.author.id, { lastfmReactions: reactions });
    await ctx.reply(`Last.fm reactions set to ${reactions.join(" ")}.`);
  },
});
