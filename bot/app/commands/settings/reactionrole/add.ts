import { PermissionFlagsBits, type Guild, type Message } from "discord.js";
import { cmd, UserError } from "../../../../../index.ts";
import { updateRoleSettings } from "../../../../features/settings/roles.ts";
import embeds from "../../../../shared/config/embeds.ts";

export default cmd({
  name: "reactionrole add",
  aliases: ["rr add"],
  description: "Connect a reaction on a message to a role.",
  syntax: "reactionrole add <message> <emoji> <role>",
  example: "reactionrole add message ⭐ @role",
  type: "message",
  context: "guild",
  permissions: [PermissionFlagsBits.ManageRoles],
  args: {
    message: {
      type: "string",
      required: true,
      description: "Message ID or link",
    },
    emoji: { type: "string", required: true, description: "Reaction emoji" },
    role: { type: "role", required: true, description: "Role to give" },
  },
  run: async (ctx) => {
    const source = ctx.message!.channel;
    const input = ctx.string("message")!;
    const emoji = ctx.string("emoji")!;
    const role = ctx.role("role")!;
    const target = await findMessage(ctx.guild!, input, source.id);
    if (!target)
      throw new UserError(
        "I could not find that message anywhere in this server.",
      );
    const messageId = target.id;
    await target.react(emoji).catch(() => {
      throw new UserError("That emoji is invalid or unavailable.");
    });
    await updateRoleSettings(ctx.guild!.id, (value) => {
      const menus = [...value.reactionRoles];
      const index = menus.findIndex((menu) => menu.messageId === messageId);
      const menu =
        index >= 0
          ? menus[index]!
          : { channelId: target.channelId, messageId, roles: [] };
      const roles = menu.roles.filter((option) => option.emoji !== emoji);
      roles.push({ roleId: role.id, emoji, label: role.name });
      if (index >= 0) menus[index] = { ...menu, roles };
      else menus.push({ ...menu, roles });
      return { ...value, reactionRoles: menus };
    });
    return ctx.reply(embeds.success(`${emoji} now gives ${role}.`));
  },
});

async function findMessage(
  guild: Guild,
  input: string,
  currentChannelId: string,
): Promise<Message | null> {
  const link = input.match(
    /discord(?:app)?\.com\/channels\/(\d+)\/(\d+)\/(\d+)/,
  );
  if (link && link[1] === guild.id) {
    const channel = guild.channels.cache.get(link[2]!);
    if (channel?.isTextBased() && !channel.isDMBased())
      return channel.messages.fetch(link[3]!).catch(() => null);
    return null;
  }

  const messageId = input.match(/\d{17,20}/)?.[0];
  if (!messageId) return null;
  const current = guild.channels.cache.get(currentChannelId);
  if (current?.isTextBased() && !current.isDMBased()) {
    const message = await current.messages.fetch(messageId).catch(() => null);
    if (message) return message;
  }
  for (const channel of guild.channels.cache.values()) {
    if (
      channel.id === currentChannelId ||
      !channel.isTextBased() ||
      channel.isDMBased()
    )
      continue;
    const message = await channel.messages.fetch(messageId).catch(() => null);
    if (message) return message;
  }
  return null;
}
