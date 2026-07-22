import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";
import type {
  AutoMessage,
  AutoResponse,
  BoosterRole,
  BoosterRoleSettings,
  ConfessionSettings,
  CountingSettings,
  FakePermissionMap,
  JailSettings,
  LevelSettings,
  LogSettings,
  MessageFilterSettings,
  MessageSettings,
  NukeSettings,
  RoleMenu,
  SecuritySettings,
  StarboardSettings,
  StickyMessage,
  VoiceMasterSettings,
  WarnPunishment,
} from "../utils/config/schema.ts";

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  balance: integer("balance").notNull().default(0),
  lastfm: text("lastfm"),
  premium: boolean("premium").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const guilds = pgTable("guilds", {
  id: text("id").primaryKey(),
  prefix: varchar("prefix", { length: 5 }).notNull().default("$"),
  premiumTier: integer("premium_tier").notNull().default(1),

  autoroles: jsonb("autoroles").$type<string[]>().notNull().default([]),
  stickyMessages: jsonb("sticky_messages")
    .$type<StickyMessage[]>()
    .notNull()
    .default([]),
  starboard: jsonb("starboard")
    .$type<StarboardSettings>()
    .notNull()
    .default({}),
  autoresponders: jsonb("autoresponders")
    .$type<AutoResponse[]>()
    .notNull()
    .default([]),
  welcome: jsonb("welcome").$type<MessageSettings>().notNull().default({}),
  leave: jsonb("leave").$type<MessageSettings>().notNull().default({}),
  boost: jsonb("boost").$type<MessageSettings>().notNull().default({}),

  logging: jsonb("logging").$type<LogSettings>().notNull().default({}),
  automodLog: text("automod_log"),
  nuke: jsonb("nuke").$type<NukeSettings>().notNull().default({}),
  antinuke: jsonb("antinuke").$type<SecuritySettings>().notNull().default({}),
  antiraid: jsonb("antiraid").$type<SecuritySettings>().notNull().default({}),
  honeypot: jsonb("honeypot").$type<SecuritySettings>().notNull().default({}),
  jail: jsonb("jail").$type<JailSettings>().notNull().default({}),
  warnPunishments: jsonb("warn_punishments")
    .$type<WarnPunishment[]>()
    .notNull()
    .default([]),

  reactionRoles: jsonb("reaction_roles")
    .$type<RoleMenu[]>()
    .notNull()
    .default([]),
  boosterRoles: jsonb("booster_roles")
    .$type<BoosterRole[]>()
    .notNull()
    .default([]),
  boosterRoleSettings: jsonb("booster_role_settings")
    .$type<BoosterRoleSettings>()
    .notNull()
    .default({}),
  stickyRoles: boolean("sticky_roles").notNull().default(false),
  fakePermissions: jsonb("fake_permissions")
    .$type<FakePermissionMap>()
    .notNull()
    .default({}),

  counting: jsonb("counting").$type<CountingSettings>().notNull().default({}),
  confessions: jsonb("confessions")
    .$type<ConfessionSettings>()
    .notNull()
    .default({}),
  leveling: jsonb("leveling").$type<LevelSettings>().notNull().default({}),
  automessages: jsonb("automessages")
    .$type<AutoMessage[]>()
    .notNull()
    .default([]),
  antilink: jsonb("antilink")
    .$type<MessageFilterSettings>()
    .notNull()
    .default({}),
  antiinvite: jsonb("antiinvite")
    .$type<MessageFilterSettings>()
    .notNull()
    .default({}),
  voiceMaster: jsonb("voice_master")
    .$type<VoiceMasterSettings>()
    .notNull()
    .default({}),
  autoplay: boolean("autoplay").notNull().default(false),

  disabledCommands: jsonb("disabled_commands")
    .$type<string[]>()
    .notNull()
    .default([]),
  customAliases: jsonb("custom_aliases")
    .$type<Record<string, string>>()
    .notNull()
    .default({}),
  customAvatar: text("custom_avatar"),
  customBanner: text("custom_banner"),
  nameStyle: text("name_style"),

  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const warnings = pgTable(
  "warnings",
  {
    id: serial("id").primaryKey(),
    guildId: text("guild_id").notNull(),
    userId: text("user_id").notNull(),
    moderatorId: text("moderator_id").notNull(),
    reason: text("reason").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [index("warnings_member_idx").on(table.guildId, table.userId)],
);

export const savedEmbeds = pgTable(
  "saved_embeds",
  {
    id: varchar("id", { length: 12 }).primaryKey(),
    userId: text("user_id").notNull(),
    name: varchar("name", { length: 100 }).notNull(),
    code: text("code").notNull(),
    isPublic: boolean("is_public").notNull().default(false),
    shareCode: varchar("share_code", { length: 16 }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("saved_embeds_user_idx").on(table.userId),
    uniqueIndex("saved_embeds_share_code_idx").on(table.shareCode),
  ],
);

export const tempRoles = pgTable(
  "temp_roles",
  {
    guildId: text("guild_id").notNull(),
    userId: text("user_id").notNull(),
    roleId: text("role_id").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.guildId, table.userId, table.roleId] }),
    index("temp_roles_expiry_idx").on(table.expiresAt),
  ],
);

export const stickyMembers = pgTable(
  "sticky_members",
  {
    guildId: text("guild_id").notNull(),
    userId: text("user_id").notNull(),
    roleId: text("role_id").notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.guildId, table.userId, table.roleId] }),
  ],
);

export const voiceChannels = pgTable(
  "voice_channels",
  {
    channelId: text("channel_id").primaryKey(),
    guildId: text("guild_id").notNull(),
    ownerId: text("owner_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [index("voice_channels_guild_idx").on(table.guildId)],
);

export const boosterRoleMembers = pgTable(
  "booster_role_members",
  {
    guildId: text("guild_id").notNull(),
    userId: text("user_id").notNull(),
    roleId: text("role_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.guildId, table.userId] }),
    uniqueIndex("booster_role_members_role_idx").on(table.roleId),
  ],
);

export const confessionEntries = pgTable(
  "confession_entries",
  {
    id: serial("id").primaryKey(),
    guildId: text("guild_id").notNull(),
    userId: text("user_id").notNull(),
    messageId: text("message_id"),
    content: text("content").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [index("confession_entries_guild_idx").on(table.guildId)],
);
