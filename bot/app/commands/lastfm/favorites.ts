import { cmd } from "../../../../index.ts";
import { loved } from "../../../features/lastfm/client.ts";
import { card, getLastfmUser } from "../../../features/lastfm/view.ts";

export default cmd({
  name: "lastfm favorites",
  aliases: ["fm favorites", "lf favorites", "fm loved", "lf loved"],
  description: "View a user's loved Last.fm tracks.",
  syntax: "lastfm favorites (@user)",
  example: "fm favorites",
  type: "message",
  args: { user: { type: "user", required: false } },
  run: async (ctx) => {
    const linked = await getLastfmUser(ctx.author, ctx.user("user"));
    const tracks = await loved(linked.name, 10);
    const rows = tracks
      .map((track, i) => `**${i + 1}.** ${track.name} · ${track.artist.name}`)
      .join("\n");
    await ctx.reply(
      card(
        `${linked.discord.username}'s loved tracks`,
        rows || "No loved tracks were found.",
      ),
    );
  },
});
