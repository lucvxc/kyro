import { PermissionFlagsBits } from "discord.js";
import { cmd } from "../../../../index.ts";
import { updateConfessions } from "../../../services/settings/confessions.ts";
import embeds from "../../../utils/config/embeds.ts";

export default cmd({
  name: "confession unblock",
  description: "Allow a member to send confessions again.",
  syntax: "confession unblock <member>",
  example: "confession unblock @user",
  type: "message",
  context: "guild",
  permissions: [PermissionFlagsBits.ManageGuild],
  args: {
    member: { type: "user", required: true, description: "Member to unblock" },
  },
  run: async (ctx) => {
    const member = ctx.user("member")!;
    await updateConfessions(ctx.guild!.id, (value) => ({
      ...value,
      blockedUserIds: value.blockedUserIds?.filter(
        (userId) => userId !== member.id,
      ),
    }));
    return ctx.reply(embeds.success(`Unblocked **${member.tag}**.`));
  },
});
