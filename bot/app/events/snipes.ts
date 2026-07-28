import { evt } from "../../../index.ts";
import { saveDelete, saveEdit } from "../../features/snipe/store.ts";

export default [
  evt({
    name: "messageDelete",
    run: (message) => {
      if (
        !message.guild ||
        message.author?.bot ||
        (!message.content && !message.attachments.size)
      )
        return;
      saveDelete(message.channelId, {
        authorId: message.author!.id,
        avatar: message.author!.displayAvatarURL(),
        content: message.content ?? "",
        files: [...message.attachments.values()].map((file) => file.url),
        at: Date.now(),
      });
    },
  }),
  evt({
    name: "messageUpdate",
    run: (before, after) => {
      if (
        !after.guild ||
        after.author?.bot ||
        before.content === after.content ||
        !before.author
      )
        return;
      saveEdit(after.channelId, {
        authorId: before.author.id,
        avatar: before.author.displayAvatarURL(),
        before: before.content ?? "",
        after: after.content ?? "",
        at: Date.now(),
      });
    },
  }),
];
