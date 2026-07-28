import { PermissionFlagsBits } from "discord.js";
import { cmd } from "../../../../../index.ts";
import { updateConfessions } from "../../../../features/settings/confessions.ts";
import embeds from "../../../../shared/config/embeds.ts";

export default cmd({
  name: "confession block",
  aliases: ["conf block"],
  description: "Block a member from sending confessions.",
  syntax: "confession block <member>",
  example: "confession block @user",
  type: "message",
  context: "guild",
  permissions: [PermissionFlagsBits.ManageGuild],
  args: {
    member: { type: "user", required: true, description: "Member to block" },
  },
  run: async (ctx) => {
    const member = ctx.user("member")!;
    await updateConfessions(ctx.guild!.id, (value) => ({
      ...value,
      blockedUserIds: [
        ...new Set([...(value.blockedUserIds ?? []), member.id]),
      ],
    }));
    return ctx.reply(
      embeds.success(`Blocked **${member.tag}** from confessions.`),
    );
  },
});
