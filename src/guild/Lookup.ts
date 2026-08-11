import type { Guild, Role, User } from "discordeno";

export function findUser(
  guild: Guild | undefined,
  value: string,
  extra: readonly User[] = [],
): User | undefined {
  const input = value.trim();
  const id =
    input.match(/^<@!?(\d{17,22})>$/)?.[1] ??
    (/^\d{17,22}$/.test(input) ? input : undefined);
  const users = unique([
    ...extra,
    ...[...(guild?.members?.values() ?? [])].flatMap((member) =>
      member.user ? [member.user] : [],
    ),
  ]);
  if (id) return users.find((user) => user.id === BigInt(id));
  const name = input.replace(/^@/, "").toLowerCase();
  return users.find((user) => user.username.toLowerCase() === name);
}

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

function unique(users: readonly User[]): User[] {
  return [...new Map(users.map((user) => [user.id, user])).values()];
}

function one(roles: Role[]): Role | undefined {
  return roles.length === 1 ? roles[0] : undefined;
}
