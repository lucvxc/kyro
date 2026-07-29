import { GatewayIntents } from "discordeno";
import { Kyro, cmd } from "../index.ts";

const token = process.env.DISCORD_TOKEN;
const appID = process.env.DISCORD_APP_ID;
if (!token || !appID) throw new Error("Set DISCORD_TOKEN and DISCORD_APP_ID.");

const bot = new Kyro({
  token,
  appID,
  intents: GatewayIntents.Guilds,
  sync: process.env.DISCORD_GUILD_ID ? "guild" : "global",
  guildID: process.env.DISCORD_GUILD_ID,
  hooks: {
    afterStart: (kyro) => console.info(`Kyro connected as ${kyro.client.id}.`),
  },
});

bot.command(
  cmd({
    name: "ping",
    description: "Check whether the bot is responding.",
    run: (ctx) => ctx.reply("Pong!"),
  }),
);

await bot.start();
