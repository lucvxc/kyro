export type MessageSettings = {
  channelId?: string;
  message?: string;
  enabled?: boolean;
};

export type StickyMessage = MessageSettings & { channelId: string };

export type StarboardSettings = {
  channelId?: string;
  emoji?: string;
  threshold?: number;
  selfStar?: boolean;
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
};

export type ConfessionSettings = {
  channelId?: string;
  logChannelId?: string;
};

export type LevelSettings = {
  enabled?: boolean;
  ignoredChannels?: string[];
  ignoredRoles?: string[];
  rewards?: Record<number, string>;
};

export type AutoMessage = MessageSettings & {
  channelId: string;
  interval: number;
};

export type FakePermissionMap = Record<string, string[]>;
export type SavedEmbed = {
  id: string;
  name: string;
  userId: string;
  code: string;
  savedAt: string;
};

export type SavedEmbedMap = Record<string, SavedEmbed>;
