import { cmd, dominant } from "../../../../index.ts";
import { image, profile } from "../../../features/lastfm/client.ts";
import { card, getLastfmUser } from "../../../features/lastfm/view.ts";

export default cmd({
  name: "lastfm whois",
  aliases: ["fm whois", "lf whois"],
  description: "View Last.fm profile information.",
  syntax: "lastfm whois (@user)",
  example: "fm whois @June",
  type: "message",
  args: { user: { type: "user", required: false } },
  run: async (ctx) => {
    const linked = await getLastfmUser(ctx.author, ctx.user("user"));
    const user = await profile(linked.name);
    const joined = new Date(Number(user.registered.unixtime) * 1000);
    const avatar = image(user.image) ?? linked.discord.displayAvatarURL();
    await ctx.reply(
      card(
        user.name,
        `${Number(user.playcount).toLocaleString()} scrobbles\nRegistered <t:${Math.floor(joined.getTime() / 1000)}:R>`,
        avatar,
        {
          url: user.url,
          accent: await dominant(avatar, "#D51007"),
        },
      ),
    );
  },
});
