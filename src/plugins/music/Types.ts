export interface NodeOptions {
  host: string;
  port?: number;
  password: string;
  secure?: boolean;
  name?: string;
}

export interface MusicOptions {
  nodes: NodeOptions[];
  search?: string;
  resumeTimeout?: number;
  reconnectDelay?: number;
  leaveOnEmpty?: boolean;
  emptyTimeout?: number;
}

export interface TrackInfo {
  identifier: string;
  title: string;
  author: string;
  length: number;
  isSeekable: boolean;
  isStream: boolean;
  position: number;
  uri: string | null;
  artworkUrl: string | null;
  sourceName: string;
}

export interface Track {
  encoded: string;
  info: TrackInfo;
  pluginInfo?: Record<string, unknown>;
  userData?: Record<string, unknown>;
  requester?: string;
}

export type Loop = "off" | "track" | "queue";

export interface AddedTracks {
  tracks: Track[];
  playlist?: string;
  started: boolean;
}

export interface PlayerState {
  time: number;
  position: number;
  connected: boolean;
  ping: number;
}

export interface MusicEvents {
  ready: [node: string];
  trackStart: [guildID: string, track: Track];
  trackEnd: [guildID: string, track: Track, reason: string];
  trackError: [guildID: string, track: Track | null, error: unknown];
  empty: [guildID: string];
}
