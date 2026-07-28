import { PermissionFlagsBits } from "discord.js";
import { cmd } from "../../../../../index.ts";
import { getCommandSettings } from "../../../../features/settings/commands.ts";
import embeds from "../../../../shared/config/embeds.ts";

export default cmd({
  name: "aliases",
  description: "List custom command aliases in this server.",
  type: "message",
  context: "guild",
  permissions: [PermissionFlagsBits.ManageGuild],
  syntax: "aliases",
  example: "aliases",
  run: async (ctx) => {
    const { aliases } = await getCommandSettings(ctx.guild!.id);
    const list = Object.entries(aliases)
      .map(([alias, command]) => `\`${alias}\` → **${command}**`)
      .join("\n");
    return ctx.reply(embeds.info(list || "This server has no custom aliases."));
  },
});
