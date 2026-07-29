import type { Options } from "../Kyro.ts";
import { existsSync } from "node:fs";
import { isAbsolute } from "node:path";

export interface ConfigIssue {
  path: string;
  message: string;
}

export class ConfigurationError extends TypeError {
  public constructor(public readonly issues: readonly ConfigIssue[]) {
    super(
      `Invalid Kyro configuration:\n${issues.map((issue) => `- ${issue.path}: ${issue.message}`).join("\n")}`,
    );
    this.name = "ConfigurationError";
  }
}

export function validateConfig(options: Options): void {
  const client = options.client ?? options;
  const config = options.config ?? options;
  const issues: ConfigIssue[] = [];
  if (!client.token?.trim())
    issues.push({ path: "token", message: "is required" });
  if (!client.appID?.trim())
    issues.push({ path: "appID", message: "is required" });
  else if (!/^\d{15,22}$/.test(client.appID))
    issues.push({ path: "appID", message: "must be a Discord snowflake" });
  if (!client.intents)
    issues.push({
      path: "intents",
      message: "must contain at least one gateway intent",
    });
  if (config.sync === "guild" && !config.guildID)
    issues.push({ path: "guildID", message: "is required when sync is guild" });
  for (const [index, guild] of (config.guilds ?? []).entries())
    if (!/^\d{15,22}$/.test(guild))
      issues.push({
        path: `guilds[${index}]`,
        message: "must be a Discord snowflake",
      });
  if (config.guildID && !/^\d{15,22}$/.test(config.guildID))
    issues.push({ path: "guildID", message: "must be a Discord snowflake" });
  if (config.prefix !== undefined && !config.prefix)
    issues.push({ path: "prefix", message: "cannot be empty" });
  if (
    config.cooldown !== undefined &&
    (!Number.isFinite(config.cooldown) || config.cooldown < 0)
  )
    issues.push({
      path: "cooldown",
      message: "must be zero or positive seconds",
    });
  if (
    options.timeout !== undefined &&
    (!Number.isFinite(options.timeout) || options.timeout < 0)
  )
    issues.push({
      path: "timeout",
      message: "must be zero or positive milliseconds",
    });
  for (const field of ["commands", "events", "components"] as const) {
    const directory = config[field];
    if (!directory) continue;
    if (!isAbsolute(directory))
      issues.push({ path: field, message: "must be an absolute directory" });
    else if (!existsSync(directory))
      issues.push({ path: field, message: "directory does not exist" });
  }
  if (
    options.shutdownTimeout !== undefined &&
    (!Number.isFinite(options.shutdownTimeout) || options.shutdownTimeout < 0)
  )
    issues.push({
      path: "shutdownTimeout",
      message: "must be zero or positive milliseconds",
    });
  if (issues.length) throw new ConfigurationError(issues);
}
