import { cmd } from "../../../../index.ts";
import { account, prefs } from "../../../features/lastfm/users.ts";

export default cmd({
  name: "lastfm embed reset",
  aliases: ["lastfm resetembed", "fm resetembed"],
  description: "Reset your Last.fm display to the default container.",
  syntax: "lastfm embed reset",
  example: "fm resetembed",
  type: "message",
  run: async (ctx) => {
    await account(ctx.author.id);
    await prefs(ctx.author.id, { lastfmEmbed: null });
    await ctx.reply("Your Last.fm embed has been reset.");
  },
});
