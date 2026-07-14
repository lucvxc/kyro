import chalk from "chalk";

const tag = `${chalk.white("[")}${chalk.magentaBright("KYRO")}${chalk.white("]")}`;

export const log = {
  info(message: string): void { console.log(`${tag} ${chalk.white(message)}`); },
  warn(message: string): void { console.warn(`${tag} ${chalk.yellow(message)}`); },
  error(message: string, cause?: unknown): void {
    const output = `${tag} ${chalk.red(message)}`;

    if (cause !== undefined) console.error(output, cause);
    else console.error(output);
  },
};
