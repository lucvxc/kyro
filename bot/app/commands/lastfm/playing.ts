import { cmd } from "../../../../index.ts";
import { recent } from "../../../features/lastfm/client.ts";
import { linked } from "../../../features/lastfm/users.ts";
import { card } from "../../../features/lastfm/view.ts";

export default cmd({
  name: "lastfm playing",
  aliases: ["fm playing", "lf playing"],
  description: "See what linked members are listening to in this server.",
  syntax: "lastfm playing",
  example: "fm playing",
  type: "message",
  context: "guild",
  run: async (ctx) => {
    const members = await ctx.guild!.members.fetch();
    const rows = await linked([...members.keys()]);
    const tracks = await Promise.all(
      rows.map(async (user) => ({
        user,
        track: (await recent(user.lastfm!, 1).catch(() => []))[0],
      })),
    );
    const body =
      tracks
        .filter((x) => x.track?.["@attr"]?.nowplaying === "true")
        .slice(0, 20)
        .map(
          (x) =>
            `<@${x.user.id}> · **${x.track!.name}** by ${x.track!.artist.name}`,
        )
        .join("\n") || "Nobody is currently scrobbling.";
    await ctx.reply(card("Now playing", body));
  },
});
