import { PermissionFlagsBits } from "discord.js";
import { cmd } from "../../../../index.ts";
import { customize } from "../../../utils/customize.ts";
import embeds from "../../../utils/config/embeds.ts";

export default cmd({
  name: "customize reset",
  description: "Reset the bot's server customization.",
  type: "message",
  context: "guild",
  permissions: [PermissionFlagsBits.ManageGuild],
  syntax: "customize reset",
  example: "customize reset",
  run: async ctx => {
    await customize(ctx.client, ctx.guild!, {
      nick: null,
      avatar: null,
      banner: null,
      bio: null,
      display_name_font_id: null,
      display_name_effect_id: null,
      display_name_colors: null,
    });

    return ctx.reply(embeds.success("Reset my server customization."));
  },
});
