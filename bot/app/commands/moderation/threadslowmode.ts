import { PermissionFlagsBits } from "discord.js";
import { cmd } from "../../../../index.ts";
import embeds from "../../../shared/config/embeds.ts";

export default cmd({
  name: "thread slowmode",
  description: "Set the current thread's slowmode.",
  type: "message",
  context: "guild",
  permissions: [PermissionFlagsBits.ManageThreads],
  syntax: "thread slowmode <seconds>",
  example: "thread slowmode 10",
  args: { seconds: { type: "number", required: true } },
  run: async (ctx) => {
    const seconds = ctx.number("seconds")!;
    await ctx.server.threads.slowmode(ctx.thread, seconds);
    return ctx.reply(
      embeds.success(
        seconds
          ? `Set thread slowmode to **${seconds} seconds**.`
          : "Disabled thread slowmode.",
      ),
    );
  },
});
