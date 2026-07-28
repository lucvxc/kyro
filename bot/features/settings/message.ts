import { isEmbedFormat } from "../../shared/parser.ts";
import { savedEmbed } from "./embeds.ts";

export async function expandMessage(
  userId: string,
  input: string,
): Promise<string> {
  const value = input.trim();
  if (!value || isEmbedFormat(value) || value.includes(" ")) return value;
  return (await savedEmbed(userId, value, false))?.code ?? value;
}
