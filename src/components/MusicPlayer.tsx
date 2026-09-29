"use client";

import { useEffect, useRef, useState } from "react";
import { useMusicStore, PRESET_TRACKS } from "@/store/useMusicStore";
import { parseYouTubeUrl, fetchYouTubeMetadata, getThumbnailUrl, loadYouTubeIframeApi } from "@/utils/youtube";
import { PresetTrack } from "@/types/music";

export function MusicPlayer() {
  const {
    currentTrack,
    isPlaying,
    isBuffering,
    volume,
    isMuted,
    showVideo,
    playlistIndex,
    playlistTotal,
    savedTracks,
    playbackMode,
    libraryIndex,
    isLibraryLoop,
    isLibraryShuffle,
    setCurrentTrack,
    updateMetadata,
    setIsPlaying,
    setIsBuffering,
    setVolume,
    toggleMute,
    toggleShowVideo,
    setPlaylistInfo,
    saveTrack,
    removeSavedTrack,
    playSavedLibrary,
    nextLibraryTrack,
    prevLibraryTrack,
    toggleLibraryLoop,
    toggleLibraryShuffle,
  } = useMusicStore();

  const [inputUrl, setInputUrl] = useState("");
  const [inputError, setInputError] = useState<string | null>(null);
  const [detectedType, setDetectedType] = useState<"video" | "playlist" | null>(null);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const playerRef = useRef<any>(null);
  const isInitializedRef = useRef(false);

  // URL format detection
  useEffect(() => {
    if (!inputUrl.trim()) {
      setDetectedType(null);
      setInputError(null);
      return;
    }
    const parsed = parseYouTubeUrl(inputUrl);
    if (parsed) {
      setDetectedType(parsed.type.includes("playlist") ? "playlist" : "video");
      setInputError(null);
    } else {
      setDetectedType(null);
    }
  }, [inputUrl]);

  // Sync volume with player
  useEffect(() => {
    if (playerRef.current && isPlayerReady) {
      try {
        if (isMuted) {
          playerRef.current.mute?.();
        } else {
          playerRef.current.unMute?.();
          playerRef.current.setVolume?.(volume);
        }
      } catch (e) {
        console.error("Volume sync error", e);
      }
    }
  }, [volume, isMuted, isPlayerReady]);

  // Pull video metadata from YouTube player
  const pullMetadataFromPlayer = () => {
    if (!playerRef.current) return;
    try {
      const data = playerRef.current.getVideoData?.();
      if (data && data.title && data.title.trim() !== "") {
        updateMetadata({
          title: data.title,
          author: data.author || "",
          videoId: data.video_id,
        });
      }
      const list = playerRef.current.getPlaylist?.();
      const idx = playerRef.current.getPlaylistIndex?.();
      if (Array.isArray(list) && list.length > 0) {
        setPlaylistInfo(typeof idx === "number" ? idx : 0, list.length);
      }
    } catch (e) {
      console.error("Pull metadata error", e);
    }
  };

  // Initialize YouTube Iframe Player
  useEffect(() => {
    let isCancelled = false;

    loadYouTubeIframeApi()
      .then((YT) => {
        if (isCancelled || isInitializedRef.current) return;
        isInitializedRef.current = true;

        const isPlaylist = currentTrack.type.includes("playlist") && !!currentTrack.playlistId;
        const playerOptions: any = {
          width: "100%",
          height: "100%",
          host: "https://www.youtube.com",
          playerVars: {
            autoplay: 0,
            controls: 1,
            modestbranding: 1,
            rel: 0,
            enablejsapi: 1,
            iv_load_policy: 3,
          },
          events: {
            onReady: (event: any) => {
              setIsPlayerReady(true);
              try {
                if (isMuted) {
                  event.target.mute();
                } else {
                  event.target.setVolume(volume);
                }
              } catch {}
              pullMetadataFromPlayer();
            },
            onStateChange: (event: any) => {
              setApiError(null);
              const state = event.data;
              if (state === YT.PlayerState.PLAYING) {
                setIsPlaying(true);
                setIsBuffering(false);
                pullMetadataFromPlayer();
                setTimeout(pullMetadataFromPlayer, 600);
                setTimeout(pullMetadataFromPlayer, 1500);
              } else if (state === YT.PlayerState.PAUSED) {
                setIsPlaying(false);
                setIsBuffering(false);
              } else if (state === YT.PlayerState.BUFFERING) {
                setIsBuffering(true);
                pullMetadataFromPlayer();
              } else if (state === YT.PlayerState.CUED) {
                pullMetadataFromPlayer();
              } else if (state === YT.PlayerState.ENDED) {
                setIsPlaying(false);

                // Auto-advance if playing the Saved Library queue
                const currentStore = useMusicStore.getState();
                if (currentStore.playbackMode === "library" && currentStore.savedTracks.length > 0) {
                  const nextTrack = currentStore.nextLibraryTrack();
                  if (nextTrack) {
                    if (nextTrack.type.includes("playlist") && nextTrack.playlistId) {
                      playerRef.current?.loadPlaylist?.({
                        list: nextTrack.playlistId,
                        listType: "playlist",
                        index: 0,
                      });
                    } else if (nextTrack.videoId) {
                      playerRef.current?.loadVideoById?.(nextTrack.videoId);
                    }
                    playerRef.current?.playVideo?.();
                    setIsPlaying(true);
                  }
                }
              }
            },
            onError: (event: any) => {
              setIsBuffering(false);
              setIsPlaying(false);
              if (event.data === 101 || event.data === 150) {
                setApiError("Video owner restricts embedding on external sites (Error 150). Try another link or open on YouTube.");
              } else if (event.data === 100 || event.data === 2) {
                setApiError("Video or playlist was not found or is private.");
              } else {
                setApiError("Unable to stream video from YouTube.");
              }
            },
          },
        };

        if (isPlaylist) {
          playerOptions.playerVars.listType = "playlist";
          playerOptions.playerVars.list = currentTrack.playlistId;
        } else {
          playerOptions.videoId = currentTrack.videoId || "jfKfPfyJRdk";
        }

        playerRef.current = new YT.Player("cortitick-yt-player-target", playerOptions);
      })
      .catch((err) => {
        console.error("Failed to load YouTube API", err);
      });

    return () => {
      isCancelled = true;
    };
  }, []);

  // Play a specific URL (video or playlist)
  const playUrl = async (url: string, shouldAutoplay = true) => {
    const parsed = parseYouTubeUrl(url);
    if (!parsed) {
      setInputError("Please enter a valid YouTube video or playlist URL");
      return;
    }

    setInputError(null);
    setApiError(null);

    const isPlaylist = parsed.type.includes("playlist");
    const newTrack = {
      url: parsed.originalUrl,
      title: isPlaylist ? "Loading playlist..." : "Loading YouTube track...",
      author: isPlaylist ? "YouTube Playlist" : "YouTube Audio",
      type: parsed.type,
      videoId: parsed.videoId,
      playlistId: parsed.playlistId,
      thumbnail: getThumbnailUrl(parsed.videoId),
    };

    setCurrentTrack(newTrack);

    fetchYouTubeMetadata(parsed.originalUrl).then((meta) => {
      if (meta) {
        updateMetadata({
          title: meta.title,
          author: meta.author,
          thumbnail: meta.thumbnail,
        });
      }
    });

    if (playerRef.current && isPlayerReady) {
      try {
        if (isPlaylist && parsed.playlistId) {
          playerRef.current.loadPlaylist({
            list: parsed.playlistId,
            listType: "playlist",
            index: 0,
          });
        } else if (parsed.videoId) {
          playerRef.current.loadVideoById(parsed.videoId);
        }

        if (shouldAutoplay) {
          playerRef.current.playVideo();
          setIsPlaying(true);
        }
      } catch (err) {
        console.error("Error loading track into YouTube player", err);
      }
    }
  };

  // Play a track from the Saved Library Queue
  const handlePlaySavedLibrary = (index: number) => {
    const target = playSavedLibrary(index);
    if (!target) return;

    setApiError(null);
    if (playerRef.current && isPlayerReady) {
      try {
        if (target.type.includes("playlist") && target.playlistId) {
          playerRef.current.loadPlaylist({
            list: target.playlistId,
            listType: "playlist",
            index: 0,
          });
        } else if (target.videoId) {
          playerRef.current.loadVideoById(target.videoId);
        }
        playerRef.current.playVideo();
        setIsPlaying(true);
      } catch (err) {
        console.error("Error playing library track", err);
      }
    }
  };

  // Next track in queue or playlist
  const handleNextTrack = () => {
    if (!playerRef.current || !isPlayerReady) return;
    if (playbackMode === "library") {
      const next = nextLibraryTrack();
      if (next) {
        if (next.type.includes("playlist") && next.playlistId) {
          playerRef.current.loadPlaylist({ list: next.playlistId, listType: "playlist", index: 0 });
        } else if (next.videoId) {
          playerRef.current.loadVideoById(next.videoId);
        }
        playerRef.current.playVideo();
        setIsPlaying(true);
      }
    } else {
      playerRef.current.nextVideo();
    }
    setTimeout(pullMetadataFromPlayer, 800);
  };

  // Previous track in queue or playlist
  const handlePreviousTrack = () => {
    if (!playerRef.current || !isPlayerReady) return;
    if (playbackMode === "library") {
      const prev = prevLibraryTrack();
      if (prev) {
        if (prev.type.includes("playlist") && prev.playlistId) {
          playerRef.current.loadPlaylist({ list: prev.playlistId, listType: "playlist", index: 0 });
        } else if (prev.videoId) {
          playerRef.current.loadVideoById(prev.videoId);
        }
        playerRef.current.playVideo();
        setIsPlaying(true);
      }
    } else {
      playerRef.current.previousVideo();
    }
    setTimeout(pullMetadataFromPlayer, 800);
  };

  // Handle Play / Pause button
  const handleTogglePlay = () => {
    if (!playerRef.current || !isPlayerReady) return;
    try {
      if (isPlaying) {
        playerRef.current.pauseVideo();
        setIsPlaying(false);
      } else {
        playerRef.current.playVideo();
        setIsPlaying(true);
      }
    } catch (e) {
      console.error("Toggle play error", e);
    }
  };

  // Submit URL form
  const handleSubmitUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputUrl.trim()) return;
    playUrl(inputUrl, true);
  };

  // Save track to library
  const handleSaveToLibrary = async () => {
    const targetUrl = inputUrl.trim() || currentTrack.url;
    const parsed = parseYouTubeUrl(targetUrl);
    if (!parsed) {
      setInputError("Invalid YouTube URL to bookmark");
      return;
    }

    let title = currentTrack.url === targetUrl ? currentTrack.title : "YouTube Audio";
    let author = currentTrack.url === targetUrl ? currentTrack.author : "YouTube";
    let thumbnail = currentTrack.url === targetUrl ? currentTrack.thumbnail : getThumbnailUrl(parsed.videoId);

    try {
      const meta = await fetchYouTubeMetadata(targetUrl);
      if (meta) {
        if (meta.title) title = meta.title;
        if (meta.author) author = meta.author;
        if (meta.thumbnail) thumbnail = meta.thumbnail;
      }
    } catch {}

    saveTrack({
      url: targetUrl,
      title,
      author,
      type: parsed.type,
      videoId: parsed.videoId,
      playlistId: parsed.playlistId,
      thumbnail,
    });

    setInputUrl("");
  };

  const isCurrentPlaylist = currentTrack.type.includes("playlist");
  const canGoNextOrPrev = playbackMode === "library" ? savedTracks.length > 1 : isCurrentPlaylist;

  return (
    <div className="flex flex-col gap-5">
      {/* Console Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center ct-btn text-amber-500 shadow-sm" style={{ background: "var(--ct-card-sub)" }}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold tracking-tight" style={{ color: "var(--ct-text)" }}>
                Focus Audio Deck
              </h2>
              {isPlaying && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-400 border border-amber-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                  Live
                </span>
              )}
            </div>
            <p className="text-xs" style={{ color: "var(--ct-muted)" }}>
              {playbackMode === "library"
                ? `Playing Saved Queue (${libraryIndex + 1} of ${savedTracks.length})`
                : isCurrentPlaylist
                ? "YouTube Continuous Playlist"
                : "Acoustic Focus Stream"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Toggle Video Screen */}
          <button
            onClick={toggleShowVideo}
            title={showVideo ? "Hide Video Window" : "Show Video Window"}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold ct-btn transition-colors"
            style={{ color: showVideo ? "var(--ct-work-accent)" : "var(--ct-muted)" }}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <rect x="2" y="3" width="20" height="14" rx="2" strokeWidth={1.8} />
              <line x1="8" y1="21" x2="16" y2="21" strokeWidth={1.8} />
              <line x1="12" y1="17" x2="12" y2="21" strokeWidth={1.8} />
            </svg>
            <span className="hidden sm:inline">{showVideo ? "Hide Video" : "Show Video"}</span>
          </button>

          {/* Toggle Library Drawer */}
          <button
            onClick={() => setIsLibraryOpen(!isLibraryOpen)}
            title="Saved Music Library"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold ct-btn transition-colors"
            style={{
              color: isLibraryOpen || playbackMode === "library" ? "var(--ct-work-accent)" : "var(--ct-muted)",
              borderColor: playbackMode === "library" ? "var(--ct-work-accent)" : "var(--ct-border)",
            }}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <span>Library ({savedTracks.length})</span>
          </button>
        </div>
      </div>

      {/* Video Container (Active in DOM, positioned cleanly) */}
      <div
        className={
          showVideo
            ? "relative w-full aspect-video rounded-2xl overflow-hidden border shadow-xl transition-all"
            : "absolute opacity-0 pointer-events-none w-[320px] h-[180px] -top-[9999px] left-0"
        }
        style={{ borderColor: "var(--ct-border)", background: "#000" }}
      >
        <div id="cortitick-yt-player-target" className="w-full h-full" />
      </div>

      {/* Error notification banner */}
      {apiError && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 flex-shrink-0 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{apiError}</span>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto flex-shrink-0">
            <a
              href={currentTrack.url}
              target="_blank"
              rel="noreferrer"
              className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-100 text-[11px] font-bold transition-colors"
            >
              Open on YouTube ↗
            </a>
            <button
              onClick={() => playUrl(PRESET_TRACKS[0].url, true)}
              className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[11px] font-bold transition-colors"
            >
              Play Lofi Girl
            </button>
            <button onClick={() => setApiError(null)} className="text-xs hover:text-white px-1">✕</button>
          </div>
        </div>
      )}

      {/* Hi-Fi Media Player Console Card */}
      <div
        className="rounded-2xl p-4.5 flex flex-col sm:flex-row items-center gap-4 transition-all"
        style={{
          background: "var(--ct-card-sub)",
          border: "1px solid var(--ct-border)",
        }}
      >
        {/* Album Artwork / Disc Visualizer */}
        <div className="relative w-20 h-20 sm:w-22 sm:h-22 rounded-2xl overflow-hidden flex-shrink-0 shadow-md group">
          <img
            src={currentTrack.thumbnail || getThumbnailUrl(currentTrack.videoId)}
            alt={currentTrack.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src =
                "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=400&q=80";
            }}
          />
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center">
            {isPlaying ? (
              <div className="flex items-end gap-1 h-5">
                <span className="w-1 bg-amber-400 rounded-full ct-eq-bar-1" />
                <span className="w-1 bg-orange-400 rounded-full ct-eq-bar-2" />
                <span className="w-1 bg-emerald-400 rounded-full ct-eq-bar-3" />
                <span className="w-1 bg-amber-400 rounded-full ct-eq-bar-4" />
              </div>
            ) : (
              <button
                onClick={handleTogglePlay}
                className="w-9 h-9 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center shadow-lg transition-transform hover:scale-110 active:scale-95"
              >
                <svg className="w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Track Title and Channel Metadata */}
        <div className="flex-1 min-w-0 flex flex-col justify-center text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-2 mb-1.5">
            {playbackMode === "library" ? (
              <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                Library Queue • Track {libraryIndex + 1} of {savedTracks.length}
              </span>
            ) : isCurrentPlaylist ? (
              <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">
                {playlistTotal > 0 ? `Playlist • Track ${playlistIndex + 1} of ${playlistTotal}` : "Playlist"}
              </span>
            ) : (
              <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-slate-500/15 text-slate-300 border border-slate-500/30">
                Single Track
              </span>
            )}

            {isBuffering && (
              <span className="text-[10px] text-amber-400 animate-pulse font-medium">Buffering…</span>
            )}
          </div>

          <h3
            id="focus-music-title"
            title={currentTrack.title}
            className="text-sm sm:text-base font-bold tracking-tight line-clamp-2 leading-snug"
            style={{ color: "var(--ct-text)" }}
          >
            {currentTrack.title}
          </h3>

          <p className="text-xs mt-1 truncate" style={{ color: "var(--ct-muted)" }}>
            {currentTrack.author || "YouTube Audio"}
          </p>
        </div>

        {/* Master Playback Controls */}
        <div className="flex flex-col items-center gap-2.5 flex-shrink-0">
          <div className="flex items-center gap-2">
            {/* Prev Track */}
            <button
              onClick={handlePreviousTrack}
              title={playbackMode === "library" ? "Previous track in library queue" : "Previous track in playlist"}
              disabled={!canGoNextOrPrev}
              className={`w-8 h-8 rounded-xl flex items-center justify-center ct-btn transition-transform ${
                !canGoNextOrPrev ? "opacity-30 cursor-not-allowed" : "hover:scale-105"
              }`}
              style={{ color: "var(--ct-text)" }}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
              </svg>
            </button>

            {/* Play / Pause Main Trigger */}
            <button
              id="focus-music-toggle"
              onClick={handleTogglePlay}
              className="w-11 h-11 rounded-2xl flex items-center justify-center text-slate-950 font-bold shadow-lg transition-transform hover:scale-105 active:scale-95 bg-amber-500 hover:bg-amber-400"
              title={isPlaying ? "Pause playback" : "Start playback"}
            >
              {isPlaying ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                </svg>
              ) : (
                <svg className="w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>

            {/* Next Track */}
            <button
              onClick={handleNextTrack}
              title={playbackMode === "library" ? "Next track in library queue" : "Next track in playlist"}
              disabled={!canGoNextOrPrev}
              className={`w-8 h-8 rounded-xl flex items-center justify-center ct-btn transition-transform ${
                !canGoNextOrPrev ? "opacity-30 cursor-not-allowed" : "hover:scale-105"
              }`}
              style={{ color: "var(--ct-text)" }}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
              </svg>
            </button>
          </div>

          {/* Volume Control */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={toggleMute}
              title={isMuted ? "Unmute" : "Mute"}
              className="w-6 h-6 flex items-center justify-center ct-icon-btn rounded-lg"
              style={{ color: "var(--ct-muted)" }}
            >
              {isMuted || volume === 0 ? (
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                </svg>
              ) : (
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                </svg>
              )}
            </button>
            <input
              type="range"
              min="0"
              max="100"
              value={isMuted ? 0 : volume}
              onChange={(e) => {
                const val = Number(e.target.value);
                setVolume(val);
                if (isMuted && val > 0) toggleMute();
              }}
              className="w-16 h-1 rounded-lg appearance-none cursor-pointer accent-amber-500"
              style={{ background: "var(--ct-border)" }}
              title={`Volume: ${isMuted ? 0 : volume}%`}
            />
          </div>
        </div>
      </div>

      {/* Input URL Form */}
      <form onSubmit={handleSubmitUrl} className="flex flex-col gap-1.5">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              id="focus-music-input"
              type="text"
              placeholder="Paste YouTube track or playlist link (https://...)"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              className="w-full rounded-xl pl-9 pr-8 py-2.5 text-xs sm:text-sm outline-none focus:ring-2 focus:ring-amber-500/50 transition-colors"
              style={{
                background: "var(--ct-input-bg)",
                border: "1px solid var(--ct-input-bd)",
                color: "var(--ct-text)",
              }}
            />
            <div className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--ct-muted)" }}>
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
            </div>
            {inputUrl && (
              <button
                type="button"
                onClick={() => setInputUrl("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs hover:text-white"
                style={{ color: "var(--ct-muted)" }}
              >
                ✕
              </button>
            )}
          </div>

          {/* Play Link Button */}
          <button
            id="focus-music-play-btn"
            type="submit"
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs sm:text-sm font-bold transition-all hover:scale-105 active:scale-95 flex items-center gap-1.5 shadow-sm"
          >
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
            <span>Play</span>
          </button>

          {/* Bookmark Button */}
          <button
            type="button"
            onClick={handleSaveToLibrary}
            title="Save to Library"
            className="px-3.5 py-2.5 rounded-xl ct-btn text-xs font-semibold flex items-center transition-all hover:scale-105"
            style={{ color: "var(--ct-text)" }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          </button>
        </div>

        {/* Input Feedback */}
        <div className="flex items-center justify-between text-xs px-1">
          {detectedType && (
            <span className="text-amber-400 font-medium flex items-center gap-1">
              ✓ Valid YouTube {detectedType === "playlist" ? "Playlist" : "Track"} link recognized
            </span>
          )}
          {inputError && <span className="text-red-400 font-medium">{inputError}</span>}
        </div>
      </form>

      {/* Quick Presets Row */}
      <div>
        <p className="text-xs font-bold uppercase tracking-wider mb-2.5" style={{ color: "var(--ct-muted)" }}>
          Curated Focus Presets
        </p>
        <div className="grid grid-cols-2 gap-2">
          {PRESET_TRACKS.map((preset: PresetTrack) => (
            <button
              key={preset.id}
              onClick={() => playUrl(preset.url, true)}
              className="flex items-center gap-2.5 p-2.5 rounded-xl ct-btn text-left transition-all hover:scale-[1.02]"
              style={{
                background: currentTrack.url === preset.url ? "var(--ct-active-bg)" : "var(--ct-input-bg)",
                borderColor: currentTrack.url === preset.url ? "var(--ct-work-accent)" : "var(--ct-input-bd)",
              }}
            >
              <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-amber-500/10 text-amber-500 flex-shrink-0">
                {preset.icon === "coffee" && (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M18 8h1a4 4 0 0 1 0 8h-1M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8zM6 1v3M10 1v3M14 1v3" />
                  </svg>
                )}
                {preset.icon === "brain" && (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 1 1 7.072 0l-.548.547A3.374 3.374 0 0 0 14 18.469V19a2 2 0 1 1-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                )}
                {preset.icon === "moon" && (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
                {preset.icon === "music" && (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z" />
                  </svg>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold truncate" style={{ color: "var(--ct-text)" }}>
                  {preset.name}
                </p>
                <p className="text-[10px] truncate" style={{ color: "var(--ct-muted)" }}>
                  {preset.type === "playlist" ? "Playlist" : "Livestream"}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ── Saved Focus Queue Drawer (Continuous Playback) ── */}
      {isLibraryOpen && (
        <div
          className="rounded-2xl p-4 border space-y-3 transition-all"
          style={{ background: "var(--ct-card)", borderColor: "var(--ct-border)" }}
        >
          {/* Library Header & Queue Operations */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b" style={{ borderColor: "var(--ct-border)" }}>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--ct-text)" }}>
                  Saved Focus Queue
                </h4>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 font-bold">
                  {savedTracks.length} items
                </span>
              </div>
              <p className="text-xs mt-0.5" style={{ color: "var(--ct-muted)" }}>
                Continuous auto-advance playlist across all saved items
              </p>
            </div>

            {/* Play All & Options */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Play All Queue Button */}
              <button
                onClick={() => handlePlaySavedLibrary(0)}
                disabled={savedTracks.length === 0}
                className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all hover:scale-105 active:scale-95"
              >
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
                <span>Play All Queue</span>
              </button>

              {/* Loop Toggle */}
              <button
                onClick={toggleLibraryLoop}
                title={isLibraryLoop ? "Queue Repeat: Enabled" : "Queue Repeat: Disabled"}
                className="p-1.5 rounded-lg ct-btn transition-colors"
                style={{
                  color: isLibraryLoop ? "var(--ct-work-accent)" : "var(--ct-muted)",
                  borderColor: isLibraryLoop ? "var(--ct-work-accent)" : "var(--ct-border)",
                }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>

              {/* Shuffle Toggle */}
              <button
                onClick={toggleLibraryShuffle}
                title={isLibraryShuffle ? "Queue Shuffle: Enabled" : "Queue Shuffle: Disabled"}
                className="p-1.5 rounded-lg ct-btn transition-colors"
                style={{
                  color: isLibraryShuffle ? "var(--ct-work-accent)" : "var(--ct-muted)",
                  borderColor: isLibraryShuffle ? "var(--ct-work-accent)" : "var(--ct-border)",
                }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 16H4m16 0h-6m6-8H4m12 0l4 4-4 4m0-8l-4-4" />
                </svg>
              </button>
            </div>
          </div>

          {/* Saved Tracks List */}
          <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
            {savedTracks.map((item, idx) => {
              const isCurrentlyPlayingInQueue =
                playbackMode === "library" && libraryIndex === idx && currentTrack.url === item.url;

              return (
                <div
                  key={item.id}
                  className="group flex items-center justify-between gap-3 p-2.5 rounded-xl ct-btn transition-all"
                  style={{
                    background: isCurrentlyPlayingInQueue ? "var(--ct-active-bg)" : "var(--ct-input-bg)",
                    borderColor: isCurrentlyPlayingInQueue ? "var(--ct-work-accent)" : "var(--ct-border)",
                  }}
                >
                  {/* Track Play Row */}
                  <button
                    onClick={() => handlePlaySavedLibrary(idx)}
                    className="flex items-center gap-3 min-w-0 flex-1 text-left"
                  >
                    <div className="w-6 text-center flex-shrink-0">
                      {isCurrentlyPlayingInQueue && isPlaying ? (
                        <div className="flex items-end justify-center gap-0.5 h-3.5">
                          <span className="w-0.5 bg-amber-400 rounded-full ct-eq-bar-1" />
                          <span className="w-0.5 bg-emerald-400 rounded-full ct-eq-bar-2" />
                          <span className="w-0.5 bg-amber-400 rounded-full ct-eq-bar-3" />
                        </div>
                      ) : (
                        <span className="text-xs font-bold tabular-nums" style={{ color: "var(--ct-dim)" }}>
                          {idx + 1}
                        </span>
                      )}
                    </div>

                    <img
                      src={item.thumbnail || getThumbnailUrl(item.videoId)}
                      alt=""
                      className="w-9 h-9 rounded-lg object-cover flex-shrink-0 shadow-sm"
                    />

                    <div className="min-w-0 flex-1">
                      <p
                        className={`text-xs font-semibold truncate ${
                          isCurrentlyPlayingInQueue ? "text-amber-300 font-bold" : ""
                        }`}
                        style={{ color: isCurrentlyPlayingInQueue ? undefined : "var(--ct-text)" }}
                      >
                        {item.title}
                      </p>
                      <p className="text-[10px] truncate" style={{ color: "var(--ct-muted)" }}>
                        {item.type.includes("playlist") ? "Playlist" : "Track"} • {item.author || "YouTube"}
                      </p>
                    </div>
                  </button>

                  {/* Actions: Open YT / Delete */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noreferrer"
                      title="Open on YouTube"
                      className="p-1.5 rounded-lg hover:text-white"
                      style={{ color: "var(--ct-muted)" }}
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                    <button
                      onClick={() => removeSavedTrack(item.id)}
                      title="Remove from library"
                      className="p-1.5 rounded-lg hover:text-red-400"
                      style={{ color: "var(--ct-muted)" }}
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })}

            {savedTracks.length === 0 && (
              <div className="py-8 text-center" style={{ color: "var(--ct-muted)" }}>
                <svg className="w-8 h-8 mx-auto mb-2 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z" />
                </svg>
                <p className="text-xs font-semibold">No tracks in saved queue</p>
                <p className="text-[11px] mt-0.5">Paste any YouTube video or playlist link and click Bookmark to save</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
