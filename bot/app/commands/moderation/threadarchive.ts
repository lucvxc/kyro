import { PermissionFlagsBits } from "discord.js";
import { cmd } from "../../../../index.ts";
import embeds from "../../../shared/config/embeds.ts";

export default cmd({
  name: "thread archive",
  description: "Archive the current thread.",
  type: "message",
  context: "guild",
  permissions: [PermissionFlagsBits.ManageThreads],
  syntax: "thread archive (reason)",
  example: "thread archive Resolved",
  args: { reason: { type: "string" } },
  run: async (ctx) => {
    const thread = ctx.thread;
    await ctx.reply(embeds.success("Archiving this thread."));
    await ctx.server.threads.archive(
      thread,
      true,
      ctx.string("reason") ?? undefined,
    );
  },
});
