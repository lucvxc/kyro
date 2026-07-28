import { cmd, container } from "../../../../../index.ts";
import { findTimezones } from "../../../../features/timezone/index.ts";
import { colors } from "../../../../shared/config/constants.ts";

export default cmd({
  name: "timezone list",
  aliases: ["tz list", "timezone search", "tz search"],
  description: "Search available timezones.",
  syntax: "timezone list <city>",
  example: "timezone list Los Angeles",
  type: "message",
  context: "both",
  args: { query: { type: "string", required: true } },
  run: async (ctx) => {
    const zones = findTimezones(ctx.string("query")!);
    return ctx.reply(
      container()
        .accent(colors.default)
        .text(
          `## Timezones\n${zones.map((zone) => `\`${zone}\``).join("\n") || "No matching timezones."}`,
        ),
    );
  },
});
