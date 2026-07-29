import type { Kyro } from "../Kyro.ts";
import { plugin, type Plugin } from "./Plugin.ts";

export interface ScheduledTask {
  name: string;
  every: number;
  immediate?: boolean;
  run(kyro: Kyro, signal: AbortSignal): void | Promise<void>;
}

export function scheduler(...tasks: ScheduledTask[]): Plugin {
  const timers = new Map<string, ReturnType<typeof setInterval>>();
  const active = new Set<Promise<unknown>>();
  let controller = new AbortController();
  return plugin({
    name: "scheduler",
    setup(kyro) {
      controller = new AbortController();
      for (const task of tasks) {
        if (
          !task.name.trim() ||
          !Number.isFinite(task.every) ||
          task.every <= 0
        )
          throw new TypeError(
            "Scheduled tasks need a name and positive interval.",
          );
        if (timers.has(task.name))
          throw new Error(`Scheduled task "${task.name}" is duplicated.`);
        const execute = () => {
          const work = Promise.resolve(task.run(kyro, controller.signal))
            .catch((error) => kyro.client.logger.error(error))
            .finally(() => active.delete(work));
          active.add(work);
          return work;
        };
        timers.set(task.name, setInterval(execute, task.every));
        if (task.immediate) void execute();
      }
    },
    async stop() {
      controller.abort();
      for (const timer of timers.values()) clearInterval(timer);
      timers.clear();
      await Promise.allSettled([...active]);
    },
  });
}
