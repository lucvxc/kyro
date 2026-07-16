import { PermissionFlagsBits } from "discord.js";
import { cmd, UserError } from "../../../../index.ts";
import { clean, customize, image } from "../../../utils/customize.ts";
import embeds from "../../../utils/config/embeds.ts";

export default cmd({
  name: "customize banner",
  description: "Change the bot's server banner.",
  type: "message",
  context: "guild",
  permissions: [PermissionFlagsBits.ManageGuild],
  syntax: "customize banner (url)",
  example: "customize banner https://example.com/banner.png",
  args: {
    url: { type: "string", description: "Image URL; omit when attaching an image" },
  },
  run: async ctx => {
    const file = ctx.message?.attachments.first();
    const url = ctx.string("url");
    if (!url && !file) throw new UserError("Send an image URL or attach an image.");

    await customize(ctx.client, ctx.guild!, clean({ banner: await image(file ?? url) }));
    return ctx.reply(embeds.success("Updated my server banner."));
  },
});
