import { PermissionFlagsBits } from "discord.js";
import { cmd, container } from "../../../../index.ts";
import { roleSettings } from "../../../services/settings/roles.ts";
import { colors } from "../../../utils/config/config.ts";
import embeds from "../../../utils/config/embeds.ts";

export default cmd({
  name: "reactionrole list",
  description: "List this server's reaction roles.",
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
