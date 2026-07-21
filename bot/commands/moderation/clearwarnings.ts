import { PermissionFlagsBits } from "discord.js";
import { cmd } from "../../../index.ts";
import embeds from "../../utils/config/embeds.ts";
import { clearWarnings } from "../../services/moderation/warnings.ts";

export default cmd({
  name: "clearwarnings", aliases: ["clearwarns"], description: "Clear every warning from a member.", type: "message", context: "guild",
  permissions: [PermissionFlagsBits.ModerateMembers], syntax: "clearwarnings <user>", example: "clearwarnings @user",
  args: { user: { type: "user", required: true } },
  run: async ctx => {
    const user = ctx.user("user")!;
    const count = await clearWarnings(ctx.guild!.id, user.id);
    return ctx.reply(embeds.success(`Cleared **${count}** warning${count === 1 ? "" : "s"} from **${user.tag}**.`));
  },
});
