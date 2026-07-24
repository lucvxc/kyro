import { ChannelType, PermissionFlagsBits } from "discord.js";
import { cmd, UserError } from "../../../../index.ts";
import { jailSettings, updateJail } from "../../../services/settings/jail.ts";
import embeds from "../../../utils/config/embeds.ts";

export default cmd({
  name: "jail setup",
  description: "Create the jail role and private jail channel.",
  syntax: "jail setup",
  example: "jail setup",
  type: "message",
  context: "guild",
  permissions: [PermissionFlagsBits.ManageGuild],
  run: async (ctx) => {
    const current = await jailSettings(ctx.guild!.id);
    if (current.roleId || current.channelId)
      throw new UserError("Jail is already configured.");
    const role = await ctx.guild!.roles.create({
      name: "Jailed",
      reason: `Jail setup by ${ctx.author.tag}`,
    });
    try {
      const channel = await ctx.guild!.channels.create({
        name: "jail",
        type: ChannelType.GuildText,
        permissionOverwrites: [
          { id: ctx.guild!.id, deny: [PermissionFlagsBits.ViewChannel] },
          {
            id: role.id,
            allow: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.SendMessages,
              PermissionFlagsBits.ReadMessageHistory,
            ],
          },
          {
            id: ctx.client.user!.id,
            allow: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.SendMessages,
              PermissionFlagsBits.ManageMessages,
            ],
          },
        ],
        reason: `Jail setup by ${ctx.author.tag}`,
      });
      for (const target of ctx.guild!.channels.cache.values()) {
        if (target.id !== channel.id && "permissionOverwrites" in target)
          await target.permissionOverwrites
            .edit(role.id, { ViewChannel: false }, { reason: "Jail setup" })
            .catch(() => undefined);
      }
      await updateJail(ctx.guild!.id, () => ({
        roleId: role.id,
        channelId: channel.id,
        jailed: {},
      }));
      return ctx.reply(
        embeds.success(`Jail ready with ${role} and ${channel}.`),
      );
    } catch (error) {
      await role.delete("Jail setup failed").catch(() => undefined);
      throw error;
    }
  },
});
