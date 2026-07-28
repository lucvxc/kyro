import { PermissionFlagsBits } from "discord.js";
import { cmd } from "../../../../../index.ts";
import embeds from "../../../../shared/config/embeds.ts";

export default cmd({
  name: "customize bio",
  aliases: ["custom bio"],
  description: "Change the bot's server bio.",
  type: "message",
  context: "guild",
  permissions: [PermissionFlagsBits.ManageGuild],
  syntax: "customize bio <bio>",
  example: "customize bio music, moderation, and utility",
  args: {
    bio: { type: "string", required: true, description: "New server bio" },
  },
  run: async (ctx) => {
    await ctx.server.profile.update({ bio: ctx.string("bio") });
    return ctx.reply(embeds.success("Updated my server bio."));
  },
});
