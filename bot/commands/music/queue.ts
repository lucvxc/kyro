import { cmd, container, songLength } from "../../../index.ts";
import { colors } from "../../utils/config/config.ts";

export default cmd({
  name: "queue",
  description: "Show the music queue.",
  type: "message",
  aliases: ["q"],
  context: "guild",
  run: (ctx) => {
    const current = ctx.music.current;
    if (!current) return ctx.reply("Nothing is playing right now.");
    const upcoming = ctx.music.queue.slice(0, 10);
    const list = upcoming.map((track, index) => `**${index + 1}.** ${track.info.title} — ${songLength(track.info.length)}`);
    return ctx.reply(container()
      .accent(colors.default)
      .text(`## Music Queue\n**Now playing:** ${current.info.title}`)
      .separator()
      .text(list.join("\n") || "No songs are waiting."));
  },
});
