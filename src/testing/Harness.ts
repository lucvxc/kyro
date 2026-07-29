import type { Cmd } from "../commands/Cmd.ts";
import { Registry } from "../commands/Registry.ts";
import type { Context } from "../commands/Context.ts";
import type { MessageContent } from "../ui/Message.ts";
import type { Cmp, CmpContext, ComponentReply } from "../components/Cmp.ts";
import type { Middleware } from "../commands/Middleware.ts";

export interface TestCommandInput {
  source?: "slash" | "message";
  args?: Readonly<Record<string, unknown>>;
  userId?: bigint;
  guildId?: bigint;
}

export interface TestCommandResult {
  replies: readonly MessageContent[];
  command: string;
}

export interface TestComponentInput {
  userId?: bigint;
  guildId?: bigint;
  values?: readonly string[];
  fields?: Readonly<Record<string, string>>;
}

export interface TestComponentResult {
  replies: readonly ComponentReply[];
  updates: readonly ComponentReply[];
  params: readonly string[];
}

export class TestHarness {
  public readonly commands = new Registry();
  readonly #components: Cmp[] = [];
  public constructor(private readonly middleware: readonly Middleware[] = []) {}

  public command(command: Cmd): this {
    this.commands.add(command);
    return this;
  }

  public component(component: Cmp): this {
    this.#components.push(component);
    return this;
  }

  public async run(
    name: string,
    input: TestCommandInput = {},
  ): Promise<TestCommandResult> {
    const source = input.source ?? "slash";
    const command = this.commands.get(name, source);
    if (!command)
      throw new Error(`Command "${name}" is not registered for ${source}.`);
    const replies: MessageContent[] = [];
    const values = input.args ?? {};
    const ctx = new Proxy(
      {
        source,
        command,
        author: { id: input.userId ?? 1n },
        guildId: input.guildId,
        guild: input.guildId ? { id: input.guildId } : null,
        signal: new AbortController().signal,
        reply: async (content: MessageContent) => void replies.push(content),
        send: async (_channel: unknown, content: MessageContent) =>
          void replies.push(content),
      },
      {
        get(target, property, receiver) {
          if (
            [
              "string",
              "number",
              "integer",
              "boolean",
              "user",
              "role",
              "channel",
              "attachment",
            ].includes(String(property))
          )
            return (key: string) => values[key] ?? null;
          return Reflect.get(target, property, receiver);
        },
      },
    ) as unknown as Context;
    await runMiddleware(
      [...this.middleware, ...(command.middleware ?? [])],
      ctx,
      () => Promise.resolve(command.run(ctx)),
    );
    return { replies, command: command.name };
  }

  public async runComponent(
    id: string,
    input: TestComponentInput = {},
  ): Promise<TestComponentResult> {
    const match = this.#components
      .map((item) => ({ item, match: componentMatch(item, id) }))
      .find((value) => value.match !== null);
    if (!match) throw new Error(`Component "${id}" is not registered.`);
    const replies: ComponentReply[] = [];
    const updates: ComponentReply[] = [];
    const params = match.match!;
    const ctx = {
      id,
      params,
      values: input.values ?? [],
      user: { id: input.userId ?? 1n },
      guild: input.guildId ? { id: input.guildId } : null,
      signal: new AbortController().signal,
      field: (name: string) => input.fields?.[name] ?? null,
      reply: async (content: ComponentReply) => void replies.push(content),
      private: async (content: ComponentReply) => void replies.push(content),
      update: async (content: ComponentReply) => void updates.push(content),
    } as unknown as CmpContext;
    const owner =
      typeof match.item.owner === "function"
        ? await match.item.owner(ctx)
        : match.item.owner;
    if (
      owner !== undefined &&
      owner !== true &&
      (owner === false || String(owner) !== String(ctx.user.id))
    )
      throw new Error("Component ownership check failed.");
    await runComponentMiddleware(match.item.middleware ?? [], ctx, () =>
      Promise.resolve(match.item.run(ctx)),
    );
    return { replies, updates, params };
  }
}

export function createTestKyro(...commands: Cmd[]): TestHarness {
  const harness = new TestHarness();
  for (const command of commands) harness.command(command);
  return harness;
}

async function runMiddleware(
  middleware: readonly Middleware[],
  ctx: Context,
  run: () => Promise<void>,
  index = 0,
): Promise<void> {
  const current = middleware[index];
  if (!current) return run();
  await current(ctx, () => runMiddleware(middleware, ctx, run, index + 1));
}

async function runComponentMiddleware(
  middleware: NonNullable<Cmp["middleware"]>,
  ctx: CmpContext,
  run: () => Promise<void>,
  index = 0,
): Promise<void> {
  const current = middleware[index];
  if (!current) return run();
  await current(ctx, () =>
    runComponentMiddleware(middleware, ctx, run, index + 1),
  );
}

function componentMatch(item: Cmp, id: string): string[] | null {
  if (typeof item.id === "string") {
    const base = item.id.split(":");
    const parts = id.split(":");
    return parts.slice(0, base.length).join(":") === item.id
      ? parts.slice(base.length)
      : null;
  }
  const match = id.match(item.id);
  return match ? match.slice(1) : null;
}
