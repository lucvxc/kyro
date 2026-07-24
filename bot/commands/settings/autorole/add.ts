import { PermissionFlagsBits } from "discord.js";
import { cmd, UserError } from "../../../../index.ts";
import {
  communitySettings,
  updateCommunity,
} from "../../../services/settings/community.ts";
import embeds from "../../../utils/config/embeds.ts";

const permissions = [PermissionFlagsBits.ManageRoles];

export default cmd({
  name: "autorole add",
  aliases: ["autorole set"],
  description: "Add a role given to new members.",
  syntax: "autorole add <role>",
  example: "autorole add @role",
  type: "message",
  context: "guild",
  permissions,
  args: { role: { type: "role", required: true, description: "Role to add" } },
  run: async (ctx) => {
    const role = ctx.role("role")!;
    if (!role.editable || role.managed)
      throw new UserError("I cannot manage that role.");
    const current = await communitySettings(ctx.guild!.id);
    if (current.autoroles.includes(role.id))
      throw new UserError("That role is already an autorole.");
    await updateCommunity(ctx.guild!.id, (value) => ({
      ...value,
      autoroles: [...value.autoroles, role.id],
    }));
    return ctx.reply(embeds.success(`Added ${role} to autoroles.`));
  },
});
