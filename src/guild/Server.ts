import {
  OverwriteTypes,
  type Channel,
  type CreateGuildChannel,
  type Member,
  type Message,
  type ModifyChannel,
  type PermissionStrings,
  type Role,
  type User,
} from "discordeno";
import type { DiscordBot } from "../core/Discord.ts";
import { UserError } from "../commands/Errors.ts";
import { BotProfile } from "./BotProfile.ts";
type Target = User | string | bigint;
const idOf = (target: Target): bigint =>
  typeof target === "object"
    ? target.id
    : typeof target === "bigint"
      ? target
      : BigInt(target.replace(/\D/g, ""));

export class Server {
  public readonly roles: Roles;
  public readonly members: Members;
  public readonly channels: Channels;
  public readonly threads: Threads;
  public readonly permissions: Permissions;
  public readonly settings: Settings;
  public readonly profile: BotProfile;
  public constructor(
    public readonly bot: DiscordBot,
    public readonly guildId: bigint,
  ) {
    this.roles = new Roles(bot, guildId);
    this.members = new Members(bot, guildId);
    this.channels = new Channels(bot, guildId);
    this.threads = new Threads(bot);
    this.permissions = new Permissions(bot, guildId);
    this.settings = new Settings(bot, guildId);
    this.profile = new BotProfile(bot, guildId);
  }
}
export class Roles {
  public constructor(
    private readonly bot: DiscordBot,
    private readonly guildId: bigint,
  ) {}
  public add(
    target: Target,
    role: Role | string | bigint,
    reason?: string,
  ): Promise<void> {
    return this.bot.helpers.addRole(
      this.guildId,
      idOf(target),
      typeof role === "object"
        ? role.id
        : BigInt(String(role).replace(/\D/g, "")),
      reason,
    );
  }
  public remove(
    target: Target,
    role: Role | string | bigint,
    reason?: string,
  ): Promise<void> {
    return this.bot.helpers.removeRole(
      this.guildId,
      idOf(target),
      typeof role === "object"
        ? role.id
        : BigInt(String(role).replace(/\D/g, "")),
      reason,
    );
  }
  public create(name: string, color?: number, reason?: string): Promise<Role> {
    return this.bot.helpers.createRole(this.guildId, { name, color }, reason);
  }
  public async snapshot(target: Target): Promise<string[]> {
    return (
      await this.bot.helpers.getMember(this.guildId, idOf(target))
    ).roles.map(String);
  }
  public async restore(
    target: Target,
    roles: readonly string[],
    reason?: string,
  ): Promise<void> {
    const member = await this.bot.helpers.getMember(this.guildId, idOf(target));
    const desired = roles.map(BigInt);
    await Promise.all([
      ...member.roles
        .filter((id) => !desired.includes(id))
        .map((id) =>
          this.bot.helpers.removeRole(this.guildId, member.id, id, reason),
        ),
      ...desired
        .filter((id) => !member.roles.includes(id))
        .map((id) =>
          this.bot.helpers.addRole(this.guildId, member.id, id, reason),
        ),
    ]);
  }
}
export class Members {
  public constructor(
    private readonly bot: DiscordBot,
    private readonly guildId: bigint,
  ) {}
  public get(target: Target): Promise<Member> {
    return this.bot.helpers.getMember(this.guildId, idOf(target)).catch(() => {
      throw new UserError("That user is not in this server.");
    });
  }
  public async nickname(
    target: Target,
    value: string | null,
    reason?: string,
  ): Promise<void> {
    await this.bot.helpers.editMember(
      this.guildId,
      idOf(target),
      { nick: value },
      reason,
    );
  }
  public async timeout(
    target: Target,
    duration: number | null,
    reason?: string,
  ): Promise<void> {
    await this.bot.helpers.editMember(
      this.guildId,
      idOf(target),
      {
        communicationDisabledUntil:
          duration === null
            ? null
            : new Date(Date.now() + duration).toISOString(),
      },
      reason,
    );
  }
}
export class Channels {
  public constructor(
    private readonly bot: DiscordBot,
    private readonly guildId: bigint,
  ) {}
  public create(
    name: string,
    type: CreateGuildChannel["type"],
    reason?: string,
  ): Promise<Channel> {
    return this.bot.helpers.createChannel(this.guildId, { name, type }, reason);
  }
  public delete(channel: Channel, reason?: string): Promise<void> {
    return this.bot.helpers.deleteChannel(channel.id, reason);
  }
  public lock(channel: Channel, reason?: string): Promise<void> {
    return this.overwrite(channel, ["SEND_MESSAGES"], [], reason);
  }
  public unlock(channel: Channel, reason?: string): Promise<void> {
    return this.bot.helpers.deleteChannelPermissionOverride(
      channel.id,
      this.guildId,
      reason,
    );
  }
  public hide(channel: Channel, reason?: string): Promise<void> {
    return this.overwrite(channel, ["VIEW_CHANNEL"], [], reason);
  }
  public show(channel: Channel, reason?: string): Promise<void> {
    return this.bot.helpers.deleteChannelPermissionOverride(
      channel.id,
      this.guildId,
      reason,
    );
  }
  public async slowmode(
    channel: Channel,
    seconds: number,
    reason?: string,
  ): Promise<void> {
    await this.bot.helpers.editChannel(
      channel.id,
      { rateLimitPerUser: seconds },
      reason,
    );
  }
  public async purge(
    channel: Channel,
    count = 100,
    userID?: string,
    reason?: string,
  ): Promise<number> {
    const messages = await this.bot.helpers.getMessages(channel.id, {
      limit: Math.min(count, 100),
    });
    const selected = messages.filter(
      (message) => !userID || message.author.id === BigInt(userID),
    );
    if (selected.length > 1)
      await this.bot.helpers.deleteMessages(
        channel.id,
        selected.map((message) => message.id),
        reason,
      );
    else if (selected[0])
      await this.bot.helpers.deleteMessage(channel.id, selected[0].id, reason);
    return selected.length;
  }
  public async nuke(channel: Channel, reason?: string): Promise<Channel> {
    const replacement = await this.bot.helpers.createChannel(
      this.guildId,
      {
        name: channel.name ?? "channel",
        type: channel.type,
        parentId: channel.parentId,
      },
      reason,
    );
    await this.bot.helpers.deleteChannel(channel.id, reason);
    return replacement;
  }
  public clean(
    channel: Channel,
    kind: "bots" | "links" | "images" | "embeds" | "files",
    count = 100,
    reason?: string,
  ): Promise<number> {
    return this.cleanMatching(channel, kind, count, reason);
  }
  public lockAll(reason?: string): Promise<number> {
    return this.all((channel) => this.lock(channel, reason));
  }
  public unlockAll(reason?: string): Promise<number> {
    return this.all((channel) => this.unlock(channel, reason));
  }
  public hideAll(reason?: string): Promise<number> {
    return this.all((channel) => this.hide(channel, reason));
  }
  public showAll(reason?: string): Promise<number> {
    return this.all((channel) => this.show(channel, reason));
  }
  private async cleanMatching(
    channel: Channel,
    kind: "bots" | "links" | "images" | "embeds" | "files",
    count: number,
    reason?: string,
  ): Promise<number> {
    const messages = await this.bot.helpers.getMessages(channel.id, {
      limit: Math.min(Math.max(Math.floor(count), 1), 100),
    });
    const selected = messages.filter(
      (message) =>
        ({
          bots: message.author.bot,
          links: /https?:\/\/\S+/i.test(message.content),
          images: (message.attachments ?? []).some((file) =>
            file.contentType?.startsWith("image/"),
          ),
          embeds: Boolean(message.embeds?.length),
          files: Boolean(message.attachments?.length),
        })[kind],
    );
    if (selected.length > 1)
      await this.bot.helpers.deleteMessages(
        channel.id,
        selected.map((message) => message.id),
        reason,
      );
    else if (selected[0])
      await this.bot.helpers.deleteMessage(channel.id, selected[0].id, reason);
    return selected.length;
  }
  private async all(run: (channel: Channel) => Promise<void>): Promise<number> {
    const channels = await this.bot.helpers.getChannels(this.guildId);
    await Promise.all(channels.map(run));
    return channels.length;
  }
  private overwrite(
    channel: Channel,
    deny: PermissionStrings[],
    allow: PermissionStrings[],
    reason?: string,
  ): Promise<void> {
    return this.bot.helpers.editChannelPermissionOverrides(
      channel.id,
      { id: this.guildId, type: OverwriteTypes.Role, deny, allow },
      reason,
    );
  }
}
export class Threads {
  public constructor(private readonly bot: DiscordBot) {}
  public create(
    message: Message,
    name: string,
    reason?: string,
  ): Promise<Channel> {
    return this.bot.helpers.startThreadWithMessage(
      message.channelId,
      message.id,
      { name, autoArchiveDuration: 1440 },
      reason,
    );
  }
  public async archive(
    thread: Channel,
    value = true,
    reason?: string,
  ): Promise<void> {
    await this.edit(thread, { archived: value }, reason);
  }
  public async lock(
    thread: Channel,
    value = true,
    reason?: string,
  ): Promise<void> {
    await this.edit(thread, { locked: value }, reason);
  }
  public async name(
    thread: Channel,
    value: string,
    reason?: string,
  ): Promise<void> {
    await this.edit(thread, { name: value }, reason);
  }
  public async slowmode(
    thread: Channel,
    seconds: number,
    reason?: string,
  ): Promise<void> {
    await this.edit(thread, { rateLimitPerUser: seconds }, reason);
  }
  private async edit(
    thread: Channel,
    options: ModifyChannel,
    reason?: string,
  ): Promise<void> {
    await this.bot.helpers.editChannel(thread.id, options, reason);
  }
}
export class Permissions {
  public constructor(
    private readonly botClient?: DiscordBot,
    private readonly guildId?: bigint,
  ) {}
  public async bot(permission: PermissionStrings): Promise<boolean> {
    if (!this.botClient || !this.guildId) return false;
    const member = await this.botClient.helpers.getMember(
      this.guildId,
      this.botClient.id,
    );
    return member.permissions?.has(permission) ?? false;
  }
  public member(member: Member, permission: PermissionStrings): boolean {
    return member.permissions?.has(permission) ?? false;
  }
}
export class Settings {
  public constructor(
    private readonly bot: DiscordBot,
    private readonly guildId: bigint,
  ) {}
  public name(value: string, reason?: string) {
    return this.bot.helpers.editGuild(this.guildId, { name: value }, reason);
  }
  public icon(value: string | null, reason?: string) {
    return this.bot.helpers.editGuild(this.guildId, { icon: value }, reason);
  }
}
