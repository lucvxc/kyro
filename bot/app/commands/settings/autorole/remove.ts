import { PermissionFlagsBits } from "discord.js";
import { cmd, UserError } from "../../../../../index.ts";
import {
  communitySettings,
  updateCommunity,
} from "../../../../features/settings/community.ts";
import embeds from "../../../../shared/config/embeds.ts";

const permissions = [PermissionFlagsBits.ManageRoles];

export default cmd({
  name: "autorole remove",
  aliases: ["ar remove"],
  description: "Remove a role from autoroles.",
  syntax: "autorole remove <role>",
  example: "autorole remove @role",
  type: "message",
  context: "guild",
  permissions,
  args: {
    role: { type: "role", required: true, description: "Role to remove" },
  },
  run: async (ctx) => {
    const role = ctx.role("role")!;
    const current = await communitySettings(ctx.guild!.id);
    if (!current.autoroles.includes(role.id))
      throw new UserError("That role is not an autorole.");
    await updateCommunity(ctx.guild!.id, (value) => ({
      ...value,
      autoroles: value.autoroles.filter((id) => id !== role.id),
    }));
    return ctx.reply(embeds.success(`Removed ${role} from autoroles.`));
  },
});
