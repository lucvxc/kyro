import { ActivityType, GatewayIntentBits, Partials } from "discord.js";
import { Kyro, jsk, nodelink } from "../index.ts";
import { database } from "./db/database.ts";
import {
  blockDisabledCommands,
  resolveGuildAlias,
} from "./services/settings/commands.ts";
import { getprefix } from "./services/settings/prefix.ts";
import embeds from "./utils/config/embeds.ts";

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
  commands: "./bot/commands",
  events: "./bot/events",
  components: "./bot/components",
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
  prefix: getprefix,
  resolveAlias: resolveGuildAlias,
  middleware: [blockDisabledCommands],
  replies: embeds,
  database,
});

await bot.start();
