import { PermissionFlagsBits } from "discord.js";
import { cmd } from "../../../index.ts";
import embeds from "../../utils/config/embeds.ts";

export default cmd({
  name: "nickname",
  aliases: ["nick"],
  description: "Set or reset a member's nickname.",
  type: "message",
  context: "guild",
  permissions: [PermissionFlagsBits.ManageNicknames],
  syntax: "nickname <user> (name)",
  example: "nickname @user New Name",
  args: { user: { type: "user", required: true }, name: { type: "string" } },
  run: async (ctx) => {
    const user = ctx.user("user")!;
    const name = ctx.string("name");
    await ctx.mod.nickname(user, name);
    return ctx.reply(
      embeds.success(
        name
          ? `Changed **${user.tag}**'s nickname to **${name}**.`
          : `Reset **${user.tag}**'s nickname.`,
      ),
    );
  },
});
