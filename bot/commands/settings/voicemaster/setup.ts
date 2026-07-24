import { ChannelType, PermissionFlagsBits } from "discord.js";
import { cmd, UserError } from "../../../../index.ts";
import {
  updateVoiceMaster,
  voiceMasterSettings,
} from "../../../services/settings/voicemaster.ts";
import {
  voiceMasterPanel,
  type VoiceMasterPanelType,
} from "../../../services/voicemaster/panel.ts";
import embeds from "../../../utils/config/embeds.ts";

const panelTypes = ["dropdown", "container", "embed"] as const;

export default cmd({
  name: "voicemaster setup",
  aliases: ["vm setup"],
  description: "Create VoiceMaster with an interactive control panel.",
  type: "message",
  context: "guild",
  permissions: [
    PermissionFlagsBits.ManageGuild,
    PermissionFlagsBits.ManageChannels,
  ],
  syntax: "voicemaster setup (dropdown/container/embed)",
  example: "voicemaster setup dropdown",
  args: {
    panel: {
      type: "string",
      description: "dropdown, container, or embed",
      default: "dropdown",
    },
  },
  run: async (ctx) => {
    const panelType = (
      ctx.string("panel") ?? "dropdown"
    ).toLowerCase() as VoiceMasterPanelType;
    if (!panelTypes.includes(panelType))
      throw new UserError("Choose `dropdown`, `container`, or `embed`.");
    const current = await voiceMasterSettings(ctx.guild!.id);
    if (current.joinChannelId)
      throw new UserError(
        "VoiceMaster is already set up. Disable it before creating a new setup.",
      );

    const category = await ctx.guild!.channels.create({
      name: "Voice Channels",
      type: ChannelType.GuildCategory,
      reason: `VoiceMaster setup by ${ctx.author.tag}`,
    });
    try {
      const join = await ctx.guild!.channels.create({
        name: "Join to Create",
        type: ChannelType.GuildVoice,
        parent: category.id,
        reason: `VoiceMaster setup by ${ctx.author.tag}`,
      });
      const interfaceChannel = await ctx.guild!.channels.create({
        name: "interface",
        type: ChannelType.GuildText,
        parent: category.id,
        permissionOverwrites: [
          {
            id: ctx.guild!.roles.everyone.id,
            allow: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.ReadMessageHistory,
            ],
            deny: [PermissionFlagsBits.SendMessages],
          },
          {
            id: ctx.client.user!.id,
            allow: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.SendMessages,
            ],
          },
        ],
        reason: `VoiceMaster setup by ${ctx.author.tag}`,
      });
      const panel = await interfaceChannel.send(
        voiceMasterPanel(
          panelType,
          ctx.guild!.iconURL({ size: 256, extension: "png" }),
        ),
      );
      await updateVoiceMaster(ctx.guild!.id, () => ({
        enabled: true,
        categoryId: category.id,
        joinChannelId: join.id,
        interfaceChannelId: interfaceChannel.id,
        panelMessageId: panel.id,
        panelType,
        defaultName: "{user}'s Channel",
        defaultLimit: 0,
      }));
      return ctx.reply(
        embeds.default(
          `**VoiceMaster ready**\nCategory **${category.name}**\nJoin to Create ${join}\nControls ${interfaceChannel}\nPanel **${panelType}**`,
        ),
      );
    } catch (error) {
      await category.delete("VoiceMaster setup failed").catch(() => undefined);
      throw error;
    }
  },
});
