import { MessageFlags } from "discord.js";
import { cmd } from "../../../../index.ts";
import { voiceMasterChannel } from "../../../services/voicemaster.ts";
import { voiceMasterPanel } from "../../../services/voicemasterpanel.ts";

export default cmd({
  name: "voicemaster panel",
  aliases: ["vm panel"],
  description: "Open a control panel for your VoiceMaster channel.",
  type: "message",
  context: "guild",
  run: async (ctx) => {
    const member = await ctx.guild!.members.fetch(ctx.author.id);
    const { record } = await voiceMasterChannel(member);
    if (record.ownerId !== ctx.author.id)
      return ctx.reply("You do not own this voice channel.");
    const panel = voiceMasterPanel(
      "container",
      ctx.guild!.iconURL({ size: 256, extension: "png" }),
    );
    await ctx.message!.reply({ ...panel, flags: MessageFlags.IsComponentsV2 });
  },
});
