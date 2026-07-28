import { cmp, UserError } from "../../../index.ts";
import { panel } from "../../features/roles/buttonpanels.ts";
import embeds from "../../shared/config/embeds.ts";

export default cmp({
  id: /^br:[a-z0-9]{8}:\d{17,20}$/,
  context: "guild",
  run: async (ctx) => {
    const [, panelId, roleId] = ctx.id.split(":");
    const current = await panel(ctx.guild!.id, panelId!);
    const item = current.roles.find((value) => value.roleId === roleId);
    const role = item ? ctx.guild!.roles.cache.get(item.roleId) : null;
    if (!item || !role)
      throw new UserError("That role is no longer available.");

    const member = await ctx.guild!.members.fetch(ctx.user.id);
    const me = ctx.guild!.members.me ?? (await ctx.guild!.members.fetchMe());
    if (role.managed || me.roles.highest.comparePositionTo(role) <= 0)
      throw new UserError("I can no longer manage that role.");

    if (member.roles.cache.has(role.id)) {
      await member.roles.remove(role, "Button role removed");
      return ctx.private(`Removed **${role.name}**.`);
    }

    if (current.mode === "single") {
      const remove = current.roles
        .map((value) => value.roleId)
        .filter((id) => id !== role.id && member.roles.cache.has(id));
      if (remove.length)
        await member.roles.remove(remove, "Button role selection changed");
    }

    await member.roles.add(role, "Button role selected");
    return ctx.private(`Added **${role.name}**.`);
  },
  error: async (error, ctx) => {
    const msg =
      error instanceof Error ? error.message : "I could not update that role.";
    if (!ctx.interaction.replied && !ctx.interaction.deferred)
      await ctx.private(embeds.warning(msg));
  },
});
