import { eq, inArray } from "drizzle-orm";
import { evt } from "../../../index.ts";
import { db } from "../../db/database.ts";
import { users } from "../../db/schema.ts";
import { justSetAfk } from "../../features/afk/index.ts";
import embeds from "../../shared/config/embeds.ts";

export default evt({
  name: "messageCreate",
  run: async (message) => {
    if (!message.guild || message.author.bot) return;
    const ids = [
      ...new Set([message.author.id, ...message.mentions.users.keys()]),
    ];
    const rows = await db
      .select({ id: users.id, reason: users.afkReason, since: users.afkSince })
      .from(users)
      .where(inArray(users.id, ids));
    const self =
      !justSetAfk(message.author.id) &&
      rows.find((row) => row.id === message.author.id && row.reason);
    if (self) {
      await db
        .update(users)
        .set({ afkReason: null, afkSince: null })
        .where(eq(users.id, message.author.id));
      await message.reply({
        embeds: [
          embeds
            .default(
              `Welcome back. You were AFK ${self.since ? `<t:${Math.floor(self.since.getTime() / 1_000)}:R>` : "for a while"}.`,
            )
            .toJSON(),
        ],
        allowedMentions: { parse: [] },
      });
    }
    const mentioned = rows.filter(
      (row) => row.id !== message.author.id && row.reason,
    );
    if (mentioned.length)
      await message.reply({
        embeds: [
          embeds
            .default(
              mentioned
                .map(
                  (row) =>
                    `<@${row.id}> is AFK${row.since ? ` since <t:${Math.floor(row.since.getTime() / 1_000)}:R>` : ""}.\n> ${row.reason}`,
                )
                .join("\n\n"),
            )
            .toJSON(),
        ],
        allowedMentions: { parse: [] },
      });
  },
});
