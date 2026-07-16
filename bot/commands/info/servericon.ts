import { button, cmd, container, dominant, UserError } from "../../../index.ts";

export default cmd({
  name: "servericon",
  description: "Show this server's icon.",
  type: "message",
  aliases: ["guildicon", "sicon"],
  syntax: "servericon",
  example: "servericon",
  context: "guild",
  run: async (ctx) => {
    const icon = ctx.guild!.stats.icon();
    if (!icon) throw new UserError("This server does not have an icon.");

    const card = container()
      .accent(await dominant(icon))
      .text(`## ${ctx.guild!.stats.name}'s Icon`)
      .gallery({ url: icon, description: `${ctx.guild!.stats.name}'s Icon` })
      .row(button({ label: "Open Icon", style: "link", url: icon }));

    return ctx.reply(card);
  },
});
