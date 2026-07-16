import { PermissionFlagsBits } from "discord.js";
import { cmd } from "../../../index.ts";
import embeds from "../../utils/config/embeds.ts";

export default cmd({
  name: "clean files", description: "Delete recent messages containing files.", type: "message", context: "guild",
  permissions: [PermissionFlagsBits.ManageMessages], syntax: "clean files (amount)", example: "clean files 50",
  args: { amount: { type: "number", default: 100 } },
  run: async ctx => {
    const channel = ctx.guild!.channels.cache.get(ctx.input.channelId)!;
    const count = await ctx.server.channels.clean(channel, "files", ctx.number("amount")!);
    return ctx.reply(embeds.success(`Deleted **${count}** file message${count === 1 ? "" : "s"}.`));
  },
});
