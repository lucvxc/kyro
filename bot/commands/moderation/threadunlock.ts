import { PermissionFlagsBits } from "discord.js";
import { cmd } from "../../../index.ts";
import embeds from "../../utils/config/embeds.ts";

export default cmd({
  name: "thread unlock", description: "Unlock the current thread.", type: "message", context: "guild",
  permissions: [PermissionFlagsBits.ManageThreads], syntax: "thread unlock (reason)", example: "thread unlock",
  args: { reason: { type: "string" } },
  run: async ctx => {
    await ctx.server.threads.lock(ctx.thread, false, ctx.string("reason") ?? undefined);
    return ctx.reply(embeds.success("Unlocked this thread."));
  },
});
