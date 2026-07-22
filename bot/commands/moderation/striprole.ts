import { PermissionFlagsBits } from "discord.js";
import { cmd } from "../../../index.ts";
import embeds from "../../utils/config/embeds.ts";

export default cmd({
  name: "striprole",
  description: "Remove a role from every manageable member.",
  type: "message",
  context: "guild",
  permissions: [PermissionFlagsBits.ManageRoles],
  syntax: "striprole <role> (reason)",
  example: "striprole Muted Cleanup",
  args: { role: { type: "role", required: true }, reason: { type: "string" } },
  run: async (ctx) => {
    const role = ctx.role("role")!;
    const count = await ctx.mod.stripRole(role, {
      reason: ctx.string("reason") ?? undefined,
    });
    return ctx.reply(
      embeds.success(
        `Removed ${role} from **${count}** member${count === 1 ? "" : "s"}.`,
      ),
    );
  },
});
