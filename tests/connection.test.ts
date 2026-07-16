import { describe, expect, test } from "bun:test";
import type { Client } from "discord.js";

import { Connection } from "../src/core/Connection.ts";

describe("Connection", () => {
  test("stops plugins before destroying Discord shards", async () => {
    const order: string[] = [];
    const client = {
      token: "token",
      isReady: () => false,
      login: async () => { order.push("login"); },
      destroy: async () => { order.push("destroy"); },
    } as unknown as Client;
    const connection = new Connection({
      client,
      token: "token",
      beforeStart: () => { order.push("beforeStart"); },
      afterStart: () => { order.push("afterStart"); },
      beforeStop: () => { order.push("beforeStop"); },
      afterStop: () => { order.push("afterStop"); },
    });

    await connection.start();
    await connection.stop();

    expect(order).toEqual(["beforeStart", "login", "afterStart", "beforeStop", "destroy", "afterStop"]);
  });
});
