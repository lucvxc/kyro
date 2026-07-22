import { PermissionFlagsBits } from "discord.js";
import { cmd, UserError } from "../../../../index.ts";
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

    await ctx.server.profile.update({ avatar: file ?? url });
    return ctx.reply(embeds.success("Updated my server avatar."));
  },
});
