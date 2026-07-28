import { PermissionFlagsBits } from "discord.js";
import { cmd, UserError } from "../../../../../index.ts";
import {
  add,
  findMessage,
  style,
} from "../../../../features/roles/buttonpanels.ts";
import embeds from "../../../../shared/config/embeds.ts";

export default cmd({
  name: "buttonrole add",
  aliases: ["buttonroles add", "br add"],
  description: "Attach a role button to a bot message.",
  syntax:
    "buttonrole add <message> <role> <label> (grey/blue/green/red) (emoji)",
  example: "br add 123456789012345678 @Red Red red 🔴",
  type: "message",
  context: "guild",
  permissions: [PermissionFlagsBits.ManageRoles],
  args: {
    message: {
      type: "string",
      required: true,
      description: "Message ID or link",
    },
    role: { type: "role", required: true, description: "Role to assign" },
    label: { type: "string", required: true, description: "Button label" },
    color: { type: "string", description: "Button color", default: "grey" },
    emoji: { type: "string", description: "Optional emoji" },
  },
  run: async (ctx) => {
    const role = ctx.role("role")!;
    const me = ctx.guild!.members.me ?? (await ctx.guild!.members.fetchMe());
    if (
      role.id === ctx.guild!.id ||
      role.managed ||
      me.roles.highest.comparePositionTo(role) <= 0
    )
      throw new UserError(
        "Choose a role below my highest role that is not managed.",
      );
    const message = await findMessage(
      ctx.guild!,
      ctx.string("message")!,
      ctx.message!.channelId,
    );
    await add(
      ctx.guild!,
      message,
      role,
      ctx.string("label")!,
      style(ctx.string("color") ?? undefined),
      ctx.string("emoji") ?? undefined,
    );
    await ctx.reply(embeds.success(`Added **${role.name}** to that message.`));
  },
});
