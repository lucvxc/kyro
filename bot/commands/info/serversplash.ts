import { button, cmd, container, dominant, UserError } from "../../../index.ts";

export default cmd({
  name: "serversplash",
  description: "Show this server's invite splash.",
  type: "message",
  aliases: ["guildsplash", "splash"],
  syntax: "serversplash",
  example: "serversplash",
  context: "guild",
  run: async (ctx) => {
    const splash = ctx.guild!.stats.splash();
    if (!splash) throw new UserError("This server does not have an invite splash.");

    return ctx.reply(container()
      .accent(await dominant(splash))
      .text(`## ${ctx.guild!.stats.name}'s Splash`)
      .gallery({ url: splash, description: `${ctx.guild!.stats.name}'s Invite Splash` })
      .row(button({ label: "Open Splash", style: "link", url: splash })));
  },
});
