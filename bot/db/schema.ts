import {
  boolean,
  bigint,
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
  AntiNukeSettings,
  AntiRaidSettings,
  BoosterRole,
  BoosterRoleSettings,
  ButtonRolePanel,
  ConfessionSettings,
  CountingSettings,
  FakePermissionMap,
  JailSettings,
  HoneypotSettings,
  LevelSettings,
  LogSettings,
  MessageFilterSettings,
  MessageSettings,
  NukeSettings,
  RoleMenu,
  StarboardSettings,
  StickyMessage,
  TicketSettings,
  VoiceMasterSettings,
  WarnPunishment,
} from "./settings.ts";

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  balance: integer("balance").notNull().default(0),
  lastfm: text("lastfm"),
  lastfmSession: text("lastfm_session"),
  lastfmEmbed: text("lastfm_embed"),
  lastfmReactions: jsonb("lastfm_reactions")
    .$type<string[]>()
    .notNull()
    .default([]),
  lastfmHidden: boolean("lastfm_hidden").notNull().default(false),
  afkReason: text("afk_reason"),
  afkSince: timestamp("afk_since", { withTimezone: true }),
  timezone: varchar("timezone", { length: 64 }),
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
  caseLogChannelId: text("case_log_channel_id"),
  nuke: jsonb("nuke").$type<NukeSettings>().notNull().default({}),
  antinuke: jsonb("antinuke")
    .$type<AntiNukeSettings>()
    .notNull()
    .default({} as AntiNukeSettings),
  antiraid: jsonb("antiraid")
    .$type<AntiRaidSettings>()
    .notNull()
    .default({} as AntiRaidSettings),
  honeypot: jsonb("honeypot").$type<HoneypotSettings>().notNull().default({}),
  jail: jsonb("jail").$type<JailSettings>().notNull().default({}),
  warnPunishments: jsonb("warn_punishments")
    .$type<WarnPunishment[]>()
    .notNull()
    .default([]),

  reactionRoles: jsonb("reaction_roles")
    .$type<RoleMenu[]>()
    .notNull()
    .default([]),
  buttonRoles: jsonb("button_roles")
    .$type<ButtonRolePanel[]>()
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
  tickets: jsonb("tickets").$type<TicketSettings>().notNull().default({}),
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

export const reminders = pgTable(
  "reminders",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id").notNull(),
    guildId: text("guild_id"),
    channelId: text("channel_id").notNull(),
    content: text("content").notNull(),
    dueAt: timestamp("due_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("reminders_due_idx").on(table.dueAt),
    index("reminders_user_idx").on(table.userId),
  ],
);

export const giveaways = pgTable(
  "giveaways",
  {
    id: varchar("id", { length: 12 }).primaryKey(),
    guildId: text("guild_id").notNull(),
    channelId: text("channel_id").notNull(),
    messageId: text("message_id").notNull(),
    hostId: text("host_id").notNull(),
    prize: text("prize").notNull(),
    winnerCount: integer("winner_count").notNull().default(1),
    entries: jsonb("entries").$type<string[]>().notNull().default([]),
    endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
    endedAt: timestamp("ended_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("giveaways_due_idx").on(table.endsAt),
    index("giveaways_guild_idx").on(table.guildId),
  ],
);

export const tickets = pgTable(
  "tickets",
  {
    id: serial("id").primaryKey(),
    guildId: text("guild_id").notNull(),
    channelId: text("channel_id").notNull().unique(),
    userId: text("user_id").notNull(),
    number: integer("number").notNull(),
    status: varchar("status", { length: 16 }).notNull().default("open"),
    claimedBy: text("claimed_by"),
    closedBy: text("closed_by"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    closedAt: timestamp("closed_at", { withTimezone: true }),
  },
  (table) => [
    index("tickets_guild_idx").on(table.guildId),
    index("tickets_user_idx").on(table.guildId, table.userId),
  ],
);

export const inviteMembers = pgTable(
  "invite_members",
  {
    id: serial("id").primaryKey(),
    guildId: text("guild_id").notNull(),
    memberId: text("member_id").notNull(),
    inviterId: text("inviter_id"),
    code: varchar("code", { length: 32 }),
    fake: boolean("fake").notNull().default(false),
    joinedAt: timestamp("joined_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    leftAt: timestamp("left_at", { withTimezone: true }),
  },
  (table) => [
    index("invite_members_inviter_idx").on(table.guildId, table.inviterId),
    index("invite_members_member_idx").on(table.guildId, table.memberId),
  ],
);

export const cases = pgTable(
  "moderation_cases",
  {
    id: serial("id").primaryKey(),
    guildId: text("guild_id").notNull(),
    number: integer("number").notNull(),
    userId: text("user_id").notNull(),
    moderatorId: text("moderator_id").notNull(),
    action: varchar("action", { length: 32 }).notNull(),
    reason: text("reason").notNull().default("No reason provided"),
    duration: text("duration"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("cases_guild_number_idx").on(table.guildId, table.number),
    index("cases_user_idx").on(table.guildId, table.userId),
  ],
);

export const botStats = pgTable("bot_stats", {
  id: integer("id").primaryKey().default(1),
  messages: bigint("messages", { mode: "number" }).notNull().default(0),
  commands: bigint("commands", { mode: "number" }).notNull().default(0),
  reactions: bigint("reactions", { mode: "number" }).notNull().default(0),
  deleted: bigint("deleted", { mode: "number" }).notNull().default(0),
  edited: bigint("edited", { mode: "number" }).notNull().default(0),
  attachments: bigint("attachments", { mode: "number" }).notNull().default(0),
  links: bigint("links", { mode: "number" }).notNull().default(0),
  voiceSeconds: bigint("voice_seconds", { mode: "number" })
    .notNull()
    .default(0),
  membersJoined: bigint("members_joined", { mode: "number" })
    .notNull()
    .default(0),
  membersLeft: bigint("members_left", { mode: "number" }).notNull().default(0),
  moderationActions: bigint("moderation_actions", { mode: "number" })
    .notNull()
    .default(0),
  commandCounts: jsonb("command_counts")
    .$type<Record<string, number>>()
    .notNull()
    .default({}),
  startedAt: timestamp("started_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const guildStats = pgTable("guild_stats", {
  guildId: text("guild_id").primaryKey(),
  messages: bigint("messages", { mode: "number" }).notNull().default(0),
  commands: bigint("commands", { mode: "number" }).notNull().default(0),
  reactions: bigint("reactions", { mode: "number" }).notNull().default(0),
  deleted: bigint("deleted", { mode: "number" }).notNull().default(0),
  edited: bigint("edited", { mode: "number" }).notNull().default(0),
  attachments: bigint("attachments", { mode: "number" }).notNull().default(0),
  links: bigint("links", { mode: "number" }).notNull().default(0),
  voiceSeconds: bigint("voice_seconds", { mode: "number" })
    .notNull()
    .default(0),
  membersJoined: bigint("members_joined", { mode: "number" })
    .notNull()
    .default(0),
  membersLeft: bigint("members_left", { mode: "number" }).notNull().default(0),
  moderationActions: bigint("moderation_actions", { mode: "number" })
    .notNull()
    .default(0),
  peakVoice: integer("peak_voice").notNull().default(0),
  commandCounts: jsonb("command_counts")
    .$type<Record<string, number>>()
    .notNull()
    .default({}),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const statDays = pgTable(
  "stat_days",
  {
    id: text("id").primaryKey(),
    guildId: text("guild_id"),
    day: varchar("day", { length: 10 }).notNull(),
    messages: bigint("messages", { mode: "number" }).notNull().default(0),
    commands: bigint("commands", { mode: "number" }).notNull().default(0),
    reactions: bigint("reactions", { mode: "number" }).notNull().default(0),
    deleted: bigint("deleted", { mode: "number" }).notNull().default(0),
    edited: bigint("edited", { mode: "number" }).notNull().default(0),
    attachments: bigint("attachments", { mode: "number" }).notNull().default(0),
    links: bigint("links", { mode: "number" }).notNull().default(0),
    voiceSeconds: bigint("voice_seconds", { mode: "number" })
      .notNull()
      .default(0),
    membersJoined: bigint("members_joined", { mode: "number" })
      .notNull()
      .default(0),
    membersLeft: bigint("members_left", { mode: "number" })
      .notNull()
      .default(0),
    moderationActions: bigint("moderation_actions", { mode: "number" })
      .notNull()
      .default(0),
    commandCounts: jsonb("command_counts")
      .$type<Record<string, number>>()
      .notNull()
      .default({}),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [index("stat_days_guild_day_idx").on(table.guildId, table.day)],
);
