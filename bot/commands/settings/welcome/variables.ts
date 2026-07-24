import { PermissionFlagsBits } from "discord.js";
import { cmd } from "../../../../index.ts";
import embeds from "../../../utils/config/embeds.ts";

export default cmd({
  name: "welcome variables",
  description: "View variables available in welcome messages.",
  syntax: "welcome variables",
  example: "welcome variables",
  type: "message",
  context: "guild",
  permissions: [PermissionFlagsBits.ManageGuild],
  run: (ctx) =>
    ctx.reply(
      embeds.info(
        [
          "`{user}` `{user.tag}` `{user.id}` `{user.mention}` `{user.avatar}`",
          "`{server}` `{server.id}` `{server.count}` `{server.icon}` `{server.banner}`",
          "`{member.createdAt}` `{member.joinedAt}`",
        ].join("\n"),
      ),
    ),
});
