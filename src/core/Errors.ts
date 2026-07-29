export type ErrorPhase =
  | "command"
  | "autocomplete"
  | "component"
  | "event"
  | "plugin"
  | "lifecycle"
  | "sync"
  | "runtime";

export interface FrameworkErrorDetails {
  phase: ErrorPhase;
  cause: unknown;
  route?: string;
  userId?: bigint;
  guildId?: bigint;
  interactionId?: bigint;
}

export class FrameworkError extends Error {
  public readonly phase: ErrorPhase;
  public readonly route?: string;
  public readonly userId?: bigint;
  public readonly guildId?: bigint;
  public readonly interactionId?: bigint;

  public constructor(details: FrameworkErrorDetails) {
    super(
      `${details.phase}${details.route ? ` "${details.route}"` : ""} failed.`,
      {
        cause: details.cause,
      },
    );
    this.name = "FrameworkError";
    this.phase = details.phase;
    this.route = details.route;
    this.userId = details.userId;
    this.guildId = details.guildId;
    this.interactionId = details.interactionId;
  }
}

export type FrameworkErrorHandler = (
  error: FrameworkError,
) => void | Promise<void>;
