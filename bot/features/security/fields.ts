import { UserError } from "../../../index.ts";

export function bool(value: string | null): boolean {
  if (value === "true") return true;
  if (value === "false") return false;
  throw new UserError("Enabled must be true or false.");
}

export function int(value: string | null, min: number, max: number): number {
  const num = Number(value);
  if (!Number.isInteger(num) || num < min || num > max) {
    throw new UserError(`Enter a whole number from ${min} to ${max}.`);
  }
  return num;
}
