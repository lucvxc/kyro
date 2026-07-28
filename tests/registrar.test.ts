import { describe, expect, test } from "bun:test";
import { Routes, type REST } from "discord.js";
import { Registrar } from "../src/commands/Registrar.ts";
import { Registry } from "../src/commands/Registry.ts";

describe("Registrar", () => {
  test("syncs global and managed guild commands authoritatively", async () => {
    const calls: { route: string; body: unknown[] }[] = [];
    const rest = {
      put: async (route: string, options: { body: unknown[] }) => {
        calls.push({ route, body: options.body });
        return [];
      },
    } as unknown as Pick<REST, "put">;
    const appID = "123456789012345";
    const activeGuild = "234567890123456";
    const emptyGuild = "345678901234567";
    const registry = new Registry()
      .add({ name: "ping", description: "Ping", run: () => undefined })
      .add({
        name: "staff ban",
        description: "Ban a member",
        context: "guild",
        guilds: [activeGuild],
        run: () => undefined,
      });
    const registrar = new Registrar({
      token: "token",
      appID,
      guilds: [activeGuild, emptyGuild],
      rest,
    });

    await registrar.sync(registry);

    expect(calls).toHaveLength(3);
    expect(
      calls.find((call) => call.route === Routes.applicationCommands(appID))
        ?.body,
    ).toHaveLength(1);
    expect(
      calls.find(
        (call) =>
          call.route === Routes.applicationGuildCommands(appID, activeGuild),
      )?.body,
    ).toHaveLength(1);
    expect(
      calls.find(
        (call) =>
          call.route === Routes.applicationGuildCommands(appID, emptyGuild),
      )?.body,
    ).toEqual([]);
  });
});
