import { PermissionFlagsBits } from "discord.js";
import { cmd, container } from "../../../../../index.ts";
import { roleSettings } from "../../../../features/settings/roles.ts";
import { colors } from "../../../../shared/config/constants.ts";
import embeds from "../../../../shared/config/embeds.ts";

export default cmd({
  name: "reactionrole list",
  aliases: ["rr list"],
  description: "List this server's reaction roles.",
  syntax: "reactionrole list",
  example: "reactionrole list",
  type: "message",
  context: "guild",
  permissions: [PermissionFlagsBits.ManageRoles],
  run: async (ctx) => {
    const menus = (await roleSettings(ctx.guild!.id)).reactionRoles;
    if (!menus.length)
      return ctx.reply(embeds.warning("No reaction roles are configured."));
    const lines = menus.flatMap((menu) =>
      menu.roles.map(
        (option) =>
          `${option.emoji ?? "?"} <@&${option.roleId}> on [message](https://discord.com/channels/${ctx.guild!.id}/${menu.channelId}/${menu.messageId})`,
      ),
    );
    return ctx.reply(
      container()
        .accent(colors.default)
        .text(`## Reaction roles\n-# ${lines.length} configured`)
        .separator()
        .text(lines.join("\n")),
    );
  },
});
