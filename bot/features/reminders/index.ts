import type { Client } from "discord.js";
import { eq, lte } from "drizzle-orm";
import { db } from "../../db/database.ts";
import { reminders } from "../../db/schema.ts";

let timer: ReturnType<typeof setInterval> | undefined;

export function parseDelay(value: string) {
  const match = value.toLowerCase().match(/^(\d+)(s|m|h|d|w)$/);
  if (!match) return null;
  const unit = {
    s: 1_000,
    m: 60_000,
    h: 3_600_000,
    d: 86_400_000,
    w: 604_800_000,
  }[match[2]!]!;
  const delay = Number(match[1]) * unit;
  return delay >= 5_000 && delay <= 365 * 86_400_000 ? delay : null;
}

export function startReminders(client: Client) {
  if (timer) return;
  const run = async () => {
    const due = await db
      .select()
      .from(reminders)
      .where(lte(reminders.dueAt, new Date()))
      .limit(100)
      .catch(() => []);
    for (const item of due) {
      await db
        .delete(reminders)
        .where(eq(reminders.id, item.id))
        .catch(() => undefined);
      const channel = client.channels.cache.get(item.channelId);
      if (channel?.isSendable())
        await channel
          .send({
            content: `<@${item.userId}> reminder: ${item.content}`,
            allowedMentions: { users: [item.userId] },
          })
          .catch(() => undefined);
      else
        await client.users
          .fetch(item.userId)
          .then((user) => user.send(`Reminder: ${item.content}`))
          .catch(() => undefined);
    }
  };
  timer = setInterval(() => void run(), 10_000);
  timer.unref?.();
  void run();
}
