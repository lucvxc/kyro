import { cmd } from "../../../../../index.ts";
import { prefixFor } from "../../../../features/settings/prefix.ts";
import embeds from "../../../../shared/config/embeds.ts";

export default cmd({
  name: "prefix view",
  aliases: ["pfx view"],
  description: "View this server's command prefix.",
  type: "message",
  context: "guild",
  syntax: "prefix view",
  example: "prefix view",
  run: async (ctx) => {
    const prefix = await prefixFor(ctx.guild!.id);
    return ctx.reply(embeds.info(`This server's prefix is **${prefix}**.`));
  },
});
