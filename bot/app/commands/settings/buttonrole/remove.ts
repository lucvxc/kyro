import { PermissionFlagsBits } from "discord.js";
import { cmd, UserError } from "../../../../../index.ts";
import {
  findMessage,
  update,
} from "../../../../features/roles/buttonpanels.ts";
import embeds from "../../../../shared/config/embeds.ts";

export default cmd({
  name: "buttonrole remove",
  aliases: ["buttonroles remove", "br remove"],
  description: "Remove a role button from a bot message.",
  syntax: "buttonrole remove <message> <role>",
  example: "br remove 123456789012345678 @Red",
  type: "message",
  context: "guild",
  permissions: [PermissionFlagsBits.ManageRoles],
  args: {
    message: { type: "string", required: true },
    role: { type: "role", required: true },
  },
  run: async (ctx) => {
    const role = ctx.role("role")!;
    const message = await findMessage(
      ctx.guild!,
      ctx.string("message")!,
      ctx.message!.channelId,
    );
    await update(ctx.guild!, message, (current) => {
      if (!current.roles.some((item) => item.roleId === role.id))
        throw new UserError("That role is not attached to this message.");
      return {
        ...current,
        roles: current.roles.filter((item) => item.roleId !== role.id),
      };
    });
    await ctx.reply(
      embeds.success(`Removed **${role.name}** from that message.`),
    );
  },
});
