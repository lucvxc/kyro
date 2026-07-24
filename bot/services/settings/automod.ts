import {
  AutoModerationActionType,
  AutoModerationRuleEventType,
  AutoModerationRuleTriggerType,
  type Guild,
} from "discord.js";

export const ruleNames = {
  keywords: "June keyword filter",
  spam: "June spam filter",
  mentions: "June mention spam",
};

export async function keywordRule(guild: Guild) {
  const rules = await guild.autoModerationRules.fetch();
  return rules.find((rule) => rule.name === ruleNames.keywords);
}

export async function saveKeywords(guild: Guild, keywords: string[]) {
  const existing = await keywordRule(guild);
  if (existing)
    return existing.edit({ triggerMetadata: { keywordFilter: keywords } });
  return guild.autoModerationRules.create({
    name: ruleNames.keywords,
    eventType: AutoModerationRuleEventType.MessageSend,
    triggerType: AutoModerationRuleTriggerType.Keyword,
    triggerMetadata: { keywordFilter: keywords },
    actions: [{ type: AutoModerationActionType.BlockMessage }],
    enabled: true,
    reason: "Configured through June automod",
  });
}
