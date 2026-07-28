import { ActivityType, GatewayIntentBits, Partials } from "discord.js";
import { Kyro, jsk, nodelink } from "../index.ts";
import { database } from "./db/database.ts";
import {
  blockDisabledCommands,
  getGuildAlias,
} from "./features/settings/commands.ts";
import { getPrefix } from "./features/settings/prefix.ts";
import { trackCommand } from "./features/stats/tracker.ts";
import { trackCases } from "./features/moderation/cases.ts";
import embeds from "./shared/config/embeds.ts";
import { startApi } from "./api/index.ts";

const bot = new Kyro({
  token: process.env.TOKEN!,
  appID: process.env.CLIENTID!,
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildModeration,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildInvites,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.GuildVoiceStates,
  ],
  partials: [
    Partials.Channel,
    Partials.Message,
    Partials.Reaction,
    Partials.User,
  ],
  presence: {
    status: "vr",
    activities: [
      {
        name: "🔗 june.rocks/discord",
        type: ActivityType.Custom,
      },
    ],
  },
  ownerIDs: [process.env.OWNERID!],
  commands: "./bot/app/commands",
  events: "./bot/app/events",
  components: "./bot/app/components",
  plugins: [
    jsk,
    nodelink({
      nodes: [
        {
          host: process.env.HOST!,
          password: process.env.PASSWORD!,
        },
      ],
    }),
  ],
  cooldown: 3,
  prefix: getPrefix,
  getAlias: getGuildAlias,
  middleware: [blockDisabledCommands, trackCommand, trackCases],
  replies: embeds,
  database,
});

await bot.start();
startApi(bot.client);
