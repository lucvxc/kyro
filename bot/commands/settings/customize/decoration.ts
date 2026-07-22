import { PermissionFlagsBits } from "discord.js";
import { cmd } from "../../../../index.ts";
import embeds from "../../../utils/config/embeds.ts";

export default cmd({
  name: "customize style",
  aliases: ["customize decoration"],
  description: "Change the bot's display name style.",
  type: "message",
  context: "guild",
  permissions: [PermissionFlagsBits.ManageGuild],
  syntax: "customize style (font) (effect) (colors)",
  example: "customize style jellybean gradient #FFFFFF #A8D694",
  args: {
    font: { type: "string", description: "Font name or ID" },
    effect: { type: "string", description: "Effect name or ID" },
    colors: { type: "string", description: "Hex colors" },
  },
  run: async (ctx) => {
    await ctx.server.profile.update({
      style: {
        font: ctx.string("font") ?? "jellybean",
        effect: ctx.string("effect") ?? "solid",
        colors: ctx.string("colors") ?? "#FFFFFF",
      },
    });

    return ctx.reply(embeds.success("Updated my display name style."));
  },
});
