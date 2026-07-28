import { cmd, dominant } from "../../../../index.ts";
import { image, recent } from "../../../features/lastfm/client.ts";
import { card, getLastfmUser } from "../../../features/lastfm/view.ts";

export default cmd({
  name: "lastfm recent",
  aliases: [
    "fm recent",
    "lf recent",
    "fm re",
    "lf re",
    "fm history",
    "lf history",
  ],
  description: "Show a user's recently played Last.fm tracks.",
  syntax: "lastfm recent (@user)",
  example: "fm recent",
  type: "message",
  args: { user: { type: "user", required: false } },
  run: async (ctx) => {
    const linked = await getLastfmUser(ctx.author, ctx.user("user"));
    const tracks = await recent(linked.name, 10);
    const rows = tracks
      .map((track, i) => {
        const playing = track["@attr"]?.nowplaying === "true";
        const time = track.date?.uts ? `  ·  <t:${track.date.uts}:R>` : "";
        return `**${i + 1}.** [${track.name}](${track.url})  ·  ${track.artist.name}${playing ? "" : time}`;
      })
      .join("\n");
    const thumb = image(tracks[0]?.image) ?? linked.discord.displayAvatarURL();
    await ctx.reply(
      card("recent tracks", rows || "No recent tracks.", thumb, {
        subtitle: linked.name,
        url: `https://www.last.fm/user/${encodeURIComponent(linked.name)}/library`,
        accent: await dominant(thumb, "#D51007"),
      }),
    );
  },
});
