import { button, cmd, container, UserError } from "../../../../index.ts";

export default cmd({
  name: "banner",
  description: "Show the banner for a user.",
  type: "hybrid",
  aliases: ["bn"],
  syntax: "banner (@user)",
  example: "banner @lucvmf",
  args: {
    user: {
      type: "user",
      description: "The user to show the banner of",
    },
  },
  run: async (ctx) => {
    const user = await ctx.userStats("user", true);
    const png = user.banner();

    if (!png) throw new UserError(`${user.tag} does not have a banner.`);

    const card = container()
      .accent(await user.accent("banner"))
      .text(`## ${user.tag}'s Banner`)
      .gallery({ url: png, description: `${user.tag}'s Banner` })
      .row(
        button({ label: "WEBP", style: "link", url: user.banner("webp")! }),
        button({ label: "PNG", style: "link", url: png }),
        button({ label: "JPG", style: "link", url: user.banner("jpg")! }),
      );

    return ctx.reply(card);
  },
});
