import { PermissionFlagsBits } from "discord.js";
import { cmd } from "../../../../index.ts";
import { clean, customize } from "../../../utils/customize.ts";
import embeds from "../../../utils/config/embeds.ts";

export default cmd({
  name: "customize bio",
  description: "Change the bot's server bio.",
  type: "message",
  context: "guild",
  permissions: [PermissionFlagsBits.ManageGuild],
  syntax: "customize bio <bio>",
  example: "customize bio music, moderation, and utility",
  args: {
    bio: { type: "string", required: true, description: "New server bio" },
  },
  run: async ctx => {
    await customize(ctx.client, ctx.guild!, clean({ bio: ctx.string("bio") }));
    return ctx.reply(embeds.success("Updated my server bio."));
  },
});
