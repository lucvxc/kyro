import { PermissionFlagsBits } from "discord.js";
import { eq } from "drizzle-orm";
import { cmd, UserError } from "../../../../../index.ts";
import { db } from "../../../../db/database.ts";
import { confessionEntries } from "../../../../db/schema.ts";
import embeds from "../../../../shared/config/embeds.ts";

export default cmd({
  name: "confession reveal",
  aliases: ["conf reveal"],
  description: "Reveal who sent a confession to moderators.",
  syntax: "confession reveal <id>",
  example: "confession reveal 5",
  type: "message",
  context: "guild",
  permissions: [PermissionFlagsBits.ManageGuild],
  args: {
    id: { type: "number", required: true, description: "Confession ID" },
  },
  run: async (ctx) => {
    const id = ctx.number("id")!;
    const [entry] = await db
      .select()
      .from(confessionEntries)
      .where(eq(confessionEntries.id, id))
      .limit(1);
    if (!entry || entry.guildId !== ctx.guild!.id)
      throw new UserError("That confession does not exist in this server.");
    return ctx.reply(
      embeds.default(
        `Confession **#${entry.id}** was sent by <@${entry.userId}> (\`${entry.userId}\`).`,
      ),
    );
  },
});
