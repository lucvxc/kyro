import {
  InteractionTypes,
  type Attachment,
  type InteractionCallbackData,
  type PermissionStrings,
} from "discordeno";
import type { DiscordBot, DiscordInteraction } from "../core/Discord.ts";
import type { Container } from "../ui/Container.ts";
import type { Embed } from "../ui/Embed.ts";
import type { RateLimitPolicy } from "../core/RateLimit.ts";
import type { ServiceToken, Services } from "../core/Services.ts";
import { validateRateLimit } from "../core/RateLimit.ts";

export type ComponentInput = DiscordInteraction;
export type ComponentReply = string | Embed | Container;
export type ComponentId = string | RegExp;
export type ComponentNext = () => Promise<void>;
export type ComponentMiddleware = (
  ctx: CmpContext,
  next: ComponentNext,
) => void | Promise<void>;

export interface CmpContext {
  readonly client: DiscordBot;
  readonly interaction: ComponentInput;
  readonly id: string;
  readonly user: ComponentInput["user"];
  readonly guild: ComponentInput["guild"] | null;
  readonly values: readonly string[];
  readonly params: readonly string[];
  readonly services: Services;
  readonly signal: AbortSignal;
  field(name: string): string | null;
  strings(name: string): readonly string[];
  channelIds(name: string): readonly string[];
  files(name: string): readonly Attachment[];
  showModal(modal: InteractionCallbackData): Promise<void>;
  reply(content: ComponentReply): Promise<void>;
  private(content: ComponentReply): Promise<void>;
  update(content: ComponentReply): Promise<void>;
  defer(): Promise<void>;
  deferReply(privateResponse?: boolean): Promise<void>;
  followUp(content: ComponentReply, privateResponse?: boolean): Promise<void>;
  deleteReply(messageId?: bigint): Promise<void>;
  service<T>(token: ServiceToken<T>): T;
}

export interface Cmp {
  id: ComponentId;
  permissions?: readonly PermissionStrings[];
  botPermissions?: readonly PermissionStrings[];
  context?: "both" | "guild" | "dms";
  cooldown?: number;
  middleware?: readonly ComponentMiddleware[];
  rateLimit?: RateLimitPolicy;
  timeout?: number;
  owner?:
    | string
    | bigint
    | ((
        ctx: CmpContext,
      ) => string | bigint | boolean | Promise<string | bigint | boolean>);
  run(ctx: CmpContext): void | Promise<void>;
  error?(error: unknown, ctx: CmpContext): void | Promise<void>;
}

export function cmp(value: Cmp): Cmp {
  assertCmp(value);
  return value;
}

export function assertCmp(value: unknown): asserts value is Cmp {
  const item = value as Partial<Cmp> | null | undefined;
  if (
    !item?.id ||
    (typeof item.id === "string" && !item.id.trim()) ||
    (typeof item.id !== "string" && !(item.id instanceof RegExp)) ||
    typeof item.run !== "function"
  )
    throw new TypeError("A component needs an id and run function.");
  if (item.context && !["both", "guild", "dms"].includes(item.context))
    throw new TypeError("A component has an invalid context.");
  if (
    (item.permissions?.length || item.botPermissions?.length) &&
    item.context !== "guild"
  )
    throw new TypeError(
      'Components with permissions must use context: "guild".',
    );
  if (
    item.cooldown !== undefined &&
    (!Number.isFinite(item.cooldown) || item.cooldown < 0)
  )
    throw new TypeError("Component cooldowns must be zero or positive.");
  if (item.rateLimit) validateRateLimit(item.rateLimit);
  if (
    item.timeout !== undefined &&
    (!Number.isFinite(item.timeout) || item.timeout < 0)
  )
    throw new TypeError("Component timeouts must be zero or positive.");
}

export function isComponentInteraction(value: DiscordInteraction): boolean {
  return (
    value.type === InteractionTypes.MessageComponent ||
    value.type === InteractionTypes.ModalSubmit
  );
}
