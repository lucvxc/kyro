import { eq } from "drizzle-orm";
import { cmd, UserError } from "../../../../index.ts";
import { db } from "../../../db/database.ts";
import { voiceChannels } from "../../../db/schema.ts";
import { voiceMasterChannel } from "../../../services/voicemaster.ts";
import embeds from "../../../utils/config/embeds.ts";

export default cmd({
  name: "voicemaster claim",
  aliases: ["vm claim"],
  description: "Claim a VoiceMaster channel after its owner leaves.",
  type: "message",
  context: "guild",
  run: async (ctx) => {
    const member = await ctx.guild!.members.fetch(ctx.author.id);
    const { channel, record } = await voiceMasterChannel(member);
    if (channel.members.has(record.ownerId))
      throw new UserError("The owner is still in the channel.");
    await channel.permissionOverwrites
      .delete(record.ownerId)
      .catch(() => undefined);
    await channel.permissionOverwrites.edit(member.id, {
      ManageChannels: true,
      Connect: true,
      Speak: true,
      Stream: true,
      MoveMembers: true,
    });
    await db
      .update(voiceChannels)
      .set({ ownerId: member.id })
      .where(eq(voiceChannels.channelId, channel.id));
    return ctx.reply(embeds.success("You now own this voice channel."));
  },
});
