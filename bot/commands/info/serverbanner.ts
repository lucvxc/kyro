import { button, cmd, container, dominant, UserError } from "../../../index.ts";

export default cmd({
  name: "serverbanner",
  description: "Show this server's banner.",
  type: "message",
  aliases: ["guildbanner", "sbanner"],
  syntax: "serverbanner",
  example: "serverbanner",
  context: "guild",
  run: async (ctx) => {
    const banner = ctx.guild!.stats.banner();
    if (!banner) throw new UserError("This server does not have a banner.");

    const card = container()
      .accent(await dominant(banner))
      .text(`## ${ctx.guild!.stats.name}'s Banner`)
      .gallery({
        url: banner,
        description: `${ctx.guild!.stats.name}'s Banner`,
      })
      .row(button({ label: "Open Banner", style: "link", url: banner }));

    return ctx.reply(card);
  },
});
