import { PermissionFlagsBits } from "discord.js";
import { cmd, UserError } from "../../../../index.ts";
import { keywordRule, saveKeywords } from "../../../services/settings/automod.ts";
import embeds from "../../../utils/config/embeds.ts";

export default cmd({
  name: "automod keyword add",
  description: "Add a blocked keyword or phrase.",
  syntax: "automod keyword add <keyword>",
  example: "automod keyword add keyword",
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
    const current =
      (await keywordRule(ctx.guild!))?.triggerMetadata.keywordFilter ?? [];
    if (current.includes(keyword))
      throw new UserError("That keyword is already blocked.");
    await saveKeywords(ctx.guild!, [...current, keyword]);
    return ctx.reply(embeds.success(`Blocked **${keyword}**.`));
  },
});
