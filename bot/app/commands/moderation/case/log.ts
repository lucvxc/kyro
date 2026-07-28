import { PermissionFlagsBits } from "discord.js";
import { cmd, UserError } from "../../../../../index.ts";
import { db } from "../../../../db/database.ts";
import { guilds } from "../../../../db/schema.ts";
import embeds from "../../../../shared/config/embeds.ts";

export default cmd({
  name: "case log",
  description: "Set the moderation case log channel.",
  syntax: "case log <channel>",
  example: "case log #mod-logs",
  type: "message",
  context: "guild",
  permissions: [PermissionFlagsBits.ManageGuild],
  args: { channel: { type: "channel", required: true } },
  run: async (ctx) => {
    const channel = ctx.channel("channel")!;
    if (!channel.isTextBased() || channel.isDMBased())
      throw new UserError("Choose a server text channel.");
    await db
      .insert(guilds)
      .values({ id: ctx.guild!.id, caseLogChannelId: channel.id })
      .onConflictDoUpdate({
        target: guilds.id,
        set: { caseLogChannelId: channel.id, updatedAt: new Date() },
      });
    return ctx.reply(
      embeds.success(`Moderation cases will be logged in ${channel}.`),
    );
  },
});
