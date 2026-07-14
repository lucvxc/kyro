export class UserError extends Error {
  public readonly code = "USER_ERROR";
  public constructor(message: string) {
    super(message);
    this.name = "UserError";
  }
}

export class CommandError extends Error {
  public readonly code = "COMMAND_ERROR";
  public constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "CommandError";
  }
}
