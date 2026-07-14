import { describe, expect, test } from "bun:test";
import { PermissionFlagsBits, PermissionsBitField } from "discord.js";

import type { Entry } from "../src/commands/Cmd.ts";
import type { Context } from "../src/commands/Context.ts";
import { Guard } from "../src/commands/Guard.ts";

const command = (values: Partial<Entry> = {}): Entry => ({
  name: "test",
  description: "Test command",
  type: "hybrid",
  context: "both",
  aliases: [],
  permissions: [],
  path: ["test"],
  run: () => undefined,
  ...values,
});

const context = (guild: boolean, permissions?: PermissionsBitField): Context =>
  ({
    guild: guild ? {} : null,
    author: { id: "1" },
    interaction: null,
    message: guild ? { member: { permissions } } : null,
  }) as unknown as Context;

describe("Guard", () => {
  test("enforces command contexts", () => {
    const guard = new Guard();

    expect(guard.check(command({ context: "guild" }), context(false))).toBe(
      "This command can only be used in a server.",
    );
    expect(guard.check(command({ context: "dms" }), context(true))).toBe(
      "This command can only be used in DMs.",
    );
  });

  test("reports missing permissions", () => {
    const guard = new Guard();
    const permissions = new PermissionsBitField(PermissionFlagsBits.SendMessages);
    const result = guard.check(
      command({ context: "guild", permissions: [PermissionFlagsBits.ManageMessages] }),
      context(true, permissions),
    );

    expect(result).toBe("Missing permissions: Manage Messages.");
  });

  test("applies cooldowns and only warns once", () => {
    const guard = new Guard(3);
    const ctx = context(false);

    expect(guard.check(command(), ctx)).toBeUndefined();
    expect(guard.check(command(), ctx)).toBe("Try again in 3s.");
    expect(guard.check(command(), ctx)).toBeNull();
  });
});
