import { PermissionFlagsBits } from "discord.js";
import { cmd, UserError } from "../../../../../index.ts";
import {
  roleSettings,
  updateRoleSettings,
} from "../../../../features/settings/roles.ts";
import embeds from "../../../../shared/config/embeds.ts";

export default cmd({
  name: "reactionrole remove",
  aliases: ["rr remove"],
  description: "Remove an emoji from a reaction-role message.",
  syntax: "reactionrole remove <message> <emoji>",
  example: "reactionrole remove message ⭐",
  type: "message",
  context: "guild",
  permissions: [PermissionFlagsBits.ManageRoles],
  args: {
    message: { type: "string", required: true, description: "Message ID" },
    emoji: { type: "string", required: true, description: "Reaction emoji" },
  },
  run: async (ctx) => {
    const messageId = ctx.string("message")!.match(/\d{17,20}(?!.*\d)/)?.[0];
    if (!messageId) throw new UserError("Provide a valid message ID or link.");
    const emoji = ctx.string("emoji")!;
    const configured = (await roleSettings(ctx.guild!.id)).reactionRoles.find(
      (menu) => menu.messageId === messageId,
    );
    let removed = false;
    await updateRoleSettings(ctx.guild!.id, (value) => ({
      ...value,
      reactionRoles: value.reactionRoles
        .map((menu) => {
          if (menu.messageId !== messageId) return menu;
          const roles = menu.roles.filter((option) => option.emoji !== emoji);
          removed = roles.length !== menu.roles.length;
          return { ...menu, roles };
        })
        .filter((menu) => menu.roles.length),
    }));
    if (!removed) throw new UserError("That reaction role is not configured.");
    const channel =
      configured && ctx.guild!.channels.cache.get(configured.channelId);
    if (channel?.isTextBased() && !channel.isDMBased()) {
      const message = await channel.messages.fetch(messageId).catch(() => null);
      const reaction = message?.reactions.cache.find((value) =>
        [value.emoji.id, value.emoji.name, value.emoji.toString()].includes(
          emoji,
        ),
      );
      if (reaction && ctx.client.user) {
        await reaction.users.remove(ctx.client.user.id).catch(() => undefined);
      }
    }
    return ctx.reply(embeds.success(`Removed the ${emoji} reaction role.`));
  },
});
