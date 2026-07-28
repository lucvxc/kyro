import { cmd, container, time } from "../../../../index.ts";
import { colors } from "../../../shared/config/constants.ts";

export default cmd({
  name: "channelinfo",
  description: "Show information about a channel.",
  type: "message",
  aliases: ["channel", "ci"],
  syntax: "channelinfo (#channel)",
  example: "channelinfo #general",
  context: "guild",
  args: {
    channel: { type: "channel", description: "The channel to look up" },
  },
  run: async (ctx) => {
    const channel = ctx.channelStats("channel");

    const card = container()
      .accent(colors.default)
      .text(`## #${channel.name}`)
      .text(channel.topic ? `> ${channel.topic}` : "-# No channel topic")
      .separator()
      .text(
        `**Type** ${channel.type}\n**Category** ${channel.parent ?? "None"}\n**Position** ${channel.position}\n**Created** ${time(channel.created)}`,
      )
      .text(`-# ID ${channel.id}`);

    return ctx.reply(card);
  },
});
