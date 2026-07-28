import { createRequire } from "node:module";
import type * as DiscordWS from "@discordjs/ws";

export type DeviceStatus = "android" | "ios" | "vr";

const load = createRequire(import.meta.url);

const deviceNames: Record<DeviceStatus, string> = {
  android: "Discord Android",
  ios: "Discord iOS",
  vr: "Discord VR",
};

export function isDeviceStatus(value: unknown): value is DeviceStatus {
  return typeof value === "string" && value in deviceNames;
}

export function status(device: DeviceStatus = "android"): void {
  const name = deviceNames[device];
  const { DefaultWebSocketManagerOptions } = load(
    "@discordjs/ws",
  ) as typeof DiscordWS;
  Object.assign(DefaultWebSocketManagerOptions.identifyProperties, {
    browser: name,
    device: name,
    os: device,
  });
}
