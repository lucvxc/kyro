import { PermissionFlagsBits } from "discord.js";
import { eq } from "drizzle-orm";
import { cmp, container, modal, select, UserError } from "../../../index.ts";
import { db } from "../../db/database.ts";
import { voiceChannels } from "../../db/schema.ts";
import { voiceMasterChannel } from "../../features/voicemaster/channel.ts";
import { colors } from "../../shared/config/constants.ts";
import embeds from "../../shared/config/embeds.ts";

export default cmp({
  id: /^vm_(?:dropdown|lock|unlock|hide|unhide|info|claim|rename|limit|bitrate|disconnect|disconnect_select|rename_modal:\d+|limit_modal:\d+|bitrate_modal:\d+)$/,
  context: "guild",
  run: async (ctx) => {
    const member = await ctx.guild!.members.fetch(ctx.user.id);
    if (!member.voice.channel) {
      return ctx.private(
        embeds.warning("Make sure you join a voice channel first."),
      );
    }
    const { channel, record } = await voiceMasterChannel(member);
    const selected = ctx.id === "vm_dropdown" ? ctx.values[0] : ctx.id;
    const action = selected?.replace(/^vm_/, "");

    if (action === "info") {
      const everyone = channel.permissionOverwrites.cache.get(
        ctx.guild!.roles.everyone.id,
      );
      return ctx.private(
        container()
          .accent(colors.default)
          .text(
            `## ${channel.name}\n-# Owner <@${record.ownerId}> · ${channel.members.size} members\n**Limit** ${channel.userLimit || "None"} · **Bitrate** ${channel.bitrate / 1_000}kbps\n**Locked** ${everyone?.deny.has(PermissionFlagsBits.Connect) ? "Yes" : "No"} · **Hidden** ${everyone?.deny.has(PermissionFlagsBits.ViewChannel) ? "Yes" : "No"}`,
          ),
      );
    }

    if (action === "claim") {
      if (channel.members.has(record.ownerId)) {
        throw new UserError("The owner is still in the channel.");
      }
      await channel.permissionOverwrites
        .delete(record.ownerId)
        .catch(() => undefined);
      await channel.permissionOverwrites.edit(ctx.user.id, ownerPermissions);
      await db
        .update(voiceChannels)
        .set({ ownerId: ctx.user.id })
        .where(eq(voiceChannels.channelId, channel.id));
      return ctx.private("You now own this voice channel.");
    }

    if (record.ownerId !== ctx.user.id) {
      throw new UserError("You do not own this voice channel.");
    }

    if (action === "lock" || action === "unlock") {
      await channel.permissionOverwrites.edit(ctx.guild!.roles.everyone, {
        Connect: action === "lock" ? false : null,
      });
      return ctx.private(
        `Your voice channel is ${action === "lock" ? "locked" : "unlocked"}.`,
      );
    }
    if (action === "hide" || action === "unhide") {
      await channel.permissionOverwrites.edit(ctx.guild!.roles.everyone, {
        ViewChannel: action === "hide" ? false : null,
      });
      return ctx.private(
        `Your voice channel is ${action === "hide" ? "hidden" : "visible"}.`,
      );
    }
    if (action === "rename") {
      return ctx.showModal(
        modal({
          id: `vm_rename_modal:${ctx.user.id}`,
          title: "Rename Voice Channel",
          inputs: [{ id: "name", label: "Channel name", max: 100 }],
        }),
      );
    }
    if (action === "limit") {
      return ctx.showModal(
        modal({
          id: `vm_limit_modal:${ctx.user.id}`,
          title: "Set User Limit",
          inputs: [
            {
              id: "limit",
              label: "User limit",
              description: "Use 0 for no limit",
              max: 2,
            },
          ],
        }),
      );
    }
    if (action === "bitrate") {
      return ctx.showModal(
        modal({
          id: `vm_bitrate_modal:${ctx.user.id}`,
          title: "Set Bitrate",
          inputs: [
            {
              id: "bitrate",
              label: "Bitrate in kbps",
              description: "Between 8 and the server maximum",
              max: 3,
            },
          ],
        }),
      );
    }

    if (action?.startsWith("rename_modal:")) {
      const name = ctx.field("name")?.trim();
      if (!name) throw new UserError("Enter a channel name.");
      await channel.setName(name);
      return ctx.private(`Renamed your channel to **${channel.name}**.`);
    }
    if (action?.startsWith("limit_modal:")) {
      const limit = Number(ctx.field("limit"));
      if (!Number.isInteger(limit) || limit < 0 || limit > 99) {
        throw new UserError("The limit must be from 0 to 99.");
      }
      await channel.setUserLimit(limit);
      return ctx.private(
        limit ? `Channel limit set to **${limit}**.` : "Channel limit removed.",
      );
    }
    if (action?.startsWith("bitrate_modal:")) {
      const bitrate = Number(ctx.field("bitrate"));
      const maximum = Math.floor(ctx.guild!.maximumBitrate / 1_000);
      if (!Number.isInteger(bitrate) || bitrate < 8 || bitrate > maximum) {
        throw new UserError(`Bitrate must be from 8 to ${maximum}kbps.`);
      }
      await channel.setBitrate(bitrate * 1_000);
      return ctx.private(`Channel bitrate set to **${bitrate}kbps**.`);
    }

    if (action === "disconnect") {
      const members = [...channel.members.values()].filter(
        (value) => value.id !== record.ownerId,
      );
      if (!members.length) {
        throw new UserError("There is nobody else to disconnect.");
      }
      if (members.length === 1) {
        await members[0]!.voice.disconnect("Disconnected by VoiceMaster owner");
        return ctx.private(`Disconnected **${members[0]!.displayName}**.`);
      }
      return ctx.private(
        container()
          .accent(colors.default)
          .text("## Disconnect a member")
          .row(
            select({
              id: "vm_disconnect_select",
              placeholder: "Choose a member...",
              options: members.slice(0, 25).map((value) => ({
                label: value.displayName,
                value: value.id,
              })),
            }),
          ),
      );
    }
    if (action === "disconnect_select") {
      const target = channel.members.get(ctx.values[0] ?? "");
      if (!target || target.id === record.ownerId) {
        throw new UserError("That member is no longer available.");
      }
      await target.voice.disconnect("Disconnected by VoiceMaster owner");
      return ctx.private(`Disconnected **${target.displayName}**.`);
    }
  },
});

const ownerPermissions = {
  ManageChannels: true,
  Connect: true,
  Speak: true,
  Stream: true,
  MoveMembers: true,
};
