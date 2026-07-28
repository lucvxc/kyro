import { cmd } from "../../../../index.ts";
import { profile } from "../../../features/lastfm/client.ts";
import { card, getLastfmUser } from "../../../features/lastfm/view.ts";

export default cmd({
  name: "lastfm count",
  aliases: ["fm count", "lf count", "fm scrobbles", "lf scrobbles"],
  description: "View a user's total Last.fm scrobbles.",
  syntax: "lastfm count (@user)",
  example: "fm count",
  type: "message",
  args: { user: { type: "user", required: false } },
  run: async (ctx) => {
    const linked = await getLastfmUser(ctx.author, ctx.user("user"));
    const user = await profile(linked.name);
    await ctx.reply(
      card(
        "Scrobbles",
        `**${linked.discord.username}** has **${Number(user.playcount).toLocaleString()}** scrobbles.`,
      ),
    );
  },
});
