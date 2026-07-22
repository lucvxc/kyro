import { button, cmd, container, thumb, time } from "../../../index.ts";

export default cmd({
  name: "serverinfo",
  description: "Show information about this server.",
  type: "message",
  aliases: ["server", "sinfo", "si"],
  syntax: "serverinfo",
  example: "serverinfo",
  context: "guild",
  run: async (ctx) => {
    const icon = ctx.guild!.stats.icon();
    const banner = ctx.guild!.stats.banner();
    const splash = ctx.guild!.stats.splash();

    const card = container()
      .accent(await ctx.guild!.stats.accent())
      .section(
        `## ${ctx.guild!.stats.name}${ctx.guild!.stats.vanity ? `\n${ctx.guild!.stats.vanity}` : ""}`,
        thumb(icon ?? "https://cdn.discordapp.com/embed/avatars/0.png"),
      )
      .separator()
      .text(
        `**${ctx.guild!.stats.members.toLocaleString()}** Members · **${ctx.guild!.stats.roles.toLocaleString()}** Roles · **${ctx.guild!.stats.channels.toLocaleString()}** Channels`,
      )
      .text(
        `**Owner** <@${ctx.guild!.stats.owner}>\n**Boosts** ${ctx.guild!.stats.boosts} (Tier ${ctx.guild!.stats.tier})\n**Emojis** ${ctx.guild!.stats.emojis} (${ctx.guild!.stats.animated} animated)\n**Stickers** ${ctx.guild!.stats.stickers}\n**Created** ${time(ctx.guild!.stats.created)}`,
      )
      .text(`-# ID ${ctx.guild!.stats.id}`)
      .row(
        button({
          label: "Icon",
          style: "link",
          url: icon ?? "https://discord.com",
          disabled: !icon,
        }),
        button({
          label: "Banner",
          style: "link",
          url: banner ?? "https://discord.com",
          disabled: !banner,
        }),
        button({
          label: "Splash",
          style: "link",
          url: splash ?? "https://discord.com",
          disabled: !splash,
        }),
      );

    if (banner)
      card.gallery({
        url: banner,
        description: `${ctx.guild!.stats.name}'s Banner`,
      });
    return ctx.reply(card);
  },
});
