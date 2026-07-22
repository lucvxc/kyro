import { PermissionFlagsBits } from "discord.js";
import { cmd } from "../../../index.ts";
import embeds from "../../utils/config/embeds.ts";

export default cmd({
  name: "thread name",
  aliases: ["thread rename"],
  description: "Rename the current thread.",
  type: "message",
  context: "guild",
  permissions: [PermissionFlagsBits.ManageThreads],
  syntax: "thread name <name>",
  example: "thread name Resolved report",
  args: { name: { type: "string", required: true } },
  run: async (ctx) => {
    const name = ctx.string("name")!;
    await ctx.server.threads.name(ctx.thread, name);
    return ctx.reply(embeds.success(`Renamed this thread to **${name}**.`));
  },
});
