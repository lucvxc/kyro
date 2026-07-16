import { PermissionFlagsBits } from "discord.js";
import { cmd } from "../../../index.ts";
import embeds from "../../utils/config/embeds.ts";

export default cmd({
  name: "thread delete", description: "Delete the current thread.", type: "message", context: "guild",
  permissions: [PermissionFlagsBits.ManageThreads], syntax: "thread delete (reason)", example: "thread delete Duplicate",
  args: { reason: { type: "string" } },
  run: async ctx => {
    await ctx.reply(embeds.success("Deleting this thread."));
    await ctx.server.channels.delete(ctx.thread, ctx.string("reason") ?? undefined);
  },
});
