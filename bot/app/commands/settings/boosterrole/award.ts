import { PermissionFlagsBits } from "discord.js";
import { cmd } from "../../../../../index.ts";
import { personalBoosterRole } from "../../../../features/boosterroles/index.ts";
import embeds from "../../../../shared/config/embeds.ts";

export default cmd({
  name: "boosterrole award",
  aliases: ["booster award"],
  description: "Create a personal role for a server booster.",
  syntax: "boosterrole award <user>",
  example: "boosterrole award @user",
  type: "message",
  context: "guild",
  permissions: [PermissionFlagsBits.ManageRoles],
  args: {
    user: { type: "user", required: true, description: "Server booster" },
  },
  run: async (ctx) => {
    const member = await ctx.guild!.members.fetch(ctx.user("user")!.id);
    const role = await personalBoosterRole(member, true);
    return ctx.reply(
      embeds.success(`Awarded ${role} to **${member.user.tag}**.`),
    );
  },
});
