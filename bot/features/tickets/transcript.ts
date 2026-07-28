import type { Message, TextChannel } from "discord.js";

export async function transcript(channel: TextChannel) {
  const messages: Message[] = [];
  let before: string | undefined;
  while (messages.length < 10_000) {
    const batch = await channel.messages.fetch({ limit: 100, before });
    if (!batch.size) break;
    messages.push(...batch.values());
    before = batch.last()!.id;
    if (batch.size < 100) break;
  }

  const rows = messages
    .reverse()
    .map((message) => {
      const files = [...message.attachments.values()]
        .map((file) => `<a href="${escape(file.url)}">${escape(file.name)}</a>`)
        .join(" ");
      return `<article><img src="${escape(message.author.displayAvatarURL({ extension: "png", size: 64 }))}"><div><header>${escape(message.author.tag)} <time>${message.createdAt.toISOString()}</time></header><p>${escape(message.cleanContent).replaceAll("\n", "<br>")}</p>${files ? `<footer>${files}</footer>` : ""}</div></article>`;
    })
    .join("\n");

  const html = `<!doctype html><html><head><meta charset="utf-8"><title>${escape(channel.name)}</title><style>body{background:#111;color:#ddd;font:14px system-ui;max-width:900px;margin:40px auto}article{display:flex;gap:12px;padding:12px;border-bottom:1px solid #292929}img{width:40px;height:40px;border-radius:50%}header{font-weight:600}time{color:#888;font-size:12px;margin-left:8px}p{margin:5px 0;white-space:normal}a{color:#8ab4f8}</style></head><body><h1>#${escape(channel.name)}</h1>${rows || "<p>No messages.</p>"}</body></html>`;
  return Buffer.from(html);
}

function escape(value: string) {
  return value.replace(
    /[&<>"']/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        char
      ]!,
  );
}
