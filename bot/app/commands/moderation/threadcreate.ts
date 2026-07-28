import { PermissionFlagsBits } from "discord.js";
import { cmd } from "../../../../index.ts";
import embeds from "../../../shared/config/embeds.ts";

export default cmd({
  name: "thread create",
  description: "Create a thread from your command message.",
  type: "message",
  context: "guild",
  permissions: [PermissionFlagsBits.CreatePublicThreads],
  syntax: "thread create <name>",
  example: "thread create Support discussion",
  args: { name: { type: "string", required: true } },
  run: async (ctx) => {
    const thread = await ctx.server.threads.create(
      ctx.message!,
      ctx.string("name")!,
    );
    return ctx.send(thread, embeds.success(`Created ${thread}.`));
  },
});
