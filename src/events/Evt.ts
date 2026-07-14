import type { ClientEvents } from "discord.js";

export interface Evt<K extends keyof ClientEvents> {
  name: K;
  once?: boolean;
  priority?: number;
  when?(...args: ClientEvents[K]): boolean | Promise<boolean>;
  run(...args: ClientEvents[K]): void | Promise<void>;
  error?(error: unknown, ...args: ClientEvents[K]): void | Promise<void>;
}

export function evt<K extends keyof ClientEvents>(event: Evt<K>): Evt<K> {
  return event;
}
