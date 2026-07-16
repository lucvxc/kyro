import { ActivityType, GatewayIntentBits, Partials } from "discord.js";
import { Kyro, drizzle, jsk, nodelink } from "../index.ts";
import * as schema from "./db/schema.ts";
import embeds from "./utils/config/embeds.ts";
import { fakePerms } from "./utils/fakepermissions.ts";

const database = drizzle(process.env.POSTGRES!, { schema });
fakePerms.use(database.db);

const bot = new Kyro({
  client: {
    token: process.env.TOKEN!,
    appID: process.env.ID!,
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.DirectMessages,
      GatewayIntentBits.GuildVoiceStates,
    ],
    partials: [Partials.Channel],
    presence: {
      status: "vr",
      activities: [
        {
          name: "🔗 june.rocks/discord",
          type: ActivityType.Custom,
        },
      ],
    },
  },
  config: {
    ownerIDs: ["295998232989925376"],
    commands: "./bot/commands",
    events: "./bot/events",
    components: "./bot/components",
    plugins: [
      jsk,
      nodelink({
        nodes: [{
          host: process.env.HOST!,
          password: process.env.PASSWORD!,
        }],
      }),
    ],
    cooldown: 3,
    prefix: "$",
    help: false,
  },
  replies: embeds,
  permissions: fakePerms.check,
  database,
});

await bot.start();
