import { type Manager, type SearchResult, type Track as MoonTrack } from "moonlink.js";

const aliases: Record<string, string> = {
  ytmsearch: "youtubemusic",
  ytsearch: "youtube",
  scsearch: "soundcloud",
};

export class Search {
  readonly #manager: Manager;
  readonly #source: string;

  public constructor(manager: Manager, source = "ytmsearch") {
    this.#manager = manager;
    const name = source.replace(/:$/, "").toLowerCase();
    this.#source = aliases[name] ?? name;
  }

  public async find(query: string, requester?: string): Promise<SearchResult | null> {
    const value = clean(query);
    if (/^https?:\/\//i.test(value) || /^\w+:/i.test(value)) return this.#run(value, requester);

    const sources = [...new Set(["spsearch", this.#source, "youtubemusic", "youtube", "soundcloud"])];
    for (const source of sources) {
      const result = await this.#run(value, requester, source);
      if (result) return result;
    }
    return null;
  }

  public async playable(value: MoonTrack, requester?: string): Promise<MoonTrack | null> {
    if (value.sourceName?.toLowerCase() !== "spotify") return value;

    const query = `${value.title} ${value.author}`.trim();
    let best: { track: MoonTrack; score: number } | undefined;
    for (const source of ["youtubemusic", "youtube", "soundcloud"]) {
      const result = await this.#run(query, requester, source);
      if (!result) continue;
      for (const candidate of result.tracks.slice(0, 8)) {
        const score = match(candidate, value);
        if (!best || score > best.score) best = { track: candidate, score };
      }
    }
    if (!best || best.score < 0.55) return null;

    best.track.title = value.title;
    best.track.author = value.author;
    best.track.uri = value.uri;
    best.track.artworkUrl = value.artworkUrl ?? best.track.artworkUrl;
    return best.track;
  }

  async #run(query: string, requester?: string, source?: string): Promise<SearchResult | null> {
    const result = await this.#manager.search({ query, source, requester }).catch(() => null) as SearchResult | null;
    return result && !result.isEmpty && !result.isError && result.tracks.length ? result : null;
  }
}

function clean(value: string): string {
  return value.trim().replace(/^\[.+?\]\((https?:\/\/[^)\s]+)\)$/i, "$1");
}

function match(candidate: MoonTrack, target: MoonTrack): number {
  return overlap(candidate.title, target.title) * 0.75 + overlap(candidate.author, target.author) * 0.25;
}

function overlap(source: string, target: string): number {
  const available = new Set(words(source));
  const wanted = words(target);
  return wanted.length ? wanted.filter(word => available.has(word)).length / wanted.length : 0;
}

function words(value: string): string[] {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\b(official|music|video|audio|visualizer|lyrics?|remaster(?:ed)?|explicit|clean)\b/gi, " ")
    .replace(/[^a-z0-9\s]/gi, " ")
    .toLowerCase()
    .split(/\s+/)
    .filter(word => word.length > 1);
}
