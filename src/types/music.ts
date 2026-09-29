export type TrackType = "video" | "playlist" | "playlist_with_video";

export interface YouTubeParsed {
  type: TrackType;
  videoId: string | null;
  playlistId: string | null;
  originalUrl: string;
}

export interface MusicItem {
  id: string;
  url: string;
  title: string;
  author?: string;
  type: TrackType;
  videoId?: string | null;
  playlistId?: string | null;
  thumbnail?: string | null;
  addedAt: number;
}

export interface PresetTrack {
  id: string;
  name: string;
  description: string;
  url: string;
  type: TrackType;
  icon: string;
}
