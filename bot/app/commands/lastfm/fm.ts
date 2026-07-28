import { ThumbnailBuilder } from "discord.js";
import {
  button,
  cmd,
  container,
  dominant,
  messageOptions,
  UserError,
} from "../../../../index.ts";
import {
  image,
  profile,
  recent,
  trackInfo,
} from "../../../features/lastfm/client.ts";
import { getLastfmUser } from "../../../features/lastfm/view.ts";
import { renderEmbed } from "../../../features/settings/embeds.ts";

export default cmd({
  name: "lastfm",
  aliases: ["fm"],
  description: "Show yours or another user's current Last.fm track.",
  syntax: "lastfm (@user)",
  example: "fm @June",
  type: "message",
  args: { user: { type: "user", required: false } },
  run: async (ctx) => {
    const user = await getLastfmUser(ctx.author, ctx.user("user"));
    const track = (await recent(user.name, 1))[0];
    if (!track) throw new UserError("No recent tracks were found.");
    const playing = track["@attr"]?.nowplaying === "true";
    const artwork = image(track.image);
    const [stats, info] = await Promise.all([
      profile(user.name).catch(() => null),
      trackInfo(track.artist.name, track.name, user.name).catch(() => null),
    ]);
    const parts =
      [
        info?.userplaycount
          ? `**${Number(info.userplaycount).toLocaleString()}** plays`
          : null,
        stats?.playcount
          ? `**${Number(stats.playcount).toLocaleString()}** scrobbles`
          : null,
      ]
        .filter(Boolean)
        .join("  ·  ") || `**${user.name}**`;
    const text = `## [${track.name}](${track.url})\nby **${track.artist.name}**${track.album?.["#text"] ? `  ·  ${track.album["#text"]}` : ""}\n-# ${playing ? "now playing" : "last played"}  ·  ${parts}`;
    const view = container().accent(
      artwork ? await dominant(artwork, "#D51007") : 0xd51007,
    );
    if (artwork) view.section(text, new ThumbnailBuilder().setURL(artwork));
    else view.text(text);
    view.row(
      button({ label: "Track", style: "link", url: track.url }),
      button({ label: "Artist", style: "link", url: track.artist.url }),
    );
    const custom =
      user.account.lastfmEmbed && ctx.guild
        ? renderEmbed(
            fill(user.account.lastfmEmbed, {
              track: track.name,
              artist: track.artist.name,
              album: track.album?.["#text"] ?? "",
              image: image(track.image) ?? "",
              username: user.name,
              status: playing ? "Now playing" : "Last played",
            }),
            ctx.guild,
            user.discord,
          )
        : null;
    const sent = await ctx.message!.reply(
      custom
        ? { ...custom, allowedMentions: { repliedUser: false } }
        : (messageOptions(view) as never),
    );
    for (const reaction of user.account.lastfmReactions.slice(0, 2))
      await sent.react(reaction).catch(() => undefined);
  },
});

function fill(input: string, values: Record<string, string>) {
  return input.replace(
    /\{(track|artist|album|image|username|status)\}/gi,
    (_, key: string) => values[key.toLowerCase()] ?? "",
  );
}
