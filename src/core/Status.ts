export type DeviceStatus = "android" | "ios" | "vr";

let selected: DeviceStatus | undefined;

const deviceNames: Record<DeviceStatus, string> = {
  android: "Discord Android",
  ios: "Discord iOS",
  vr: "Discord VR",
};

export function isDeviceStatus(value: unknown): value is DeviceStatus {
  return typeof value === "string" && value in deviceNames;
}

export function status(device: DeviceStatus = "android"): void {
  selected = device;
}

export function deviceProperties():
  { os: string; browser: string; device: string } | undefined {
  if (!selected) return undefined;
  const name = deviceNames[selected];
  return { os: selected, browser: name, device: name };
}
