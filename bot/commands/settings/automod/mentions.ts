import {
  AutoModerationActionType,
  AutoModerationRuleEventType,
  AutoModerationRuleTriggerType,
  PermissionFlagsBits,
} from "discord.js";
import { cmd, UserError } from "../../../../index.ts";
import { ruleNames } from "../../../services/settings/automod.ts";
import embeds from "../../../utils/config/embeds.ts";

export default cmd({
  name: "automod mentions",
  description: "Set the maximum mentions allowed in one message.",
  syntax: "automod mentions <limit>",
  example: "automod mentions 5",
  type: "message",
  context: "guild",
  permissions: [PermissionFlagsBits.ManageGuild],
  args: {
    limit: {
      type: "number",
      required: true,
      description: "1 to 50 mentions, or 0 to disable",
    },
  },
  run: async (ctx) => {
    const limit = ctx.number("limit")!;
    if (!Number.isInteger(limit) || limit < 0 || limit > 50)
      throw new UserError("Use a mention limit from 0 to 50.");
    const rules = await ctx.guild!.autoModerationRules.fetch();
    const existing = rules.find((rule) => rule.name === ruleNames.mentions);
    if (limit === 0) {
      if (existing) await existing.delete("Mention filter disabled");
      return ctx.reply(embeds.success("Mention spam filtering is disabled."));
    }
    const data = {
      triggerMetadata: {
        mentionTotalLimit: limit,
        mentionRaidProtectionEnabled: true,
      },
    };
    if (existing) await existing.edit(data);
    else
      await ctx.guild!.autoModerationRules.create({
        name: ruleNames.mentions,
        eventType: AutoModerationRuleEventType.MessageSend,
        triggerType: AutoModerationRuleTriggerType.MentionSpam,
        ...data,
        actions: [{ type: AutoModerationActionType.BlockMessage }],
        enabled: true,
        reason: "Configured through June automod",
      });
    return ctx.reply(
      embeds.success(`Messages are limited to **${limit}** mentions.`),
    );
  },
});
