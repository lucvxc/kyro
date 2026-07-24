import { PermissionFlagsBits, type Guild, type TextChannel } from "discord.js";
import { securitySettings, updateSecurity } from "../settings/security.ts";

export async function lockGuild(
  guild: Guild,
  duration?: number,
): Promise<number> {
  const everyone = guild.roles.everyone.id;
  const channels: string[] = [];
  for (const channel of guild.channels.cache.values()) {
    if (
      !channel.isTextBased() ||
      channel.isDMBased() ||
      !("permissionOverwrites" in channel)
    )
      continue;
    if (
      channel.permissionOverwrites.cache
        .get(everyone)
        ?.deny.has(PermissionFlagsBits.SendMessages)
    )
      continue;
    await channel.permissionOverwrites
      .edit(everyone, { SendMessages: false }, { reason: "AntiRaid lockdown" })
      .then(() => channels.push(channel.id))
      .catch(() => undefined);
  }
  const minutes =
    duration ?? (await securitySettings(guild.id)).antiraid.lockdown.duration;
  await updateSecurity(guild.id, (value) => ({
    ...value,
    antiraid: {
      ...value.antiraid,
      lockdown: {
        ...value.antiraid.lockdown,
        active: true,
        channels,
        expiresAt: minutes > 0 ? Date.now() + minutes * 60_000 : undefined,
      },
    },
  }));
  if (minutes > 0) scheduleUnlock(guild, minutes);
  return channels.length;
}

export async function unlockGuild(guild: Guild): Promise<number> {
  const config = (await securitySettings(guild.id)).antiraid.lockdown;
  let restored = 0;
  for (const channelId of config.channels) {
    const channel = guild.channels.cache.get(channelId) as
      TextChannel | undefined;
    if (!channel?.isTextBased()) continue;
    await channel.permissionOverwrites
      .edit(
        guild.roles.everyone.id,
        { SendMessages: null },
        { reason: "AntiRaid lockdown ended" },
      )
      .then(() => restored++)
      .catch(() => undefined);
  }
  await updateSecurity(guild.id, (value) => ({
    ...value,
    antiraid: {
      ...value.antiraid,
      lockdown: {
        ...value.antiraid.lockdown,
        active: false,
        channels: [],
        expiresAt: undefined,
      },
    },
  }));
  return restored;
}

function scheduleUnlock(guild: Guild, minutes: number): void {
  setTimeout(async () => {
    const current = (await securitySettings(guild.id)).antiraid.lockdown;
    if (
      current.active &&
      current.expiresAt &&
      current.expiresAt <= Date.now()
    ) {
      await unlockGuild(guild);
    }
  }, minutes * 60_000).unref?.();
}
