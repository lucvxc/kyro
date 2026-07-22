import { PermissionFlagsBits } from "discord.js";
import { cmd, container } from "../../../../index.ts";
import { communitySettings } from "../../../services/settings/community.ts";
import { colors } from "../../../utils/config/config.ts";
import embeds from "../../../utils/config/embeds.ts";

const permissions = [PermissionFlagsBits.ManageRoles];

export default cmd({
  name: "autorole list",
  description: "List roles given to new members.",
  type: "message",
  context: "guild",
  permissions,
  run: async (ctx) => {
    const roles = (await communitySettings(ctx.guild!.id)).autoroles;
    if (!roles.length)
      return ctx.reply(embeds.warning("No autoroles are configured."));
    return ctx.reply(
      container()
        .accent(colors.default)
        .text(`### Autoroles\n-# ${roles.length} configured`)
        .separator()
        .text(roles.map((id) => `<@&${id}>`).join("\n")),
    );
  },
});
