import {
  button,
  cmd,
  container,
  messageOptions,
  UserError,
} from "../../../../index.ts";
import { chart } from "../../../features/lastfm/chart.ts";
import {
  period,
  periodLabel,
  getLastfmUser,
} from "../../../features/lastfm/view.ts";

export default cmd({
  name: "lastfm chart",
  aliases: ["fm chart", "fm collage", "lf chart", "lf collage", "fm c", "lf c"],
  description: "Generate an album chart from your Last.fm history.",
  syntax: "lastfm chart (2-5) (week/month/year/all)",
  example: "fm chart 4 month",
  type: "message",
  run: async (ctx) => {
    const linked = await getLastfmUser(ctx.author);
    const sizeArg = ctx.raw.find((value) => /^\d$/.test(value));
    const size = Number(sizeArg ?? 3);
    if (size < 2 || size > 5)
      throw new UserError("Chart size must be between 2 and 5.");
    const time = ctx.raw.find((value) => !/^\d$/.test(value));
    const range = period(time);
    const file = await chart(linked.name, size, range);
    const view = container()
      .accent(0xd51007)
      .text(
        `## album chart\n-# ${linked.name}  ·  ${periodLabel(range)}  ·  ${size}×${size}`,
      )
      .separator()
      .gallery("attachment://chart.png")
      .row(
        button({
          label: "View on Last.fm",
          style: "link",
          url: `https://www.last.fm/user/${encodeURIComponent(linked.name)}/library/albums?date_preset=${range}`,
        }),
      );
    await ctx.message!.reply({
      ...(messageOptions(view) as object),
      files: [{ attachment: file, name: "chart.png" }],
    });
  },
});
