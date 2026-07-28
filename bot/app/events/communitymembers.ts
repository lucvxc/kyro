import type { Role } from "discord.js";
import { evt } from "../../../index.ts";
import { communitySettings } from "../../features/settings/community.ts";
import { configuredMessage } from "../../features/settings/communitymessages.ts";

export default [
  evt({
    name: "guildMemberAdd",
    run: async (member) => {
      const settings = await communitySettings(member.guild.id);
      const roles = settings.autoroles
        .map((id) => member.guild.roles.cache.get(id))
        .filter((role): role is Role =>
          Boolean(role?.editable && !role.managed),
        );
      if (roles.length)
        await member.roles.add(roles, "Autoroles").catch(() => undefined);

      const message = await configuredMessage(
        member.guild,
        "welcome",
        member.user,
        member,
      );
      if (message) {
        const channel = member.guild.channels.cache.get(
          message.config.channelId!,
        );
        if (channel?.isSendable())
          await channel
            .send({
              ...message.payload,
              stickers: message.config.stickerId
                ? [message.config.stickerId]
                : undefined,
              allowedMentions: { users: [member.id] },
            })
            .catch(() => undefined);
      }
      for (const id of settings.welcome.pingChannels ?? []) {
        const channel = member.guild.channels.cache.get(id);
        if (!channel?.isSendable()) continue;
        const ping = await channel
          .send({
            content: member.toString(),
            allowedMentions: { users: [member.id] },
          })
          .catch(() => null);
        await ping?.delete().catch(() => undefined);
      }
    },
  }),
  evt({
    name: "guildMemberRemove",
    run: async (member) => {
      const message = await configuredMessage(
        member.guild,
        "leave",
        member.user,
      );
      if (!message) return;
      const channel = member.guild.channels.cache.get(
        message.config.channelId!,
      );
      if (channel?.isSendable())
        await channel
          .send({
            ...message.payload,
            stickers: message.config.stickerId
              ? [message.config.stickerId]
              : undefined,
            allowedMentions: { parse: [] },
          })
          .catch(() => undefined);
    },
  }),
  evt({
    name: "guildMemberUpdate",
    run: async (before, after) => {
      if (before.premiumSinceTimestamp || !after.premiumSinceTimestamp) return;
      const message = await configuredMessage(after.guild, "boost", after.user);
      if (!message) return;
      const channel = after.guild.channels.cache.get(message.config.channelId!);
      if (channel?.isSendable())
        await channel
          .send({
            ...message.payload,
            stickers: message.config.stickerId
              ? [message.config.stickerId]
              : undefined,
            allowedMentions: { users: [after.id] },
          })
          .catch(() => undefined);
    },
  }),
];
