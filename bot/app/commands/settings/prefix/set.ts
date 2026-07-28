import { PermissionFlagsBits } from "discord.js";
import { cmd } from "../../../../../index.ts";
import { setPrefix } from "../../../../features/settings/prefix.ts";
import embeds from "../../../../shared/config/embeds.ts";

export default cmd({
  name: "prefix set",
  aliases: ["pfx set"],
  description: "Change this server's command prefix.",
  type: "message",
  context: "guild",
  permissions: [PermissionFlagsBits.ManageGuild],
  syntax: "prefix set <prefix>",
  example: "prefix set !",
  args: {
    prefix: {
      type: "string",
      required: true,
      description: "New command prefix",
    },
  },
  run: async (ctx) => {
    const prefix = await setPrefix(ctx.guild!.id, ctx.string("prefix")!);
    return ctx.reply(
      embeds.success(`Set this server's prefix to **${prefix}**.`),
    );
  },
});
