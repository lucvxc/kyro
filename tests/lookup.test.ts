import { describe, expect, test } from "bun:test";
import { Collection, type Guild, type Role } from "discord.js";

import { findRole } from "../src/guild/Lookup.ts";

describe("role lookup", () => {
  test("accepts mentions, IDs, names, and unique shortcuts", () => {
    const guild = mockGuild([
      ["100000000000000001", "Moderator"],
      ["100000000000000002", "Music Manager"],
    ]);

    expect(findRole(guild, "<@&100000000000000001>")?.name).toBe("Moderator");
    expect(findRole(guild, "100000000000000002")?.name).toBe("Music Manager");
    expect(findRole(guild, "@moderator")?.name).toBe("Moderator");
    expect(findRole(guild, "music")?.name).toBe("Music Manager");
  });

  test("does not guess when a shortcut matches multiple roles", () => {
    const guild = mockGuild([
      ["100000000000000001", "Music Manager"],
      ["100000000000000002", "Music Moderator"],
    ]);

    expect(findRole(guild, "music")).toBeUndefined();
  });
});

function mockGuild(values: [string, string][]): Guild {
  const id = "100000000000000000";
  const cache = new Collection<string, Role>();
  cache.set(id, { id, name: "@everyone" } as Role);
  for (const [roleID, name] of values)
    cache.set(roleID, { id: roleID, name } as Role);
  return { id, roles: { cache } } as Guild;
}
