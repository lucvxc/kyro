import { PermissionFlagsBits } from "discord.js";
import { cmd, UserError } from "../../../../index.ts";
import { keywordRule, saveKeywords } from "../../../services/settings/automod.ts";
import embeds from "../../../utils/config/embeds.ts";

export default cmd({
  name: "automod keyword remove",
  description: "Remove a blocked keyword or phrase.",
  syntax: "automod keyword remove <keyword>",
  example: "automod keyword remove keyword",
  type: "message",
  context: "guild",
  permissions: [PermissionFlagsBits.ManageGuild],
  args: {
    keyword: {
      type: "string",
      required: true,
      description: "Keyword or phrase",
    },
  },
  run: async (ctx) => {
    const keyword = ctx.string("keyword")!.trim().toLowerCase();
    const rule = await keywordRule(ctx.guild!);
    const current = rule?.triggerMetadata.keywordFilter ?? [];
    if (!current.includes(keyword))
      throw new UserError("That keyword is not blocked.");
    const remaining = current.filter((value) => value !== keyword);
    if (remaining.length) await saveKeywords(ctx.guild!, remaining);
    else await rule!.delete("No blocked keywords remain");
    return ctx.reply(embeds.success(`Unblocked **${keyword}**.`));
  },
});
