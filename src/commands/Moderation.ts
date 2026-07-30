import {
  BitwisePermissionFlags,
  type Channel,
  type Member,
  type Role,
  type User,
} from "discordeno";
import type { DiscordBot } from "../core/Discord.ts";
import { UserError } from "./Errors.ts";
export interface ModOptions {
  reason?: string;
  deleteDays?: number;
}
export class Moderation {
  public constructor(
    private readonly bot: DiscordBot,
    private readonly guildId: bigint | undefined,
    private readonly actor: User,
  ) {}
  public async ban(user: User, options: ModOptions = {}): Promise<void> {
    const days = options.deleteDays ?? 0;
    if (!Number.isInteger(days) || days < 0 || days > 7)
      throw new UserError("Message deletion must be between 0 and 7 days.");
    await this.checkedMember(user, "ban", BitwisePermissionFlags.BAN_MEMBERS);
    await this.bot.helpers.banMember(
      this.guild(),
      user.id,
      { deleteMessageSeconds: days * 86_400 },
      this.reason(options),
    );
  }
  public async softban(user: User, options: ModOptions = {}): Promise<void> {
    await this.ban(user, options);
    await this.bot.helpers.unbanMember(
      this.guild(),
      user.id,
      this.reason(options),
    );
  }
  public async kick(user: User, options: ModOptions = {}): Promise<void> {
    await this.checkedMember(user, "kick", BitwisePermissionFlags.KICK_MEMBERS);
    await this.bot.helpers.kickMember(
      this.guild(),
      user.id,
      this.reason(options),
    );
  }
  public async timeout(
    user: User,
    duration: number,
    options: ModOptions = {},
  ): Promise<void> {
    if (
      !Number.isInteger(duration) ||
      duration < 1_000 ||
      duration > 28 * 86_400_000
    )
      throw new UserError("Timeouts must be between 1 second and 28 days.");
    await this.checkedMember(
      user,
      "timeout",
      BitwisePermissionFlags.MODERATE_MEMBERS,
    );
    await this.bot.helpers.editMember(
      this.guild(),
      user.id,
      {
        communicationDisabledUntil: new Date(
          Date.now() + duration,
        ).toISOString(),
      },
      this.reason(options),
    );
  }
  public async untimeout(user: User, options: ModOptions = {}): Promise<void> {
    await this.bot.helpers.editMember(
      this.guild(),
      user.id,
      { communicationDisabledUntil: null },
      this.reason(options),
    );
  }
  public async unban(user: User, options: ModOptions = {}): Promise<void> {
    await this.bot.helpers.unbanMember(
      this.guild(),
      user.id,
      this.reason(options),
    );
  }
  public async nickname(
    user: User,
    name: string | null,
    options: ModOptions = {},
  ): Promise<void> {
    await this.checkedMember(
      user,
      "change the nickname of",
      BitwisePermissionFlags.MANAGE_NICKNAMES,
    );
    await this.bot.helpers.editMember(
      this.guild(),
      user.id,
      { nick: name },
      this.reason(options),
    );
  }
  public async role(
    user: User,
    role: Role,
    add: boolean,
    options: ModOptions = {},
  ): Promise<void> {
    const member = await this.checkedRole(
      user,
      role,
      add ? "give a role to" : "remove a role from",
    );
    const hasRole = member.roles.includes(role.id);
    if (add && hasRole)
      throw new UserError("That member already has that role.");
    if (!add && !hasRole)
      throw new UserError("That member does not have that role.");
    await this.bot.helpers[add ? "addRole" : "removeRole"](
      this.guild(),
      user.id,
      role.id,
      this.reason(options),
    );
  }
  public async toggleRole(
    user: User,
    role: Role,
    options: ModOptions = {},
  ): Promise<boolean> {
    const member = await this.member(user);
    const add = !member.roles.includes(role.id);
    await this.role(user, role, add, options);
    return add;
  }
  public async strip(user: User, options: ModOptions = {}): Promise<Role[]> {
    const member = await this.member(user);
    await Promise.all(
      member.roles.map((roleId) =>
        this.bot.helpers.removeRole(
          this.guild(),
          user.id,
          roleId,
          this.reason(options),
        ),
      ),
    );
    return [];
  }
  public async stripRole(
    role: Role,
    options: ModOptions = {},
  ): Promise<number> {
    const members = await this.bot.helpers.getMembers(this.guild(), {
      limit: 1_000,
    });
    const targets = members.filter((member) => member.roles.includes(role.id));
    await Promise.all(
      targets.map((member) =>
        this.bot.helpers.removeRole(
          this.guild(),
          member.id,
          role.id,
          this.reason(options),
        ),
      ),
    );
    return targets.length;
  }
  public check(
    user: User,
    action: string,
    permission: bigint,
  ): Promise<Member> {
    return this.checkedMember(user, action, permission);
  }
  public async disconnect(user: User, options: ModOptions = {}): Promise<void> {
    await this.bot.helpers.editMember(
      this.guild(),
      user.id,
      { channelId: null },
      this.reason(options),
    );
  }
  public async move(
    user: User,
    channel: Channel,
    options: ModOptions = {},
  ): Promise<void> {
    await this.bot.helpers.editMember(
      this.guild(),
      user.id,
      { channelId: channel.id },
      this.reason(options),
    );
  }
  public async deafen(
    user: User,
    value: boolean,
    options: ModOptions = {},
  ): Promise<void> {
    await this.bot.helpers.editMember(
      this.guild(),
      user.id,
      { deaf: value },
      this.reason(options),
    );
  }
  public async voiceMute(
    user: User,
    value: boolean,
    options: ModOptions = {},
  ): Promise<void> {
    await this.bot.helpers.editMember(
      this.guild(),
      user.id,
      { mute: value },
      this.reason(options),
    );
  }
  private guild(): bigint {
    if (!this.guildId)
      throw new UserError(
        "This moderation command can only be used in a server.",
      );
    return this.guildId;
  }
  private member(user: User): Promise<Member> {
    return this.bot.helpers.getMember(this.guild(), user.id).catch(() => {
      throw new UserError("That user is not a member of this server.");
    });
  }
  private async checkedMember(
    user: User,
    action: string,
    permission: bigint,
  ): Promise<Member> {
    const guildId = this.guild();
    if (user.id === this.actor.id)
      throw new UserError(`You cannot ${action} yourself.`);
    const [guild, target, actor, me, roles] = await Promise.all([
      this.bot.helpers.getGuild(guildId),
      this.member(user),
      this.bot.helpers.getMember(guildId, this.actor.id),
      this.bot.helpers.getMember(guildId, this.bot.id),
      this.bot.helpers.getRoles(guildId),
    ]);
    if (target.id === guild.ownerId)
      throw new UserError(`You cannot ${action} the server owner.`);
    if (
      !me.permissions ||
      (me.permissions.bitfield & permission) !== permission
    )
      throw new UserError(`I do not have permission to ${action} members.`);
    const position = (member: Member): number =>
      Math.max(
        0,
        ...member.roles.map(
          (id) => roles.find((role) => role.id === id)?.position ?? 0,
        ),
      );
    if (target.id === me.id || position(target) >= position(me))
      throw new UserError(
        `I cannot ${action} that member because of role hierarchy.`,
      );
    if (actor.id !== guild.ownerId && position(target) >= position(actor))
      throw new UserError(
        `You cannot ${action} that member because of role hierarchy.`,
      );
    return target;
  }
  private async checkedRole(
    user: User,
    role: Role,
    action: string,
  ): Promise<Member> {
    const guildId = this.guild();
    const [guild, target, actor, me, roles] = await Promise.all([
      this.bot.helpers.getGuild(guildId),
      this.member(user),
      this.bot.helpers.getMember(guildId, this.actor.id),
      this.bot.helpers.getMember(guildId, this.bot.id),
      this.bot.helpers.getRoles(guildId),
    ]);
    if (
      !me.permissions ||
      (me.permissions.bitfield & BitwisePermissionFlags.MANAGE_ROLES) !==
        BitwisePermissionFlags.MANAGE_ROLES
    )
      throw new UserError("I do not have permission to manage roles.");
    if (role.id === guildId)
      throw new UserError("The everyone role cannot be assigned or removed.");
    if (role.managed)
      throw new UserError("That role is managed by an integration.");

    const position = (member: Member): number =>
      Math.max(
        0,
        ...member.roles.map(
          (id) => roles.find((item) => item.id === id)?.position ?? 0,
        ),
      );
    if (role.position >= position(me))
      throw new UserError("That role is too high for me to manage.");
    if (actor.id !== guild.ownerId && role.position >= position(actor))
      throw new UserError("That role is too high for you to manage.");

    if (target.id !== actor.id) {
      if (target.id === guild.ownerId)
        throw new UserError(`You cannot ${action} the server owner.`);
      if (target.id === me.id || position(target) >= position(me))
        throw new UserError(
          `I cannot ${action} that member because of role hierarchy.`,
        );
      if (actor.id !== guild.ownerId && position(target) >= position(actor))
        throw new UserError(
          `You cannot ${action} that member because of role hierarchy.`,
        );
    }
    return target;
  }
  private reason(options: ModOptions): string {
    return (
      options.reason?.trim() || `Moderation action by ${this.actor.tag}`
    ).slice(0, 512);
  }
}
