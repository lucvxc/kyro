import { eq } from "drizzle-orm";
import { cmd, UserError } from "../../../../index.ts";
import { db } from "../../../db/database.ts";
import { voiceChannels } from "../../../db/schema.ts";
import { ownedVoiceChannel } from "../../../services/voicemaster.ts";
import embeds from "../../../utils/config/embeds.ts";

export default cmd({
  name: "voicemaster transfer",
  aliases: ["vm transfer"],
  description: "Transfer ownership of your VoiceMaster channel.",
  type: "message",
  context: "guild",
  args: { user: { type: "user", required: true, description: "New owner" } },
  run: async (ctx) => {
    const owner = await ctx.guild!.members.fetch(ctx.author.id);
    const target = await ctx.guild!.members.fetch(ctx.user("user")!.id);
    const channel = await ownedVoiceChannel(owner);
    if (!channel.members.has(target.id))
      throw new UserError("That member must be in your voice channel.");
    if (target.id === owner.id)
      throw new UserError("You already own this channel.");
    await channel.permissionOverwrites.delete(owner.id).catch(() => undefined);
    await channel.permissionOverwrites.edit(target.id, {
      ManageChannels: true,
      Connect: true,
      Speak: true,
      Stream: true,
      MoveMembers: true,
    });
    await db
      .update(voiceChannels)
      .set({ ownerId: target.id })
      .where(eq(voiceChannels.channelId, channel.id));
    return ctx.reply(
      embeds.success(`Transferred ownership to **${target.user.tag}**.`),
    );
  },
});
