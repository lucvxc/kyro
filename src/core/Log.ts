import chalk from "chalk";

const tag = `${chalk.white("[")}${chalk.magentaBright("KYRO")}${chalk.white("]")}`;
let errors = 0;
const history: { message: string; time: number }[] = [];

export const log = {
  info(message: string): void { console.log(`${tag} ${chalk.white(message)}`); },
  warn(message: string): void { console.warn(`${tag} ${chalk.yellow(message)}`); },
  error(message: string, cause?: unknown): void {
    errors += 1;
    history.push({ message, time: Date.now() });
    if (history.length > 50) history.shift();
    const output = `${tag} ${chalk.red(message)}`;

    if (cause !== undefined) console.error(output, cause);
    else console.error(output);
  },
  get errors(): number { return errors; },
  get history(): readonly { message: string; time: number }[] { return history; },
};
