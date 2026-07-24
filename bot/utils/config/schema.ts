export type MessageSettings = {
  channelId?: string;
  message?: string;
  enabled?: boolean;
  stickerId?: string;
  pingChannels?: string[];
  reply?: boolean;
};

export type StickyMessage = MessageSettings & {
  channelId: string;
  attachments?: string[];
  stickerIds?: string[];
  lastMessageId?: string;
};

export type StarboardSettings = {
  channelId?: string;
  emoji?: string;
  emojis?: string[];
  threshold?: number;
  thresholds?: Record<string, number>;
  selfStar?: boolean;
  messages?: Record<string, string>;
};

export type AutoResponse = {
  trigger: string;
  response: string;
  exact?: boolean;
  delete?: boolean;
};

export type LogSettings = {
  channelId?: string;
  enabled?: boolean;
  events?: string[];
  ignoredChannels?: string[];
};

export type SecuritySettings = {
  enabled?: boolean;
  action?: "warn" | "timeout" | "kick" | "ban";
  threshold?: number;
  duration?: number;
  ignoredRoles?: string[];
  ignoredChannels?: string[];
};

export type AntiNukeProtection = {
  enabled: boolean;
  threshold: number;
  window: number;
};

export type AntiNukeProtectionName =
  | "channelcreate"
  | "channeldelete"
  | "rolecreate"
  | "roledelete"
  | "ban"
  | "kick"
  | "webhook"
  | "botadd"
  | "administrator"
  | "prune";

export type AntiNukeSettings = {
  enabled: boolean;
  punishment: "ban" | "kick" | "timeout" | "strip";
  admins: string[];
  whitelist: string[];
  logChannelId?: string;
  protections: Record<AntiNukeProtectionName, AntiNukeProtection>;
};

export type RaidAction =
  "ban" | "kick" | "timeout" | "softban" | "delete" | "none";

export type AntiRaidThreshold = {
  enabled: boolean;
  threshold: number;
  window: number;
  action: RaidAction;
};

export type AntiRaidSettings = {
  enabled: boolean;
  admins: string[];
  whitelist: string[];
  logChannelId?: string;
  lockdown: {
    active: boolean;
    duration: number;
    expiresAt?: number;
    channels: string[];
  };
  protections: {
    joinrate: AntiRaidThreshold & { lockdown: boolean };
    accountage: { enabled: boolean; minimumDays: number; action: RaidAction };
    defaultavatar: { enabled: boolean; action: RaidAction };
    massmention: AntiRaidThreshold;
    messagespam: AntiRaidThreshold;
    duplicatemessage: AntiRaidThreshold;
    linkspam: AntiRaidThreshold;
    invite: { enabled: boolean; action: RaidAction };
  };
};

export type HoneypotSettings = {
  enabled?: boolean;
  channelId?: string;
  panelMessageId?: string;
  catches?: number;
  accent?: string;
};

export type NukeSettings = {
  channelId?: string;
  message?: string;
};

export type JailSettings = {
  roleId?: string;
  channelId?: string;
  jailed?: Record<
    string,
    {
      moderatorId: string;
      reason: string;
      jailedAt: number;
      roleIds: string[];
    }
  >;
};

export type WarnPunishment = {
  warnings: number;
  action: "timeout" | "kick" | "ban";
  duration?: number;
};

export type RoleOption = {
  roleId: string;
  emoji?: string;
  label?: string;
};

export type RoleMenu = {
  channelId: string;
  messageId: string;
  roles: RoleOption[];
};

export type BoosterRole = {
  userId: string;
  roleId: string;
};

export type CountingSettings = {
  channelId?: string;
  count?: number;
  lastUserId?: string;
  highScore?: number;
};

export type ConfessionSettings = {
  channelId?: string;
  logChannelId?: string;
  enabled?: boolean;
  blockedUserIds?: string[];
};

export type LevelSettings = {
  enabled?: boolean;
  ignoredChannels?: string[];
  ignoredRoles?: string[];
  rewards?: Record<number, string>;
};

export type AutoMessage = MessageSettings & {
  id: string;
  channelId: string;
  interval: number;
  lastSent: number;
};

export type MessageFilterSettings = {
  enabled?: boolean;
  punishment?: "delete" | "warn" | "timeout" | "kick" | "ban";
  whitelistedChannels?: string[];
  whitelistedRoles?: string[];
};

export type VoiceMasterSettings = {
  enabled?: boolean;
  categoryId?: string;
  joinChannelId?: string;
  interfaceChannelId?: string;
  defaultName?: string;
  defaultLimit?: number;
  panelType?: "dropdown" | "container" | "embed";
  panelMessageId?: string;
};

export type BoosterRoleSettings = {
  baseRoleId?: string;
  awardRoleId?: string;
};

export type FakePermissionMap = Record<string, string[]>;
