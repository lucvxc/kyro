import { cmd, container } from "../../../index.ts";

export default cmd({
  name: "stickers",
  description: "List this server's stickers.",
  type: "message",
  aliases: ["stickerlist"],
  syntax: "stickers",
  example: "stickers",
  context: "guild",
  run: async (ctx) => {
    const stickers = ctx.guild!.stats.stickerList();
    const total = ctx.guild!.stats.stickers;

    return ctx.reply(
      container()
        .accent(await ctx.guild!.stats.accent())
        .text(
          `## Stickers in ${ctx.guild!.stats.name}\n-# ${total} ${total === 1 ? "sticker" : "stickers"}`,
        )
        .separator()
        .text(
          stickers.map((sticker) => `\`${sticker}\``).join(" · ") ||
            "No stickers.",
        ),
    );
  },
});
