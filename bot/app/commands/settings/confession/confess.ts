import { cmd, container, UserError } from "../../../../../index.ts";
import { db } from "../../../../db/database.ts";
import { confessionEntries } from "../../../../db/schema.ts";
import { confessionSettings } from "../../../../features/settings/confessions.ts";
import { colors } from "../../../../shared/config/constants.ts";
import embeds from "../../../../shared/config/embeds.ts";

export default cmd({
  name: "confess",
  description: "Send an anonymous confession.",
  syntax: "confess <message>",
  example: "confess message",
  type: "message",
  context: "guild",
  args: {
    message: {
      type: "string",
      required: true,
      description: "Your anonymous confession",
    },
  },
  run: async (ctx) => {
    const settings = await confessionSettings(ctx.guild!.id);
    if (!settings.enabled || !settings.channelId)
      throw new UserError("Confessions are not enabled here.");
    if (settings.blockedUserIds?.includes(ctx.author.id))
      throw new UserError("You are blocked from sending confessions here.");
    const channel = ctx.guild!.channels.cache.get(settings.channelId);
    if (!channel?.isSendable())
      throw new UserError("The confession channel is unavailable.");
    const content = ctx.string("message")!;
    const [entry] = await db
      .insert(confessionEntries)
      .values({ guildId: ctx.guild!.id, userId: ctx.author.id, content })
      .returning();
    if (!entry) throw new UserError("I could not save that confession.");
    const sent = await channel.send({
      components: [
        container()
          .accent(colors.default)
          .text(`## Anonymous confession #${entry.id}\n${content}`)
          .toJSON(),
      ],
      flags: 32768,
      allowedMentions: { parse: [] },
    });
    await db
      .update(confessionEntries)
      .set({ messageId: sent.id })
      .where((await import("drizzle-orm")).eq(confessionEntries.id, entry.id));
    return ctx.reply(embeds.success(`Sent confession **#${entry.id}**.`));
  },
});
