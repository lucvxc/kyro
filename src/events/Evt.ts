import type { ClientEvents } from "discord.js";
import type { Kyro } from "../Kyro.ts";

export interface Evt<K extends keyof ClientEvents> {
  name: K;
  once?: boolean;
  priority?: number;
  when?(...args: ClientEvents[K]): boolean | Promise<boolean>;
  run(...args: [...ClientEvents[K], Kyro?]): void | Promise<void>;
  error?(error: unknown, ...args: ClientEvents[K]): void | Promise<void>;
}

export function evt<K extends keyof ClientEvents>(event: Evt<K>): Evt<K> {
  return event;
}
