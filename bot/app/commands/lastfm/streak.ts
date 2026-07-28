import { cmd, dominant, UserError } from "../../../../index.ts";
import { image, recent } from "../../../features/lastfm/client.ts";
import { card, getLastfmUser } from "../../../features/lastfm/view.ts";

export default cmd({
  name: "lastfm streak",
  aliases: ["fm streak", "lf streak"],
  description: "View your current artist listening streak.",
  syntax: "lastfm streak",
  example: "fm streak",
  type: "message",
  run: async (ctx) => {
    const linked = await getLastfmUser(ctx.author);
    const tracks = await recent(linked.name, 200);
    if (!tracks.length) throw new UserError("No recent tracks were found.");
    const current = tracks[0]!;
    const artist = current.artist.name;
    const count = tracks.findIndex(
      (track) => track.artist.name.toLowerCase() !== artist.toLowerCase(),
    );
    const total = count < 0 ? tracks.length : count;
    const artwork = image(current.image);
    await ctx.reply(
      card(
        "listening streak",
        `**${linked.name}** has played **${artist}** **${total.toLocaleString()}** ${total === 1 ? "time" : "times"} in a row.`,
        artwork,
        {
          subtitle: current.album?.["#text"] || current.name,
          accent: artwork ? await dominant(artwork, "#D51007") : 0xd51007,
        },
      ),
    );
  },
});
