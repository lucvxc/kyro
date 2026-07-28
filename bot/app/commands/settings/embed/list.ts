import { PermissionFlagsBits } from "discord.js";
import { cmd, container, select } from "../../../../../index.ts";
import { savedEmbeds } from "../../../../features/settings/embeds.ts";
import { colors } from "../../../../shared/config/constants.ts";
import embeds from "../../../../shared/config/embeds.ts";

export default cmd({
  name: "embed list",
  aliases: ["emb list"],
  description: "List and manage your saved embeds.",
  type: "message",
  context: "guild",
  permissions: [PermissionFlagsBits.ManageMessages],
  syntax: "embed list",
  example: "embed list",
  run: async (ctx) => {
    const saved = await savedEmbeds(ctx.author.id);
    if (!saved.length)
      return ctx.reply(
        embeds.warning(
          `You have no saved embeds. Use **${ctx.prefix}embed save** to create one.`,
        ),
      );

    return ctx.reply(
      container()
        .accent(colors.default)
        .text(`## Saved embeds (${saved.length}/15)`)
        .row(
          select({
            id: `embedmgr:${ctx.author.id}`,
            placeholder: "Choose an embed...",
            options: saved.map((embed) => ({
              label: embed.name.slice(0, 100),
              description: `Saved ${date(embed.createdAt)}`,
              value: embed.id,
            })),
          }),
        ),
    );
  },
});

function date(value: Date): string {
  return value.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
