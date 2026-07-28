import { PermissionFlagsBits } from "discord.js";
import { cmd, UserError } from "../../../../../index.ts";
import embeds from "../../../../shared/config/embeds.ts";

export default cmd({
  name: "customize banner",
  aliases: ["custom banner"],
  description: "Change the bot's server banner.",
  type: "message",
  context: "guild",
  permissions: [PermissionFlagsBits.ManageGuild],
  syntax: "customize banner (url)",
  example: "customize banner https://example.com/banner.png",
  args: {
    url: {
      type: "string",
      description: "Image URL; omit when attaching an image",
    },
  },
  run: async (ctx) => {
    const file = ctx.message?.attachments.first();
    const url = ctx.string("url");
    if (!url && !file)
      throw new UserError("Send an image URL or attach an image.");

    await ctx.server.profile.update({ banner: file ?? url });
    return ctx.reply(embeds.success("Updated my server banner."));
  },
});
