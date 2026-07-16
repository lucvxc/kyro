import { button, cmd, container, time } from "../../../index.ts";

export default cmd({
  name: "emojiinfo",
  description: "Show information about a custom emoji.",
  type: "message",
  aliases: ["emoji", "ei"],
  syntax: "emojiinfo <emoji>",
  example: "emojiinfo :wave:",
  context: "guild",
  args: {
    emoji: { type: "string", description: "The emoji to look up", required: true },
  },
  run: async (ctx) => {
    const emoji = await ctx.emojiStats("emoji");
    const image = emoji.image();
    const card = container()

      .accent(await emoji.accent())
      .text(`## ${emoji.name}`)
      .gallery({ url: image, description: `${emoji.name} emoji` })
      .text(`**Animated** ${emoji.animated ? "Yes" : "No"}\n**Created** ${time(emoji.created)}\n-# ID ${emoji.id}`)
      .row(button({ label: "Open Emoji", style: "link", url: image }));

    return ctx.reply(card);
  },
});
