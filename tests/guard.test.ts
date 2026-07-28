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
  botPermissions: [],
  guilds: [],
  category: "general",
  syntax: "test",
  path: ["test"],
  run: () => undefined,
  ...values,
});

const context = (
  guild: boolean,
  permissions?: PermissionsBitField,
  botPermissions?: PermissionsBitField,
): Context =>
  ({
    guild: guild
      ? {
          members: {
            me: {
              permissionsIn: () => botPermissions,
            },
          },
        }
      : null,
    input: { channelId: "1" },
    author: { id: "1" },
    interaction: null,
    message: guild ? { member: { permissions } } : null,
  }) as unknown as Context;

describe("Guard", () => {
  test("enforces command contexts", async () => {
    const guard = new Guard();

    expect(
      await guard.check(command({ context: "guild" }), context(false)),
    ).toBe("This command can only be used in a server.");
    expect(await guard.check(command({ context: "dms" }), context(true))).toBe(
      "This command can only be used in DMs.",
    );
  });

  test("reports missing permissions", async () => {
    const guard = new Guard();
    const permissions = new PermissionsBitField(
      PermissionFlagsBits.SendMessages,
    );
    const result = await guard.check(
      command({
        context: "guild",
        permissions: [PermissionFlagsBits.ManageMessages],
      }),
      context(true, permissions),
    );

    expect(result).toBe("Missing permissions: Manage Messages.");
  });

  test("allows a custom permission resolver", async () => {
    const guard = new Guard(0, async (_ctx, missing) =>
      missing.includes("ManageMessages"),
    );
    const permissions = new PermissionsBitField(
      PermissionFlagsBits.SendMessages,
    );
    const result = await guard.check(
      command({
        context: "guild",
        permissions: [PermissionFlagsBits.ManageMessages],
      }),
      context(true, permissions),
    );

    expect(result).toBeUndefined();
  });

  test("reports permissions missing from the bot", async () => {
    const guard = new Guard();
    const result = await guard.check(
      command({
        context: "guild",
        botPermissions: [PermissionFlagsBits.EmbedLinks],
      }),
      context(
        true,
        new PermissionsBitField(PermissionFlagsBits.ManageMessages),
        new PermissionsBitField(PermissionFlagsBits.SendMessages),
      ),
    );

    expect(result).toBe("I need permissions: Embed Links.");
  });

  test("applies cooldowns and only warns once", async () => {
    const guard = new Guard(3);
    const ctx = context(false);

    expect(await guard.check(command(), ctx)).toBeUndefined();
    expect(await guard.check(command(), ctx)).toBe("Try again in 3s.");
    expect(await guard.check(command(), ctx)).toBeNull();
  });
});
