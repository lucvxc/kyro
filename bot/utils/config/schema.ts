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

export type NukeSettings = {
  channelId?: string;
  message?: string;
};

export type JailSettings = {
  roleId?: string;
  channelId?: string;
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
