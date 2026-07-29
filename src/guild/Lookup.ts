import type { Guild, Role } from "discordeno";
export function findRole(guild: Guild, value: string): Role | undefined {
  const input = value.trim();
  const id =
    input.match(/^<@&(\d{17,22})>$/)?.[1] ??
    (/^\d{17,22}$/.test(input) ? input : undefined);
  if (id) return guild.roles.get(BigInt(id));
  const name = input.replace(/^@/, "").toLowerCase();
  const roles = [...guild.roles.values()].filter(
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
