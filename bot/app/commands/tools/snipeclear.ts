import { PermissionFlagsBits } from "discord.js";
import { cmd } from "../../../../index.ts";
import { clearSnipes } from "../../../features/snipe/store.ts";
import embeds from "../../../shared/config/embeds.ts";

export default cmd({
  name: "snipe clear",
  aliases: [
    "snipeclear",
    "clearsnipe",
    "clear snipe",
    "cs",
    "editsnipe clear",
    "editsnipeclear",
  ],
  description: "Clear deleted and edited message history in this channel.",
  syntax: "snipe clear",
  example: "snipe clear",
  type: "message",
  context: "guild",
  permissions: [PermissionFlagsBits.ManageMessages],
  run: async (ctx) => {
    clearSnipes(ctx.input.channelId);
    await ctx.reply(embeds.success("Cleared this channel's snipe history."));
  },
});
