import chalk from "chalk";
import type { Logger } from "./Logger.ts";

const tag = `${chalk.white("[")}${chalk.magentaBright("KYRO")}${chalk.white("]")}`;
let errors = 0;
const history: { message: string; time: number }[] = [];

const fallback: Logger = {
  debug(message, context): void {
    console.debug(`${tag} ${chalk.gray(message)}`, context ?? "");
  },
  info(message, context): void {
    console.log(`${tag} ${chalk.white(message)}`, context ?? "");
  },
  warn(message, context): void {
    console.warn(`${tag} ${chalk.yellow(message)}`, context ?? "");
  },
  error(message, cause, context): void {
    errors += 1;
    history.push({ message, time: Date.now() });
    if (history.length > 50) history.shift();
    const output = `${tag} ${chalk.red(message)}`;

    if (cause !== undefined) console.error(output, cause, context ?? "");
    else console.error(output, context ?? "");
  },
};

let active: Logger = fallback;

export function setLogger(logger?: Logger): void {
  active = logger ?? fallback;
}

export const log = {
  debug(message: string, context?: Record<string, unknown>): void {
    active.debug(message, context);
  },
  info(message: string, context?: Record<string, unknown>): void {
    active.info(message, context);
  },
  warn(message: string, context?: Record<string, unknown>): void {
    active.warn(message, context);
  },
  error(
    message: string,
    cause?: unknown,
    context?: Record<string, unknown>,
  ): void {
    active.error(message, cause, context);
  },
  get errors(): number {
    return errors;
  },
  get history(): readonly { message: string; time: number }[] {
    return history;
  },
};
