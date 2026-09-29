import { create } from "zustand";
import { persist } from "zustand/middleware";
import { MusicItem, PresetTrack, TrackType } from "@/types/music";

export interface CurrentTrackState {
  url: string;
  title: string;
  author: string;
  type: TrackType;
  videoId: string | null;
  playlistId: string | null;
  thumbnail: string | null;
}

export type PlaybackMode = "single" | "playlist" | "library";

export const PRESET_TRACKS: PresetTrack[] = [
  {
    id: "preset-lofi-girl",
    name: "Lofi Girl Study",
    description: "Beats to relax/study to",
    url: "https://www.youtube.com/watch?v=rFZHOHl-L8A",
    type: "video",
    icon: "coffee",
  },
  {
    id: "preset-alpha-waves",
    name: "Deep Focus Waves",
    description: "Alpha waves for intense concentration",
    url: "https://www.youtube.com/watch?v=WPni755-Krg",
    type: "video",
    icon: "brain",
  },
  {
    id: "preset-chill-beats",
    name: "Chill & Unwind",
    description: "Mellow ambient study beats",
    url: "https://www.youtube.com/watch?v=KQhWhFZF-Qg",
    type: "video",
    icon: "moon",
  },
  {
    id: "preset-focus-playlist",
    name: "Lofi Focus Playlist",
    description: "Multi-track continuous study playlist",
    url: "https://www.youtube.com/playlist?list=PLFPg_IUxqnZNnACUGsfn50DySIOVSkiKI",
    type: "playlist",
    icon: "music",
  },
];

const DEFAULT_TRACK: CurrentTrackState = {
  url: PRESET_TRACKS[0].url,
  title: "Lofi Hip Hop Radio 📚 beats to relax/study to",
  author: "Lofi Girl",
  type: "video",
  videoId: "rFZHOHl-L8A",
  playlistId: null,
  thumbnail: "https://img.youtube.com/vi/rFZHOHl-L8A/hqdefault.jpg",
};

interface MusicStoreState {
  currentTrack: CurrentTrackState;
  isPlaying: boolean;
  isBuffering: boolean;
  volume: number;
  isMuted: boolean;
  showVideo: boolean;
  playlistIndex: number;
  playlistTotal: number;
  savedTracks: MusicItem[];
  presets: PresetTrack[];

  // Library Queue Playback
  playbackMode: PlaybackMode;
  libraryIndex: number;
  isLibraryLoop: boolean;
  isLibraryShuffle: boolean;

  // Actions
  setCurrentTrack: (track: Partial<CurrentTrackState>) => void;
  updateMetadata: (meta: { title?: string; author?: string; thumbnail?: string; videoId?: string }) => void;
  setIsPlaying: (playing: boolean) => void;
  setIsBuffering: (buffering: boolean) => void;
  setVolume: (volume: number) => void;
  setIsMuted: (muted: boolean) => void;
  toggleMute: () => void;
  setShowVideo: (show: boolean) => void;
  toggleShowVideo: () => void;
  setPlaylistInfo: (index: number, total: number) => void;
  saveTrack: (track: Omit<MusicItem, "id" | "addedAt">) => void;
  removeSavedTrack: (id: string) => void;

  // Library Queue Actions
  setPlaybackMode: (mode: PlaybackMode) => void;
  playSavedLibrary: (startIndex?: number) => MusicItem | null;
  nextLibraryTrack: () => MusicItem | null;
  prevLibraryTrack: () => MusicItem | null;
  toggleLibraryLoop: () => void;
  toggleLibraryShuffle: () => void;
}

export const useMusicStore = create<MusicStoreState>()(
  persist(
    (set, get) => ({
      currentTrack: DEFAULT_TRACK,
      isPlaying: false,
      isBuffering: false,
      volume: 80,
      isMuted: false,
      showVideo: false,
      playlistIndex: 0,
      playlistTotal: 0,
      savedTracks: [],
      presets: PRESET_TRACKS,

      // Library Queue State
      playbackMode: "single",
      libraryIndex: 0,
      isLibraryLoop: true,
      isLibraryShuffle: false,

      setCurrentTrack: (track) =>
        set((s) => ({
          currentTrack: { ...s.currentTrack, ...track },
          playlistIndex: 0,
          playbackMode: track.type?.includes("playlist") ? "playlist" : "single",
        })),

      updateMetadata: ({ title, author, thumbnail, videoId }) =>
        set((s) => ({
          currentTrack: {
            ...s.currentTrack,
            title: title !== undefined && title.trim() !== "" ? title : s.currentTrack.title,
            author: author !== undefined && author.trim() !== "" ? author : s.currentTrack.author,
            thumbnail: thumbnail || (videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : s.currentTrack.thumbnail),
            videoId: videoId || s.currentTrack.videoId,
          },
        })),

      setIsPlaying: (isPlaying) => set({ isPlaying }),
      setIsBuffering: (isBuffering) => set({ isBuffering }),
      setVolume: (volume) => set({ volume: Math.max(0, Math.min(100, volume)) }),
      setIsMuted: (isMuted) => set({ isMuted }),
      toggleMute: () => set((s) => ({ isMuted: !s.isMuted })),
      setShowVideo: (showVideo) => set({ showVideo }),
      toggleShowVideo: () => set((s) => ({ showVideo: !s.showVideo })),
      setPlaylistInfo: (playlistIndex, playlistTotal) => set({ playlistIndex, playlistTotal }),

      saveTrack: (trackData) =>
        set((s) => {
          const exists = s.savedTracks.some((t) => t.url === trackData.url);
          if (exists) return s;
          const newItem: MusicItem = {
            ...trackData,
            id: `track-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            addedAt: Date.now(),
          };
          return { savedTracks: [newItem, ...s.savedTracks] };
        }),

      removeSavedTrack: (id) =>
        set((s) => {
          const newTracks = s.savedTracks.filter((t) => t.id !== id);
          let newIndex = s.libraryIndex;
          if (newIndex >= newTracks.length) {
            newIndex = Math.max(0, newTracks.length - 1);
          }
          return { savedTracks: newTracks, libraryIndex: newIndex };
        }),

      setPlaybackMode: (playbackMode) => set({ playbackMode }),

      toggleLibraryLoop: () => set((s) => ({ isLibraryLoop: !s.isLibraryLoop })),
      toggleLibraryShuffle: () => set((s) => ({ isLibraryShuffle: !s.isLibraryShuffle })),

      playSavedLibrary: (startIndex = 0) => {
        const { savedTracks } = get();
        if (savedTracks.length === 0) return null;
        const validIndex = Math.max(0, Math.min(startIndex, savedTracks.length - 1));
        const target = savedTracks[validIndex];

        set({
          playbackMode: "library",
          libraryIndex: validIndex,
          currentTrack: {
            url: target.url,
            title: target.title,
            author: target.author || "Saved Music",
            type: target.type,
            videoId: target.videoId || null,
            playlistId: target.playlistId || null,
            thumbnail: target.thumbnail || null,
          },
        });
        return target;
      },

      nextLibraryTrack: () => {
        const { savedTracks, libraryIndex, isLibraryLoop, isLibraryShuffle } = get();
        if (savedTracks.length === 0) return null;

        let nextIdx = libraryIndex;
        if (isLibraryShuffle && savedTracks.length > 1) {
          do {
            nextIdx = Math.floor(Math.random() * savedTracks.length);
          } while (nextIdx === libraryIndex);
        } else {
          if (libraryIndex < savedTracks.length - 1) {
            nextIdx = libraryIndex + 1;
          } else if (isLibraryLoop) {
            nextIdx = 0;
          } else {
            return null;
          }
        }

        const nextTrack = savedTracks[nextIdx];
        set({
          libraryIndex: nextIdx,
          currentTrack: {
            url: nextTrack.url,
            title: nextTrack.title,
            author: nextTrack.author || "Saved Music",
            type: nextTrack.type,
            videoId: nextTrack.videoId || null,
            playlistId: nextTrack.playlistId || null,
            thumbnail: nextTrack.thumbnail || null,
          },
        });
        return nextTrack;
      },

      prevLibraryTrack: () => {
        const { savedTracks, libraryIndex, isLibraryLoop } = get();
        if (savedTracks.length === 0) return null;

        let prevIdx = libraryIndex;
        if (libraryIndex > 0) {
          prevIdx = libraryIndex - 1;
        } else if (isLibraryLoop) {
          prevIdx = savedTracks.length - 1;
        } else {
          return null;
        }

        const prevTrack = savedTracks[prevIdx];
        set({
          libraryIndex: prevIdx,
          currentTrack: {
            url: prevTrack.url,
            title: prevTrack.title,
            author: prevTrack.author || "Saved Music",
            type: prevTrack.type,
            videoId: prevTrack.videoId || null,
            playlistId: prevTrack.playlistId || null,
            thumbnail: prevTrack.thumbnail || null,
          },
        });
        return prevTrack;
      },
    }),
    {
      name: "cortitick-focus-music-v4",
      partialize: (state) => ({
        volume: state.volume,
        isMuted: state.isMuted,
        showVideo: state.showVideo,
        savedTracks: state.savedTracks,
        currentTrack: state.currentTrack,
        isLibraryLoop: state.isLibraryLoop,
        isLibraryShuffle: state.isLibraryShuffle,
        playbackMode: state.playbackMode,
        libraryIndex: state.libraryIndex,
      }),
    }
  )
);
