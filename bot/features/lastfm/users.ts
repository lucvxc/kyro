import { eq, inArray } from "drizzle-orm";
import { UserError } from "../../../index.ts";
import { db } from "../../db/database.ts";
import { users } from "../../db/schema.ts";

export async function account(id: string, required = true) {
  const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  if (required && !user?.lastfm)
    throw new UserError("Link your Last.fm account first with `lastfm login`.");
  return user;
}

export async function link(id: string, name: string, session: string) {
  const account = { lastfm: name, lastfmSession: session };
  await db
    .insert(users)
    .values({ id, ...account })
    .onConflictDoUpdate({ target: users.id, set: account });
}

export async function unlink(id: string) {
  await db
    .update(users)
    .set({ lastfm: null, lastfmSession: null })
    .where(eq(users.id, id));
}

export async function linked(ids?: string[]) {
  const query = db.select().from(users);
  const rows = ids?.length
    ? await query.where(inArray(users.id, ids))
    : await query;
  return rows.filter((user) => user.lastfm && !user.lastfmHidden);
}

export async function prefs(
  id: string,
  changes: Partial<
    Pick<
      typeof users.$inferSelect,
      "lastfmEmbed" | "lastfmReactions" | "lastfmHidden"
    >
  >,
) {
  await db
    .insert(users)
    .values({ id, ...changes })
    .onConflictDoUpdate({ target: users.id, set: changes });
}
