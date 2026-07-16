import axios from "axios";

export interface Neko {
  url: string;
  anime: string;
}

export async function neko(endpoint: string): Promise<Neko | null> {
  try {
    const { data } = await axios.get<{ results?: { url: string; anime_name: string }[] }>(
      `https://nekos.best/api/v2/${endpoint}`,
      { headers: { "User-Agent": "june/1.0 (https://june.rocks)" }, timeout: 5_000 },
    );
    const result = data.results?.[0];
    return result ? { url: result.url, anime: result.anime_name } : null;
  } catch {
    return null;
  }
}
