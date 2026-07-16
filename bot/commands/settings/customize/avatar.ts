import { PermissionFlagsBits } from "discord.js";
import { cmd, UserError } from "../../../../index.ts";
import { clean, customize, image } from "../../../utils/customize.ts";
import embeds from "../../../utils/config/embeds.ts";

export default cmd({
  name: "customize avatar",
  description: "Change the bot's server avatar.",
  type: "message",
  context: "guild",
  permissions: [PermissionFlagsBits.ManageGuild],
  syntax: "customize avatar (url)",
  example: "customize avatar https://example.com/avatar.png",
  args: {
    url: { type: "string", description: "Image URL; omit when attaching an image" },
  },
  run: async ctx => {
    const file = ctx.message?.attachments.first();
    const url = ctx.string("url");
    if (!url && !file) throw new UserError("Send an image URL or attach an image.");

    await customize(ctx.client, ctx.guild!, clean({ avatar: await image(file ?? url) }));
    return ctx.reply(embeds.success("Updated my server avatar."));
  },
});
