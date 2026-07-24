import { eq } from "drizzle-orm";
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
  const data = { lastfm: name, lastfmSession: session };
  await db
    .insert(users)
    .values({ id, ...data })
    .onConflictDoUpdate({ target: users.id, set: data });
}

export async function unlink(id: string) {
  await db
    .update(users)
    .set({ lastfm: null, lastfmSession: null })
    .where(eq(users.id, id));
}
