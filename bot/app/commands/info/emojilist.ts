import { cmd, container } from "../../../../index.ts";

export default cmd({
  name: "emojis",
  description: "List this server's custom emojis.",
  type: "message",
  aliases: ["emojilist"],
  syntax: "emojis",
  example: "emojis",
  context: "guild",
  run: async (ctx) => {
    const emojis = await ctx.guild!.stats.loadEmojis();
    const card = container()
      .accent(await ctx.guild!.stats.accent())
      .text(
        `## ${ctx.guild!.stats.name} Emojis\n-# Showing ${emojis.length} of ${ctx.guild!.stats.emojis} · ${ctx.guild!.stats.animated} animated`,
      )
      .separator();

    if (!emojis.length) card.text("No custom emojis.");
    for (let index = 0; index < emojis.length; index += 50)
      card.text(emojis.slice(index, index + 50).join(" "));
    return ctx.reply(card);
  },
});
