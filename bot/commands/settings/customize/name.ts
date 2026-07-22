import { PermissionFlagsBits } from "discord.js";
import { cmd } from "../../../../index.ts";
import embeds from "../../../utils/config/embeds.ts";

export default cmd({
  name: "customize name",
  description: "Change the bot's server nickname.",
  type: "message",
  context: "guild",
  permissions: [PermissionFlagsBits.ManageGuild],
  syntax: "customize name <name>",
  example: "customize name june",
  args: {
    name: {
      type: "string",
      required: true,
      description: "New server nickname",
    },
  },
  run: async (ctx) => {
    await ctx.server.profile.update({ name: ctx.string("name") });
    return ctx.reply(embeds.success("Updated my server name."));
  },
});
