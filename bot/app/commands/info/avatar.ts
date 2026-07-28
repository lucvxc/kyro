import { button, cmd, container } from "../../../../index.ts";

export default cmd({
  name: "avatar",
  description: "Show the avatar for a user.",
  type: "hybrid",
  aliases: ["av"],
  syntax: "avatar (@user)",
  example: "avatar @lucvmf",
  args: {
    user: {
      type: "user",
      description: "The user to show the avatar of",
    },
  },
  run: async (ctx) => {
    const user = await ctx.userStats("user");
    const png = user.avatar();

    const card = container()
      .accent(await user.accent())
      .text(`## ${user.tag}'s Avatar`)
      .gallery({
        url: png,
        description: `${user.tag}'s Avatar`,
      })
      .row(
        button({ label: "WEBP", style: "link", url: user.avatar("webp") }),
        button({ label: "PNG", style: "link", url: png }),
        button({ label: "JPG", style: "link", url: user.avatar("jpg") }),
      );

    return ctx.reply(card);
  },
});
