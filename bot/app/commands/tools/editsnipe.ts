import { cmd, embed, UserError } from "../../../../index.ts";
import { editedAt } from "../../../features/snipe/store.ts";
import { colors } from "../../../shared/config/constants.ts";

export default cmd({
  name: "editsnipe",
  aliases: ["esnipe"],
  description: "Show a recently edited message.",
  syntax: "editsnipe (index)",
  example: "editsnipe 2",
  type: "message",
  context: "guild",
  args: { index: { type: "number", default: 1 } },
  run: async (ctx) => {
    const index = Math.max(1, ctx.number("index")!);
    const item = editedAt(ctx.input.channelId, index - 1);
    if (!item)
      throw new UserError("There is no edited message at that position.");
    const user = ctx.client.users.cache.get(item.authorId);
    return ctx.reply(
      embed({
        color: colors.default,
        author: { name: user?.tag ?? "Edited message", icon: item.avatar },
        fields: [
          { name: "Before", value: item.before || "Empty" },
          { name: "After", value: item.after || "Empty" },
        ],
        footer: `Edited message · ${index} of 10`,
        timestamp: item.at,
      }),
    );
  },
});
