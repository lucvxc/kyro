import { ThumbnailBuilder, type User } from "discord.js";
import { button, container, UserError } from "../../../index.ts";
import { account } from "./users.ts";
import type { Period } from "./client.ts";

export async function getLastfmUser(author: User, target?: User | null) {
  const user = target ?? author;
  const row = await account(user.id);
  return { discord: user, name: row!.lastfm!, account: row! };
}

export function period(value?: string | null): Period {
  const key = value?.toLowerCase();
  if (!key || key === "week" || key === "7day") return "7day";
  if (key === "month" || key === "1month") return "1month";
  if (key === "3month" || key === "quarter") return "3month";
  if (key === "6month") return "6month";
  if (key === "year" || key === "12month") return "12month";
  if (key === "all" || key === "overall") return "overall";
  throw new UserError(
    "Use `week`, `month`, `3month`, `6month`, `year`, or `all`.",
  );
}

export function periodLabel(value: Period) {
  return (
    {
      "7day": "this week",
      "1month": "this month",
      "3month": "last 3 months",
      "6month": "last 6 months",
      "12month": "this year",
      overall: "all time",
    } as const
  )[value];
}

type CardOpts = {
  subtitle?: string;
  url?: string;
  footer?: string;
  accent?: string | number;
};

export function card(
  title: string,
  body: string,
  image?: string,
  opts: CardOpts = {},
) {
  const header = `## ${title}${opts.subtitle ? `\n-# ${opts.subtitle}` : ""}`;
  const view = container().accent(opts.accent ?? 0xd51007);
  if (image) view.section(header, new ThumbnailBuilder().setURL(image));
  else view.text(header);
  view.separator().text(body);
  if (opts.footer) view.separator(false).text(`-# ${opts.footer}`);
  if (opts.url)
    view.row(
      button({ label: "View on Last.fm", style: "link", url: opts.url }),
    );
  return view;
}

export function list(
  items: { name: string; url?: string; playcount?: string }[],
  empty: string,
) {
  if (!items.length) throw new UserError(empty);
  return items
    .map(
      (item, i) =>
        `**${i + 1}.** ${item.url ? `[${item.name}](${item.url})` : item.name}${item.playcount ? `  ·  ${Number(item.playcount).toLocaleString()} plays` : ""}`,
    )
    .join("\n");
}

export function pair(value: string): [string, string] {
  const parts = value.split(" | ").map((item) => item.trim());
  if (parts.length !== 2 || !parts[0] || !parts[1])
    throw new UserError("Use `artist | track` or `artist | album`.");
  return [parts[0], parts[1]];
}
