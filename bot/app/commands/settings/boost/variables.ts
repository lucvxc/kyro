import { PermissionFlagsBits } from "discord.js";
import { cmd } from "../../../../../index.ts";
import embeds from "../../../../shared/config/embeds.ts";

export default cmd({
  name: "boost variables",
  description: "View variables available in boost messages.",
  syntax: "boost variables",
  example: "boost variables",
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
          "`{server.boosts}` `{server.tier}`",
        ].join("\n"),
      ),
    ),
});
