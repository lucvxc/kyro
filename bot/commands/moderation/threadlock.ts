import { PermissionFlagsBits } from "discord.js";
import { cmd } from "../../../index.ts";
import embeds from "../../utils/config/embeds.ts";

export default cmd({
  name: "thread lock", description: "Lock the current thread.", type: "message", context: "guild",
  permissions: [PermissionFlagsBits.ManageThreads], syntax: "thread lock (reason)", example: "thread lock",
  args: { reason: { type: "string" } },
  run: async ctx => {
    await ctx.server.threads.lock(ctx.thread, true, ctx.string("reason") ?? undefined);
    return ctx.reply(embeds.success("Locked this thread."));
  },
});
