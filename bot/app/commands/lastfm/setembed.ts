import { cmd, UserError } from "../../../../index.ts";
import { prefs } from "../../../features/lastfm/users.ts";
import { savedEmbed } from "../../../features/settings/embeds.ts";
import { isEmbedFormat } from "../../../shared/parser.ts";

export default cmd({
  name: "lastfm embed set",
  aliases: ["lastfm setembed", "fm setembed"],
  description: "Set a saved embed or embed code for the fm command.",
  syntax: "lastfm embed set <name/code>",
  example: "fm setembed nowplaying",
  type: "message",
  run: async (ctx) => {
    const input = ctx.raw.join(" ").trim();
    if (!input)
      throw new UserError("Provide a saved embed name or embed code.");
    const code = isEmbedFormat(input)
      ? input
      : (await savedEmbed(ctx.author.id, input)).code;
    await prefs(ctx.author.id, { lastfmEmbed: code });
    await ctx.reply("Your Last.fm embed has been updated.");
  },
});
