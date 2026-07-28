import { createRequire } from "node:module";
import { afterEach, describe, expect, test } from "bun:test";
import { Kyro, status, type DeviceStatus } from "../index.ts";

const load = createRequire(import.meta.url);
const { DefaultWebSocketManagerOptions } = load(
  "@discordjs/ws",
) as typeof import("@discordjs/ws");
const identifyProperties =
  DefaultWebSocketManagerOptions.identifyProperties as unknown as {
    browser: string;
    device: string;
    os: string;
  };
const originalProperties = { ...identifyProperties };

afterEach(() => {
  Object.assign(identifyProperties, originalProperties);
});

describe("device status", () => {
  const devices: Array<[DeviceStatus, string]> = [
    ["android", "Discord Android"],
    ["ios", "Discord iOS"],
    ["vr", "Discord VR"],
  ];

  for (const [device, name] of devices) {
    test(`uses ${device} identify properties`, () => {
      status(device);

      expect(identifyProperties).toEqual({
        browser: name,
        device: name,
        os: device,
      });
    });
  }

  test("translates a device presence status before creating the client", async () => {
    const bot = new Kyro({
      token: "test-token",
      appID: "123456789012345",
      intents: [],
      presence: {
        status: "ios",
        activities: [{ name: "with Kyro" }],
      },
    });

    expect(identifyProperties.device).toBe("Discord iOS");
    const presence = bot.client.options.presence!;
    expect(presence.status).toBe("online");
    expect(presence.activities).toEqual([{ name: "with Kyro" }]);

    await bot.stop();
  });
});
