import { PermissionFlagsBits } from "discord.js";
import { cmd } from "../../../../../index.ts";
import embeds from "../../../../shared/config/embeds.ts";

export default cmd({
  name: "leave variables",
  description: "View variables available in leave messages.",
  syntax: "leave variables",
  example: "leave variables",
  type: "message",
  context: "guild",
  permissions: [PermissionFlagsBits.ManageGuild],
  run: (ctx) =>
    ctx.reply(
      embeds.info(
        [
          "`{user}` `{user.tag}` `{user.id}` `{user.mention}` `{user.avatar}`",
          "`{server}` `{server.id}` `{server.count}` `{server.icon}` `{server.banner}`",
          "`{user.createdAt}`",
        ].join("\n"),
      ),
    ),
});
