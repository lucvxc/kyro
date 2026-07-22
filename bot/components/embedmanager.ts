import { PermissionFlagsBits } from "discord.js";
import { button, cmp, container, modal, UserError } from "../../index.ts";
import {
  deleteEmbed,
  renderEmbed,
  savedEmbed,
  shareEmbed,
  updateEmbedCode,
  type SavedEmbed,
} from "../services/settings/embeds.ts";
import { colors } from "../utils/config/config.ts";

export default cmp({
  id: /^embed(?:mgr:\d+|share|preview|code|edit|editsave|back|delete|deleteconfirm):?[a-z0-9]*$/,
  context: "guild",
  permissions: [PermissionFlagsBits.ManageMessages],
  run: async (ctx) => {
    const [action, key] = ctx.id.split(":");

    if (action === "embedmgr") {
      if (ctx.user.id !== key)
        throw new UserError("That embed menu belongs to someone else.");
      const selected = ctx.values[0];
      if (!selected) throw new UserError("Select an embed to manage.");
      return ctx.private(details(await savedEmbed(ctx.user.id, selected)));
    }

    if (!key) throw new UserError("That saved embed is invalid.");
    if (action === "embedpreview") {
      const saved = await savedEmbed(ctx.user.id, key);
      const preview = renderEmbed(saved.code, ctx.guild!, ctx.user);
      if (preview.embeds?.[0]) {
        const { Embed } = await import("../../index.ts");
        return ctx.private(new Embed(preview.embeds[0]));
      }
      return ctx.private(
        preview.content || "This embed has no previewable content.",
      );
    }

    if (action === "embedshare") {
      const saved = await shareEmbed(ctx.user.id, key);
      return ctx.private(
        container()
          .accent(colors.success)
          .text(`## Share ${saved.name}`)
          .separator()
          .text(
            `**Share code**\n\`${saved.shareCode}\`\n\n-# Another user can save it with \`embed save ${saved.shareCode}\`.`,
          )
          .row(
            button({
              id: `embedback:${saved.id}`,
              label: "Back",
              style: "secondary",
            }),
          ),
      );
    }

    if (action === "embedcode") {
      return ctx.private(codeCard(await savedEmbed(ctx.user.id, key)));
    }

    if (action === "embededit") {
      const saved = await savedEmbed(ctx.user.id, key);
      return ctx.showModal(
        modal({
          id: `embededitsave:${saved.id}`,
          title: "Edit embed code",
          inputs: [
            {
              id: "code",
              label: "Embed code",
              style: "paragraph",
              value: saved.code.slice(0, 4_000),
              max: 4_000,
            },
          ],
        }),
      );
    }

    if (action === "embededitsave") {
      const code = ctx.field("code");
      if (!code) throw new UserError("Embed code cannot be empty.");
      return ctx.private(
        details(await updateEmbedCode(ctx.user.id, key, code)),
      );
    }

    if (action === "embedback") {
      return ctx.update(details(await savedEmbed(ctx.user.id, key)));
    }

    if (action === "embeddelete") {
      const saved = await savedEmbed(ctx.user.id, key);
      return ctx.update(
        container()
          .accent(colors.error)
          .text(`## Delete ${saved.name}?\nThis cannot be undone.`)
          .row(
            button({
              id: `embeddeleteconfirm:${saved.id}`,
              label: "Delete",
              style: "secondary",
            }),
            button({
              id: `embedback:${saved.id}`,
              label: "Back",
              style: "secondary",
            }),
          ),
      );
    }

    if (action === "embeddeleteconfirm") {
      const deleted = await deleteEmbed(ctx.user.id, key);
      if (!deleted) throw new UserError("That saved embed no longer exists.");
      return ctx.update(
        container()
          .accent(colors.error)
          .text(`## Embed deleted\n**${deleted.name}** has been removed.`),
      );
    }
  },
});

function details(saved: SavedEmbed) {
  return container()
    .accent(colors.default)
    .text(
      `## ${saved.name}\n-# ${saved.isPublic ? "Public" : "Private"} · \`${saved.id}\` · Saved ${date(saved.createdAt)}`,
    )
    .row(
      button({
        id: `embedshare:${saved.id}`,
        label: "Share",
        style: "secondary",
      }),
      button({
        id: `embedpreview:${saved.id}`,
        label: "Preview",
        style: "secondary",
      }),
      button({
        id: `embedcode:${saved.id}`,
        label: "Code",
        style: "secondary",
      }),
      button({
        id: `embeddelete:${saved.id}`,
        label: "Delete",
        style: "secondary",
      }),
    );
}

function codeCard(saved: SavedEmbed) {
  const code = saved.code.replace(/```/g, "`\u200B``");
  return container()
    .accent(colors.default)
    .text(`## ${saved.name} · Code`)
    .separator()
    .text(`\`\`\`\n${code}\n\`\`\``)
    .row(
      button({
        id: `embededit:${saved.id}`,
        label: "Edit",
        style: "secondary",
      }),
      button({
        id: `embedback:${saved.id}`,
        label: "Back",
        style: "secondary",
      }),
    );
}

function date(value: Date): string {
  return value.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
