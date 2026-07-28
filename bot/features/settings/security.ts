import { eq } from "drizzle-orm";
import { store } from "../../../index.ts";
import { db } from "../../db/database.ts";
import { guilds } from "../../db/schema.ts";
import type {
  AntiNukeSettings,
  AntiRaidSettings,
  HoneypotSettings,
} from "../../db/settings.ts";

export const defaultAntiNuke = (): AntiNukeSettings => ({
  enabled: false,
  punishment: "ban",
  admins: [],
  whitelist: [],
  protections: {
    channelcreate: protection(5, 10),
    channeldelete: protection(2, 10),
    rolecreate: protection(5, 10),
    roledelete: protection(2, 10),
    ban: protection(3, 10),
    kick: protection(3, 10),
    webhook: protection(2, 30),
    botadd: protection(1, 1),
    administrator: protection(1, 1),
    prune: protection(1, 1),
  },
});

export const defaultAntiRaid = (): AntiRaidSettings => ({
  enabled: false,
  admins: [],
  whitelist: [],
  lockdown: { active: false, duration: 15, channels: [] },
  protections: {
    joinrate: { ...raidProtection(10, 10, "kick"), lockdown: true },
    accountage: { enabled: false, minimumDays: 7, action: "kick" },
    defaultavatar: { enabled: false, action: "kick" },
    massmention: raidProtection(6, 5, "timeout"),
    messagespam: raidProtection(8, 5, "timeout"),
    duplicatemessage: raidProtection(5, 10, "timeout"),
    linkspam: raidProtection(5, 10, "timeout"),
    invite: { enabled: false, action: "delete" },
  },
});

type Cfg = {
  antinuke: AntiNukeSettings;
  antiraid: AntiRaidSettings;
  honeypot: HoneypotSettings;
};

const settings = store<string, Cfg>({
  ttl: 300,
  max: 10_000,
  load: async (guildId) => {
    const [row] = await db
      .select({
        antinuke: guilds.antinuke,
        antiraid: guilds.antiraid,
        honeypot: guilds.honeypot,
      })
      .from(guilds)
      .where(eq(guilds.id, guildId))
      .limit(1);
    return {
      antinuke: mergeAntiNuke(row?.antinuke),
      antiraid: mergeAntiRaid(row?.antiraid),
      honeypot: structuredClone(row?.honeypot ?? {}),
    };
  },
  save: async (guildId, value) => {
    const values = { ...structuredClone(value), updatedAt: new Date() };
    await db
      .insert(guilds)
      .values({ id: guildId, ...values })
      .onConflictDoUpdate({
        target: guilds.id,
        set: values,
      });
  },
});

export function securitySettings(guildId: string) {
  return settings.get(guildId);
}

export function updateSecurity(guildId: string, change: (value: Cfg) => Cfg) {
  return settings.update(guildId, (current) =>
    change(structuredClone(current)),
  );
}

function protection(threshold: number, window: number) {
  return { enabled: false, threshold, window };
}

function raidProtection(
  threshold: number,
  window: number,
  action: "kick" | "timeout",
) {
  return { enabled: false, threshold, window, action };
}

export function recommendedAntiNuke(): AntiNukeSettings {
  const config = defaultAntiNuke();
  config.enabled = true;
  for (const protection of Object.values(config.protections))
    protection.enabled = true;
  return config;
}

export function recommendedAntiRaid(): AntiRaidSettings {
  const config = defaultAntiRaid();
  config.enabled = true;
  config.protections.joinrate.enabled = true;
  config.protections.accountage.enabled = true;
  config.protections.massmention.enabled = true;
  config.protections.messagespam.enabled = true;
  config.protections.duplicatemessage.enabled = true;
  config.protections.linkspam.enabled = true;
  config.protections.invite.enabled = true;
  return config;
}

function mergeAntiNuke(value?: Partial<AntiNukeSettings>): AntiNukeSettings {
  const defaults = defaultAntiNuke();
  return {
    ...defaults,
    ...value,
    admins: [...(value?.admins ?? [])],
    whitelist: [...(value?.whitelist ?? [])],
    protections: Object.fromEntries(
      Object.entries(defaults.protections).map(([name, fallback]) => [
        name,
        {
          ...fallback,
          ...value?.protections?.[name as keyof typeof defaults.protections],
        },
      ]),
    ) as AntiNukeSettings["protections"],
  };
}

function mergeAntiRaid(value?: Partial<AntiRaidSettings>): AntiRaidSettings {
  const defaults = defaultAntiRaid();
  const incoming = value?.protections;
  return {
    ...defaults,
    ...value,
    admins: [...(value?.admins ?? [])],
    whitelist: [...(value?.whitelist ?? [])],
    lockdown: { ...defaults.lockdown, ...value?.lockdown },
    protections: {
      joinrate: { ...defaults.protections.joinrate, ...incoming?.joinrate },
      accountage: {
        ...defaults.protections.accountage,
        ...incoming?.accountage,
      },
      defaultavatar: {
        ...defaults.protections.defaultavatar,
        ...incoming?.defaultavatar,
      },
      massmention: {
        ...defaults.protections.massmention,
        ...incoming?.massmention,
      },
      messagespam: {
        ...defaults.protections.messagespam,
        ...incoming?.messagespam,
      },
      duplicatemessage: {
        ...defaults.protections.duplicatemessage,
        ...incoming?.duplicatemessage,
      },
      linkspam: { ...defaults.protections.linkspam, ...incoming?.linkspam },
      invite: { ...defaults.protections.invite, ...incoming?.invite },
    },
  };
}
