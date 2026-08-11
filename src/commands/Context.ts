import {
  ApplicationCommandOptionTypes,
  type Channel,
  type Attachment,
  type InteractionCallbackData,
  type Role,
  type User,
} from "discordeno";

import type { ArgType } from "./Arg.ts";
import type { Entry } from "./Cmd.ts";
import { parse } from "./Parser.ts";
import { UserError } from "./Errors.ts";
import { Catalog } from "./Catalog.ts";
import {
  messageOptions,
  type MessageContent,
  type MessagePolicy,
} from "../ui/Message.ts";
import type {
  DiscordBot,
  DiscordInteraction as Interaction,
  DiscordMessage as Message,
} from "../core/Discord.ts";
import { runtimeStats } from "../core/Discord.ts";
import { Moderation } from "./Moderation.ts";
import { Server } from "../guild/Server.ts";
import { withStats, type GuildWithStats } from "../guild/Stats.ts";
import { Stats } from "../core/Stats.ts";
import { ChannelStats } from "../guild/ChannelStats.ts";
import { RoleStats } from "../guild/RoleStats.ts";
import { UserStats } from "../guild/UserStats.ts";
import { musicFor, type MusicContext } from "../plugins/music/index.ts";
import { Services, type ServiceToken } from "../core/Services.ts";
import { findRole, findUser } from "../guild/Lookup.ts";

export type Source = "slash" | "message";
export type Input = Interaction | Message;
export type Reply = MessageContent;

export class Context {
  public readonly client: DiscordBot;
  public readonly issue: string | undefined;
  readonly #entry: Entry;
  readonly #values: ReadonlyMap<string, unknown>;
  #response: Message | undefined;
  #mod?: Moderation;
  #server?: Server;
  #stats?: Stats;
  #deferred = false;

  public constructor(
    public readonly source: Source,
    public readonly input: Input,
    entry: Entry,
    public readonly raw: readonly string[] = [],
    public readonly commands: Catalog = new Catalog([]),
    public readonly prefix = "/",
    bot?: DiscordBot,
    public readonly services: Services = new Services(),
    public readonly signal: AbortSignal = new AbortController().signal,
    public readonly messagePolicy: MessagePolicy = {},
  ) {
    this.client =
      source === "slash" ? (input as Interaction).bot : requireBot(bot);
    this.#entry = entry;
    if (source === "message") {
      const message = input as Message;
      const guild = message.guildId
        ? runtimeStats(this.client).guildObjects.get(message.guildId)
        : undefined;
      const mentioned = message.mentions ?? [];
      const parsed = parse(entry.args, raw, {
        user: (value) => findUser(guild, value, [message.author, ...mentioned]),
        role: (value) => (guild ? findRole(guild, value) : undefined),
        channel: () => undefined,
      });
      this.#values = parsed.values;
      this.issue = parsed.issue;
    } else {
      this.#values = interactionValues(input as Interaction);
      this.issue = undefined;
    }
  }

  public get author(): User {
    return this.source === "slash"
      ? (this.input as Interaction).user
      : (this.input as Message).author;
  }

  public get command(): Entry {
    return this.#entry;
  }

  public get guild(): GuildWithStats | null {
    const guildId = this.guildId;
    const cached = guildId
      ? runtimeStats(this.client).guildObjects.get(guildId)
      : undefined;
    const guild =
      cached ??
      (this.source === "slash" ? (this.input as Interaction).guild : undefined);
    return guild ? withStats(guild) : null;
  }

  public get guildId(): bigint | undefined {
    return this.source === "slash"
      ? (this.input as Interaction).guildId
      : (this.input as Message).guildId;
  }

  public get channelId(): bigint {
    const id =
      this.source === "slash"
        ? (this.input as Interaction).channelId
        : (this.input as Message).channelId;
    if (!id) throw new UserError("This interaction has no channel.");
    return id;
  }

  public get interaction(): Interaction | null {
    return this.source === "slash" ? (this.input as Interaction) : null;
  }

  public get message(): Message | null {
    return this.source === "message" ? (this.input as Message) : null;
  }

  public get mod(): Moderation {
    return (this.#mod ??= new Moderation(
      this.client,
      this.guildId,
      this.author,
    ));
  }
  public get server(): Server {
    if (!this.guildId)
      throw new UserError("This action can only be used in a server.");
    return (this.#server ??= new Server(this.client, this.guildId));
  }
  public get stats(): Stats {
    return (this.#stats ??= new Stats(this.client));
  }
  public get music(): MusicContext {
    const music = musicFor(this.client);
    if (!music)
      throw new UserError("The NodeLink music plugin is not enabled.");
    return music.context(this);
  }

  public string(name: string): string | null {
    return this.#value(name, "string") as string | null;
  }

  public number(name: string): number | null {
    return this.#value(name, "number") as number | null;
  }
  public integer(name: string): number | null {
    return this.#value(name, "integer") as number | null;
  }

  public boolean(name: string): boolean | null {
    return this.#value(name, "boolean") as boolean | null;
  }

  public user(name: string): User | null {
    return this.#value(name, "user") as User | null;
  }

  public role(name: string): Role | null {
    return this.#value(name, "role") as Role | null;
  }

  public channel(name: string): Channel | null {
    return this.#value(name, "channel") as Channel | null;
  }
  public attachment(name: string): Attachment | null {
    return this.#value(name, "attachment") as Attachment | null;
  }

  public channelStats(name: string): ChannelStats {
    const channel =
      this.channel(name) ?? (this.interaction?.channel as Channel | undefined);
    if (!channel?.id) throw new UserError("I could not find that channel.");
    return new ChannelStats(channel as Channel);
  }
  public roleStats(name: string): RoleStats {
    const role = this.role(name);
    if (!role) throw new UserError("I could not find that role.");
    return new RoleStats(role);
  }
  public async userStats(name: string): Promise<UserStats> {
    const user = this.user(name) ?? this.author;
    const member = this.guildId
      ? await this.client.helpers
          .getMember(this.guildId, user.id)
          .catch(() => null)
      : null;
    return new UserStats(user, member);
  }
  public async ownerStats(): Promise<UserStats> {
    if (!this.guildId)
      throw new UserError("This command can only be used in a server.");
    const guild = await this.client.helpers.getGuild(this.guildId);
    const user = await this.client.helpers.getUser(guild.ownerId);
    const member = await this.client.helpers
      .getMember(this.guildId, user.id)
      .catch(() => null);
    return new UserStats(user, member);
  }

  public async reply(content: Reply): Promise<void> {
    const options = messageOptions(content, false, this.messagePolicy);
    if (this.source === "message") {
      this.#response = await this.client.helpers.sendMessage(this.channelId, {
        ...options,
        messageReference: {
          messageId: (this.input as Message).id,
          failIfNotExists: false,
        },
      });
      return;
    }
    const response = this.#deferred
      ? await (this.input as Interaction).edit(options)
      : await (this.input as Interaction).respond(options);
    this.#deferred = false;
    if (response && "id" in response) this.#response = response as Message;
  }

  public async defer(privateResponse = false): Promise<void> {
    if (!this.interaction)
      throw new Error("Only interaction commands can be deferred.");
    if (!this.interaction.acknowledged)
      await this.interaction.defer(privateResponse);
    this.#deferred = true;
  }

  public deferPrivate(): Promise<void> {
    return this.defer(true);
  }

  public async editReply(content: Reply): Promise<void> {
    if (!this.interaction)
      throw new Error("Only interaction responses can be edited.");
    const response = await this.interaction.edit(
      messageOptions(content, false, this.messagePolicy),
    );
    if (response && "id" in response) this.#response = response as Message;
  }

  public async followUp(
    content: Reply,
    privateResponse = false,
  ): Promise<void> {
    if (!this.interaction)
      throw new Error("Only interactions can receive follow-up responses.");
    const response = await this.interaction.respond(
      messageOptions(content, privateResponse, this.messagePolicy),
    );
    if (response && "id" in response) this.#response = response as Message;
  }

  public async deleteReply(messageId?: bigint): Promise<void> {
    if (!this.interaction)
      throw new Error("Only interaction responses can be deleted.");
    await this.interaction.delete(messageId);
  }

  public service<T>(token: ServiceToken<T>): T {
    return this.services.get(token);
  }

  public async send(channel: Channel | bigint, content: Reply): Promise<void> {
    await this.client.helpers.sendMessage(
      typeof channel === "bigint" ? channel : channel.id,
      messageOptions(content, false, this.messagePolicy),
    );
  }

  public async showModal(modal: InteractionCallbackData): Promise<void> {
    if (!this.interaction)
      throw new Error("Modals can only be opened from slash commands.");
    await this.interaction.respond(modal);
  }

  public get response(): Message | undefined {
    return this.#response;
  }

  #value(name: string, type: ArgType): unknown {
    const arg = this.#entry.args?.[name];
    if (!arg) throw new Error(`Argument "${name}" is not defined.`);
    if (arg.type !== type)
      throw new TypeError(`Argument "${name}" is ${arg.type}, not ${type}.`);
    return this.#values.get(name) ?? arg.default ?? null;
  }
}

function requireBot(bot?: DiscordBot): DiscordBot {
  if (!bot) throw new Error("Message command contexts require a Discord bot.");
  return bot;
}

function interactionValues(
  interaction: Interaction,
): ReadonlyMap<string, unknown> {
  const values = new Map<string, unknown>();
  let options = interaction.data?.options ?? [];
  while (
    options[0] &&
    (options[0].type === ApplicationCommandOptionTypes.SubCommand ||
      options[0].type === ApplicationCommandOptionTypes.SubCommandGroup)
  ) {
    options = options[0].options ?? [];
  }
  const resolved = interaction.data?.resolved;
  for (const option of options) {
    const value = option.value;
    if (option.type === ApplicationCommandOptionTypes.User && value != null)
      values.set(option.name, resolved?.users?.get(BigInt(value)) ?? null);
    else if (
      option.type === ApplicationCommandOptionTypes.Role &&
      value != null
    )
      values.set(option.name, resolved?.roles?.get(BigInt(value)) ?? null);
    else if (
      option.type === ApplicationCommandOptionTypes.Channel &&
      value != null
    )
      values.set(option.name, resolved?.channels?.get(BigInt(value)) ?? null);
    else if (
      option.type === ApplicationCommandOptionTypes.Attachment &&
      value != null
    )
      values.set(
        option.name,
        resolved?.attachments?.get(BigInt(value)) ?? null,
      );
    else values.set(option.name, value);
  }
  return values;
}
