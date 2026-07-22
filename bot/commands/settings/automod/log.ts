import { PermissionFlagsBits } from "discord.js";
import { cmd, UserError } from "../../../../index.ts";
import { db } from "../../../db/database.ts";
import { guilds } from "../../../db/schema.ts";
import embeds from "../../../utils/config/embeds.ts";

export default cmd({
  name: "automod log",
  description: "Set the channel used by new AutoMod timeout actions.",
  type: "message",
  context: "guild",
  permissions: [PermissionFlagsBits.ManageGuild],
  args: {
    channel: {
      type: "channel",
      required: true,
      description: "AutoMod log channel",
    },
  },
  run: async (ctx) => {
    const channel = ctx.channel("channel")!;
    if (!channel.isTextBased()) throw new UserError("Choose a text channel.");
    await db
      .insert(guilds)
      .values({ id: ctx.guild!.id, automodLog: channel.id })
      .onConflictDoUpdate({
        target: guilds.id,
        set: { automodLog: channel.id, updatedAt: new Date() },
      });
    return ctx.reply(embeds.success(`AutoMod logs will use ${channel}.`));
  },
});
