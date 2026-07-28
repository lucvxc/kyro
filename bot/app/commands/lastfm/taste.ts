import { cmd, UserError } from "../../../../index.ts";
import { top, type Artist } from "../../../features/lastfm/client.ts";
import { card, getLastfmUser } from "../../../features/lastfm/view.ts";

export default cmd({
  name: "lastfm taste",
  aliases: ["fm taste", "lf taste"],
  description: "Compare your music taste with another user.",
  syntax: "lastfm taste <@user>",
  example: "fm taste @June",
  type: "message",
  args: { user: { type: "user" } },
  run: async (ctx) => {
    const target = ctx.user("user");
    if (!target || target.id === ctx.author.id)
      throw new UserError("Mention another linked user.");
    const [first, second] = await Promise.all([
      getLastfmUser(ctx.author),
      getLastfmUser(ctx.author, target),
    ]);
    const [a, b] = await Promise.all([
      top(first.name, "artists", "overall", 100) as Promise<Artist[]>,
      top(second.name, "artists", "overall", 100) as Promise<Artist[]>,
    ]);
    const names = new Set(a.map((item) => item.name.toLowerCase()));
    const shared = b.filter((item) => names.has(item.name.toLowerCase()));
    const score = Math.round(
      (shared.length /
        Math.max(
          new Set([...a, ...b].map((item) => item.name.toLowerCase())).size,
          1,
        )) *
        100,
    );
    await ctx.reply(
      card(
        "Taste comparison",
        `**${first.discord.username}** and **${second.discord.username}** are **${score}%** compatible.\n${
          shared
            .slice(0, 5)
            .map((item) => item.name)
            .join(" · ") || "No shared top artists."
        }`,
      ),
    );
  },
});
