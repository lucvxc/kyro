import {
  AutoModerationActionType,
  AutoModerationRuleEventType,
  AutoModerationRuleTriggerType,
  PermissionFlagsBits,
} from "discord.js";
import { cmd } from "../../../../index.ts";
import { ruleNames } from "../../../services/settings/automod.ts";
import embeds from "../../../utils/config/embeds.ts";

export default cmd({
  name: "automod spam",
  description: "Toggle Discord's built-in spam filter.",
  syntax: "automod spam",
  example: "automod spam",
  type: "message",
  context: "guild",
  permissions: [PermissionFlagsBits.ManageGuild],
  run: async (ctx) => {
    const rules = await ctx.guild!.autoModerationRules.fetch();
    const existing = rules.find((rule) => rule.name === ruleNames.spam);
    if (existing) {
      await existing.delete("Spam filter toggled off");
      return ctx.reply(embeds.success("AutoMod spam filtering is disabled."));
    }
    await ctx.guild!.autoModerationRules.create({
      name: ruleNames.spam,
      eventType: AutoModerationRuleEventType.MessageSend,
      triggerType: AutoModerationRuleTriggerType.Spam,
      actions: [{ type: AutoModerationActionType.BlockMessage }],
      enabled: true,
      reason: "Configured through June automod",
    });
    return ctx.reply(embeds.success("AutoMod spam filtering is enabled."));
  },
});
