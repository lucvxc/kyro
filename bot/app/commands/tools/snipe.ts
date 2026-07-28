import { cmd, embed, UserError } from "../../../../index.ts";
import { deletedAt } from "../../../features/snipe/store.ts";
import { colors } from "../../../shared/config/constants.ts";

export default cmd({
  name: "snipe",
  description: "Show a recently deleted message.",
  syntax: "snipe (index)",
  example: "snipe 2",
  type: "message",
  context: "guild",
  args: { index: { type: "number", default: 1 } },
  run: async (ctx) => {
    const index = Math.max(1, ctx.number("index")!);
    const item = deletedAt(ctx.input.channelId, index - 1);
    if (!item)
      throw new UserError("There is no deleted message at that position.");
    const user = ctx.client.users.cache.get(item.authorId);
    return ctx.reply(
      embed({
        color: colors.default,
        author: { name: user?.tag ?? "Deleted message", icon: item.avatar },
        description: item.content || "No text content",
        image: item.files[0],
        footer: `Deleted message · ${index} of 10`,
        timestamp: item.at,
      }),
    );
  },
});
