import { PermissionFlagsBits } from "discord.js";
import { eq } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";

import type { Context, PermissionResolver } from "../../index.ts";
import { UserError } from "../../index.ts";
import * as schema from "../db/schema.ts";
import type { FakePermissionMap } from "../db/settings.ts";

type DB = PostgresJsDatabase<typeof schema>;
type Grant = { roleId: string; permission: string };

export const permissions = Object.freeze(Object.keys(PermissionFlagsBits));

class FakePermissions {
  #db?: DB;
  readonly #cache = new Map<string, { expires: number; grants: Grant[] }>();

  public use(db: DB): this {
    this.#db = db;
    return this;
  }

  public readonly check: PermissionResolver = async (ctx, missing) => {
    const guild = ctx.guild;
    if (!guild) return false;
    if (ctx.author.id === guild.ownerId) return true;

    const member =
      guild.members.cache.get(ctx.author.id) ??
      (await guild.members.fetch(ctx.author.id).catch(() => null));
    if (!member) return false;

    const grants = await this.#grants(guild.id);
    const allowed = new Set(
      grants
        .filter((grant) => member.roles.cache.has(grant.roleId))
        .map((grant) => grant.permission),
    );

    return (
      allowed.has("Administrator") ||
      missing.every((value) => allowed.has(value))
    );
  };

  public async grant(
    guildID: string,
    roleID: string,
    value: string,
  ): Promise<boolean> {
    const permission = permissionName(value);
    const settings = await this.#read(guildID);
    const current = settings[roleID] ?? [];
    if (current.includes(permission)) return false;

    await this.#save(guildID, {
      ...settings,
      [roleID]: [...current, permission],
    });
    return true;
  }

  public async revoke(
    guildID: string,
    roleID: string,
    value: string,
  ): Promise<boolean> {
    const permission = permissionName(value);
    const settings = await this.#read(guildID);
    const current = settings[roleID] ?? [];
    if (!current.includes(permission)) return false;

    const remaining = current.filter((value) => value !== permission);
    if (remaining.length) settings[roleID] = remaining;
    else delete settings[roleID];
    await this.#save(guildID, settings);
    return true;
  }

  public async list(guildID: string, roleID?: string): Promise<Grant[]> {
    const grants = await this.#grants(guildID);
    return roleID ? grants.filter((grant) => grant.roleId === roleID) : grants;
  }

  public async clear(guildID: string, roleID?: string): Promise<number> {
    let settings = await this.#read(guildID);
    const removed = roleID
      ? (settings[roleID]?.length ?? 0)
      : Object.values(settings).reduce(
          (total, values) => total + values.length,
          0,
        );
    if (!removed) return 0;

    if (roleID) delete settings[roleID];
    else settings = {};
    await this.#save(guildID, settings);
    return removed;
  }

  async #grants(guildID: string): Promise<Grant[]> {
    const cached = this.#cache.get(guildID);
    if (cached && cached.expires > Date.now()) return cached.grants;

    const settings = await this.#read(guildID);
    const grants = Object.entries(settings).flatMap(([roleId, permissions]) =>
      permissions.map((permission) => ({ roleId, permission })),
    );
    this.#cache.set(guildID, { expires: Date.now() + 60_000, grants });
    return grants;
  }

  async #read(guildID: string): Promise<FakePermissionMap> {
    const [guild] = await this.#database()
      .select({ value: schema.guilds.fakePermissions })
      .from(schema.guilds)
      .where(eq(schema.guilds.id, guildID))
      .limit(1);
    return { ...(guild?.value ?? {}) };
  }

  async #save(guildID: string, value: FakePermissionMap): Promise<void> {
    await this.#database()
      .insert(schema.guilds)
      .values({ id: guildID, fakePermissions: value })
      .onConflictDoUpdate({
        target: schema.guilds.id,
        set: { fakePermissions: value, updatedAt: new Date() },
      });
    this.#cache.delete(guildID);
  }

  #database(): DB {
    if (!this.#db)
      throw new Error("Fake permissions are not connected to the database.");
    return this.#db;
  }
}

export const fakePerms = new FakePermissions();

export function permissionName(value: string): string {
  const input = value.replace(/[\s_-]/g, "").toLowerCase();
  const name = permissions.find(
    (permission) => permission.toLowerCase() === input,
  );
  if (!name)
    throw new UserError(`"${value}" is not a valid Discord permission.`);
  return name;
}

export function permissionChoices(query = "") {
  const input = query.replace(/[\s_-]/g, "").toLowerCase();
  return permissions
    .filter((name) => name.toLowerCase().includes(input))
    .slice(0, 25)
    .map((name) => ({ name: label(name), value: name }));
}

export function label(value: string): string {
  return value.replace(/([a-z])([A-Z])/g, "$1 $2");
}

export function owner(ctx: Context): void {
  if (!ctx.guild || ctx.author.id !== ctx.guild.ownerId) {
    throw new UserError("Only the server owner can manage fake permissions.");
  }
}
