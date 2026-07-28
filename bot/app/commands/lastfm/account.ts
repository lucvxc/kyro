import { cmd, dominant } from "../../../../index.ts";
import { image, profile } from "../../../features/lastfm/client.ts";
import { card, getLastfmUser } from "../../../features/lastfm/view.ts";

export default cmd({
  name: "lastfm account",
  aliases: ["fm account", "lf account", "fm me", "lf me"],
  description: "View a linked Last.fm account.",
  syntax: "lastfm account (@user)",
  example: "fm account @June",
  type: "message",
  args: { user: { type: "user", required: false } },
  run: async (ctx) => {
    const linked = await getLastfmUser(ctx.author, ctx.user("user"));
    const user = await profile(linked.name);
    const registered = Number(user.registered.unixtime);
    const stats = `**${Number(user.playcount).toLocaleString()}** scrobbles  ·  **${Number(user.artist_count).toLocaleString()}** artists  ·  **${Number(user.album_count).toLocaleString()}** albums  ·  **${Number(user.track_count).toLocaleString()}** tracks${user.country && user.country !== "None" ? `\n-# ${user.country}` : ""}`;
    await ctx.reply(
      card(
        `[${user.name}](${user.url})`,
        stats,
        image(user.image) ?? linked.discord.displayAvatarURL(),
        {
          subtitle: registered ? `member since <t:${registered}:D>` : undefined,
          url: user.url,
          accent: await dominant(linked.discord.displayAvatarURL(), "#D51007"),
        },
      ),
    );
  },
});
