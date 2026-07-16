import { PermissionFlagsBits } from "discord.js";
import { cmd } from "../../../index.ts";
import embeds from "../../utils/config/embeds.ts";

export default cmd({
  name: "thread unarchive", description: "Unarchive the current thread.", type: "message", context: "guild",
  permissions: [PermissionFlagsBits.ManageThreads], syntax: "thread unarchive (reason)", example: "thread unarchive",
  args: { reason: { type: "string" } },
  run: async ctx => {
    await ctx.server.threads.archive(ctx.thread, false, ctx.string("reason") ?? undefined);
    return ctx.reply(embeds.success("Unarchived this thread."));
  },
});
