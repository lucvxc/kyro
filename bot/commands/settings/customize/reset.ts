import { PermissionFlagsBits } from "discord.js";
import { cmd } from "../../../../index.ts";
import embeds from "../../../utils/config/embeds.ts";

export default cmd({
  name: "customize reset",
  description: "Reset the bot's server customization.",
  type: "message",
  context: "guild",
  permissions: [PermissionFlagsBits.ManageGuild],
  syntax: "customize reset",
  example: "customize reset",
  run: async (ctx) => {
    await ctx.server.profile.reset();

    return ctx.reply(embeds.success("Reset my server customization."));
  },
});
