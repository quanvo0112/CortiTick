import { YouTubeParsed } from "@/types/music";

/**
 * Parses any YouTube URL (standard, youtu.be, shorts, music.youtube, embed, playlist)
 * Returns videoId, playlistId, and inferred type.
 */
export function parseYouTubeUrl(input: string): YouTubeParsed | null {
  if (!input || typeof input !== "string") return null;
  const raw = input.trim();

  let playlistId: string | null = null;
  let videoId: string | null = null;

  // 1. Playlist ID regex
  const listMatch = raw.match(/[?&]list=([a-zA-Z0-9_-]+)/i);
  if (listMatch) {
    playlistId = listMatch[1];
  } else if (/^(PL|RD|UU|FL)[a-zA-Z0-9_-]+$/i.test(raw)) {
    playlistId = raw;
  }

  // 2. Video ID regex
  const videoMatch = raw.match(
    /(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/i
  );
  if (videoMatch) {
    videoId = videoMatch[1];
  } else if (/^[\w-]{11}$/.test(raw) && !playlistId) {
    videoId = raw;
  }

  if (!videoId && !playlistId) {
    return null;
  }

  if (playlistId && videoId) {
    return {
      type: "playlist_with_video",
      videoId,
      playlistId,
      originalUrl: raw,
    };
  }

  if (playlistId) {
    return {
      type: "playlist",
      videoId: null,
      playlistId,
      originalUrl: raw,
    };
  }

  return {
    type: "video",
    videoId: videoId!,
    playlistId: null,
    originalUrl: raw,
  };
}

/**
 * Fetches title and metadata via noembed.com (CORS friendly public oEmbed provider for YouTube)
 */
export async function fetchYouTubeMetadata(url: string): Promise<{
  title?: string;
  author?: string;
  thumbnail?: string;
} | null> {
  try {
    const res = await fetch(`https://noembed.com/embed?url=${encodeURIComponent(url)}`, {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return {
      title: data.title || undefined,
      author: data.author_name || undefined,
      thumbnail: data.thumbnail_url || undefined,
    };
  } catch {
    return null;
  }
}

/**
 * Returns thumbnail image URL for a video ID
 */
export function getThumbnailUrl(videoId?: string | null): string {
  if (!videoId) return "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=400&q=80";
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}

/**
 * Dynamic loader for YouTube IFrame Player API
 */
let ytApiPromise: Promise<any> | null = null;

export function loadYouTubeIframeApi(): Promise<any> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Window is not available"));
  }

  // Already loaded
  if ((window as any).YT && (window as any).YT.Player) {
    return Promise.resolve((window as any).YT);
  }

  if (ytApiPromise) {
    return ytApiPromise;
  }

  ytApiPromise = new Promise((resolve) => {
    const prevReady = (window as any).onYouTubeIframeAPIReady;
    (window as any).onYouTubeIframeAPIReady = () => {
      if (typeof prevReady === "function") prevReady();
      resolve((window as any).YT);
    };

    if (!document.getElementById("youtube-iframe-api-script")) {
      const tag = document.createElement("script");
      tag.id = "youtube-iframe-api-script";
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName("script")[0];
      if (firstScriptTag && firstScriptTag.parentNode) {
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
      } else {
        document.head.appendChild(tag);
      }
    }
  });

  return ytApiPromise;
}
