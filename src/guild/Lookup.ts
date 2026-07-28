import type { Guild, Role } from "discord.js";

export function findRole(guild: Guild, value: string): Role | undefined {
  const input = value.trim();
  const id =
    input.match(/^<@&(\d{17,20})>$/)?.[1] ??
    (/^\d{17,20}$/.test(input) ? input : undefined);
  if (id) return guild.roles.cache.get(id);

  const name = input.replace(/^@/, "").toLowerCase();
  if (!name) return undefined;

  const roles = [...guild.roles.cache.values()].filter(
    (role) => role.id !== guild.id,
  );
  return (
    roles.find((role) => role.name.toLowerCase() === name) ??
    one(roles.filter((role) => role.name.toLowerCase().startsWith(name))) ??
    one(roles.filter((role) => role.name.toLowerCase().includes(name)))
  );
}

function one(roles: Role[]): Role | undefined {
  return roles.length === 1 ? roles[0] : undefined;
}
