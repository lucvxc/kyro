import { PermissionFlagsBits } from "discord.js";
import { cmd } from "../../../../index.ts";
import { updateBoosterSettings } from "../../../services/settings/boosterroles.ts";
import embeds from "../../../utils/config/embeds.ts";

export default cmd({
  name: "boosterrole base",
  description: "Set the role personal booster roles should sit above.",
  type: "message",
  context: "guild",
  permissions: [PermissionFlagsBits.ManageRoles],
  args: { role: { type: "role", required: true, description: "Base role" } },
  run: async (ctx) => {
    const role = ctx.role("role")!;
    await updateBoosterSettings(ctx.guild!.id, (value) => ({
      ...value,
      baseRoleId: role.id,
    }));
    return ctx.reply(
      embeds.success(`Personal booster roles will be placed above ${role}.`),
    );
  },
});
