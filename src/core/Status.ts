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

export type PresenceStatus = "online" | "idle" | "dnd" | "offline";
export type ActivityType =
  | "playing"
  | "streaming"
  | "listening"
  | "watching"
  | "competing"
  | "custom";

export interface PresenceActivity {
  type: ActivityType;
  /** The activity text. Required for playing/streaming/listening/watching/competing. */
  name?: string;
  /** The text shown for a custom status. */
  state?: string;
  /** The stream url for a streaming activity. */
  url?: string;
}

export interface PresenceInput {
  status?: PresenceStatus;
  activity?: PresenceActivity;
}

export type PresenceConfig = PresenceInput;

const activityNumbers: Record<Exclude<ActivityType, "custom">, number> = {
  playing: 0,
  streaming: 1,
  listening: 2,
  watching: 3,
  competing: 5,
};

export function activity(
  type: ActivityType,
  name?: string,
  options?: { state?: string; url?: string },
): PresenceActivity {
  return { type, name, ...options };
}

export function presence(
  input: PresenceInput,
): { status: PresenceStatus; activities: unknown[] } {
  const { status: presenceStatus = "online", activity } = input;
  const activities = activity
    ? activity.type === "custom"
      ? [
          {
            type: 4,
            name: activity.state ?? "Custom Status",
            ...(activity.state ? { state: activity.state } : {}),
          },
        ]
      : [
          {
            type: activityNumbers[activity.type],
            name: activity.name ?? activity.state ?? "",
            ...(activity.url ? { url: activity.url } : {}),
          },
        ]
    : [];
  return { status: presenceStatus, activities };
}
