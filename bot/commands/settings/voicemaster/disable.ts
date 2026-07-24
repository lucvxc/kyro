import { PermissionFlagsBits } from "discord.js";
import { eq } from "drizzle-orm";
import { cmd, UserError } from "../../../../index.ts";
import { db } from "../../../db/database.ts";
import { voiceChannels } from "../../../db/schema.ts";
import {
  updateVoiceMaster,
  voiceMasterSettings,
} from "../../../services/settings/voicemaster.ts";
import embeds from "../../../utils/config/embeds.ts";

export default cmd({
  name: "voicemaster disable",
  aliases: ["vm disable", "voicemaster remove", "vm remove"],
  description: "Disable VoiceMaster and remove its channels.",
  syntax: "voicemaster disable",
  example: "voicemaster disable",
  type: "message",
  context: "guild",
  permissions: [
    PermissionFlagsBits.ManageGuild,
    PermissionFlagsBits.ManageChannels,
  ],
  run: async (ctx) => {
    const settings = await voiceMasterSettings(ctx.guild!.id);
    if (!settings.joinChannelId)
      throw new UserError("VoiceMaster is not set up.");
    const temporary = await db
      .select()
      .from(voiceChannels)
      .where(eq(voiceChannels.guildId, ctx.guild!.id));
    for (const entry of temporary)
      await ctx
        .guild!.channels.cache.get(entry.channelId)
        ?.delete("VoiceMaster disabled")
        .catch(() => undefined);
    await db
      .delete(voiceChannels)
      .where(eq(voiceChannels.guildId, ctx.guild!.id));
    await ctx
      .guild!.channels.cache.get(settings.joinChannelId)
      ?.delete("VoiceMaster disabled")
      .catch(() => undefined);
    await ctx
      .guild!.channels.cache.get(settings.interfaceChannelId ?? "")
      ?.delete("VoiceMaster disabled")
      .catch(() => undefined);
    await ctx
      .guild!.channels.cache.get(settings.categoryId ?? "")
      ?.delete("VoiceMaster disabled")
      .catch(() => undefined);
    await updateVoiceMaster(ctx.guild!.id, () => ({}));
    return ctx.reply(
      embeds.success("VoiceMaster is disabled and its channels were removed."),
    );
  },
});
