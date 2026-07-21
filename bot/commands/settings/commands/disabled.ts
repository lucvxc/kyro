import { PermissionFlagsBits } from "discord.js";
import { cmd } from "../../../../index.ts";
import { commandSettings } from "../../../services/settings/commands.ts";
import embeds from "../../../utils/config/embeds.ts";

export default cmd({
  name: "command disabled",
  description: "List commands disabled in this server.",
  type: "message",
  context: "guild",
  permissions: [PermissionFlagsBits.ManageGuild],
  syntax: "command disabled",
  example: "command disabled",
  run: async ctx => {
    const { disabled } = await commandSettings(ctx.guild!.id);
    const list = disabled.map(name => `\`${name}\``).join(" · ");
    return ctx.reply(embeds.info(list || "No commands are disabled in this server."));
  },
});
