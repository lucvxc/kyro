import { ActivityType, GatewayIntentBits, Partials } from "discord.js";
import { Kyro, drizzle, jsk } from "../index.ts";
import * as schema from "./db/schema.ts";

const bot = new Kyro({
  client: {
    token: process.env.TOKEN!,
    appID: process.env.ID!,
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.DirectMessages,
    ],
    partials: [Partials.Channel],
    presence: {
      status: "online",
      activities: [
        {
          name: "with Kyro",
          type: ActivityType.Playing,
        },
      ],
    },
  },
  config: {
    commands: "./bot/commands",
    events: "./bot/events",
    components: "./bot/components",
    plugins: [jsk],
    cooldown: 3,
    prefix: "$",
    help: false,
  },
  database: drizzle(process.env.POSTGRES!, { schema }),
});

await bot.start();
