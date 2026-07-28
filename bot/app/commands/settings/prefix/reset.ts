import { PermissionFlagsBits } from "discord.js";
import { cmd } from "../../../../../index.ts";
import { resetPrefix } from "../../../../features/settings/prefix.ts";
import embeds from "../../../../shared/config/embeds.ts";

export default cmd({
  name: "prefix reset",
  aliases: ["pfx reset"],
  description: "Reset this server's command prefix.",
  type: "message",
  context: "guild",
  permissions: [PermissionFlagsBits.ManageGuild],
  syntax: "prefix reset",
  example: "prefix reset",
  run: async (ctx) => {
    const prefix = await resetPrefix(ctx.guild!.id);
    return ctx.reply(
      embeds.success(`Reset this server's prefix to **${prefix}**`),
    );
  },
});
