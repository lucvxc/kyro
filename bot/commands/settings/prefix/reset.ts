import { PermissionFlagsBits } from "discord.js";
import { cmd } from "../../../../index.ts";
import { resetPrefix } from "../../../services/settings/prefix.ts";
import embeds from "../../../utils/config/embeds.ts";

export default cmd({
  name: "prefix reset",
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
