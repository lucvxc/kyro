import type { DiscordEvent, DiscordEvents } from "../core/Discord.ts";
import type { Kyro } from "../Kyro.ts";

export interface Evt<K extends DiscordEvent> {
  name: K;
  once?: boolean;
  priority?: number;
  when?(...args: Parameters<DiscordEvents[K]>): boolean | Promise<boolean>;
  run(...args: [...Parameters<DiscordEvents[K]>, Kyro?]): void | Promise<void>;
  error?(
    error: unknown,
    ...args: Parameters<DiscordEvents[K]>
  ): void | Promise<void>;
}

export function evt<K extends DiscordEvent>(event: Evt<K>): Evt<K> {
  return event;
}
