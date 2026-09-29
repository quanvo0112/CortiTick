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
                setApiError("Video restricts third-party playback (Error 150). Try another link or preset.");
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
          playerOptions.videoId = currentTrack.videoId || "rFZHOHl-L8A";
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
        setTimeout(pullMetadataFromPlayer, 800);
        setTimeout(pullMetadataFromPlayer, 2000);
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

  // Seek +/- 10 seconds
  const handleSeek = (secondsOffset: number) => {
    if (!playerRef.current || !isPlayerReady) return;
    try {
      const current = playerRef.current.getCurrentTime?.() || 0;
      playerRef.current.seekTo?.(Math.max(0, current + secondsOffset), true);
    } catch (e) {
      console.error("Seek error", e);
    }
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
    <div className="flex flex-col gap-4">
      {/* ── Console Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/[0.07]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center border border-amber-500/20 shadow-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-extrabold tracking-wider uppercase" style={{ color: "var(--ct-text)" }}>
                Focus Acoustic Deck
              </h2>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/[0.05] text-slate-400 border border-white/[0.08]">
                MK-II
              </span>
            </div>
            <p className="text-[11px] truncate max-w-[200px] sm:max-w-xs" style={{ color: "var(--ct-muted)" }}>
              {playbackMode === "library"
                ? `Library Queue • Track ${libraryIndex + 1}/${savedTracks.length}`
                : isCurrentPlaylist
                ? "YouTube Continuous Stream"
                : "Acoustic Focus Soundtrack"}
            </p>
          </div>
        </div>

        {/* View Mode & Library Drawer Trigger */}
        <div className="flex items-center gap-1.5">
          {/* Tape Deck vs Video Monitor Toggle */}
          <button
            onClick={toggleShowVideo}
            title={showVideo ? "Switch to Tape Deck (Audio-First)" : "Switch to Video Stage"}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold ct-btn transition-colors"
            style={{
              color: showVideo ? "var(--ct-work-accent)" : "var(--ct-muted)",
              borderColor: showVideo ? "var(--ct-work-accent)" : "var(--ct-border)",
            }}
          >
            {showVideo ? (
              <>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <span>Video Stage</span>
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <rect x="2" y="4" width="20" height="16" rx="2" strokeWidth={1.8} />
                  <circle cx="8" cy="12" r="3" strokeWidth={1.8} />
                  <circle cx="16" cy="12" r="3" strokeWidth={1.8} />
                  <path strokeLinecap="round" strokeWidth={1.8} d="M8 15h8" />
                </svg>
                <span>Tape Deck</span>
              </>
            )}
          </button>

          {/* Library Queue Tray Trigger */}
          <button
            onClick={() => setIsLibraryOpen(!isLibraryOpen)}
            title="Saved Focus Library Queue"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold ct-btn transition-colors"
            style={{
              color: isLibraryOpen || playbackMode === "library" ? "var(--ct-work-accent)" : "var(--ct-muted)",
              borderColor: playbackMode === "library" ? "var(--ct-work-accent)" : "var(--ct-border)",
            }}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <span>Queue ({savedTracks.length})</span>
          </button>
        </div>
      </div>

      {/* ── Active Screen / Stage (Tape Deck Visualizer OR Video Frame) ── */}
      <div className="relative rounded-2xl overflow-hidden border border-white/[0.08] shadow-inner" style={{ background: "#06070a" }}>
        {/* Hidden YouTube Iframe Mount (Always keeps audio playing smoothly) */}
        <div
          className={
            showVideo
              ? "relative w-full aspect-video z-10"
              : "absolute opacity-0 pointer-events-none w-[320px] h-[180px] -top-[9999px] left-0"
          }
        >
          <div id="cortitick-yt-player-target" className="w-full h-full" />
        </div>

        {/* Tactile Hardware Tape Deck Visualizer (Rendered when video is collapsed) */}
        {!showVideo && (
          <div className="p-4 sm:p-5 flex flex-col gap-3.5 relative overflow-hidden">
            {/* Subtle background grille pattern */}
            <div
              className="absolute inset-0 opacity-[0.03] pointer-events-none"
              style={{
                backgroundImage: "radial-gradient(#ffffff 1px, transparent 1px)",
                backgroundSize: "8px 8px",
              }}
            />

            {/* Cassette Header Bar with VU Equalizer */}
            <div className="flex items-center justify-between z-10">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{ background: isPlaying ? "#10b981" : "#64748b" }} />
                <span className="text-[10px] font-mono tracking-widest uppercase text-slate-400">
                  {isPlaying ? "STEREO TAPE RUNNING" : "TAPE STANDBY"}
                </span>
              </div>

              {/* Stereo VU Meter Needle Bars */}
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-black/40 border border-white/[0.06]">
                <span className="text-[9px] font-mono text-slate-500 font-bold">L</span>
                <div className="flex items-end gap-0.5 h-3.5 w-10">
                  <span className={`w-1.5 rounded-xs bg-emerald-500 ${isPlaying ? "ct-eq-bar-1" : "h-1"}`} />
                  <span className={`w-1.5 rounded-xs bg-emerald-400 ${isPlaying ? "ct-eq-bar-2" : "h-1"}`} />
                  <span className={`w-1.5 rounded-xs bg-amber-400 ${isPlaying ? "ct-eq-bar-3" : "h-1"}`} />
                  <span className={`w-1.5 rounded-xs bg-rose-500 ${isPlaying ? "ct-eq-bar-4" : "h-1"}`} />
                </div>
                <span className="text-[9px] font-mono text-slate-500 font-bold ml-1">R</span>
                <div className="flex items-end gap-0.5 h-3.5 w-10">
                  <span className={`w-1.5 rounded-xs bg-emerald-500 ${isPlaying ? "ct-eq-bar-3" : "h-1"}`} />
                  <span className={`w-1.5 rounded-xs bg-emerald-400 ${isPlaying ? "ct-eq-bar-1" : "h-1"}`} />
                  <span className={`w-1.5 rounded-xs bg-amber-400 ${isPlaying ? "ct-eq-bar-4" : "h-1"}`} />
                  <span className={`w-1.5 rounded-xs bg-rose-500 ${isPlaying ? "ct-eq-bar-2" : "h-1"}`} />
                </div>
              </div>
            </div>

            {/* Tape Spool Chassis Window */}
            <div className="relative rounded-xl p-3 bg-[#0d0f15] border border-white/[0.06] flex items-center justify-between gap-4 z-10 shadow-inner">
              {/* Left Tape Reel Hub */}
              <div className="flex items-center gap-3">
                <div className={`relative w-12 h-12 rounded-full border-2 border-white/20 flex items-center justify-center bg-black/60 shadow-md ${isPlaying ? "ct-tape-reel-spin" : ""}`}>
                  <div className="w-5 h-5 rounded-full border border-white/30 flex items-center justify-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500/80" />
                  </div>
                  {/* Sprocket teeth */}
                  <div className="absolute w-full h-0.5 bg-white/20" />
                  <div className="absolute h-full w-0.5 bg-white/20" />
                </div>
                <div className="hidden sm:flex flex-col">
                  <span className="text-[9px] font-mono text-slate-500 uppercase">SPEED</span>
                  <span className="text-[10px] font-mono text-slate-300 font-bold">19 CM/S</span>
                </div>
              </div>

              {/* Center Tape Window & Album Art Thumbnail */}
              <div className="flex-1 max-w-[180px] h-12 rounded-lg bg-black/80 border border-white/[0.08] overflow-hidden relative flex items-center justify-center px-2 group">
                <img
                  src={currentTrack.thumbnail || getThumbnailUrl(currentTrack.videoId)}
                  alt={currentTrack.title}
                  className="w-full h-full object-cover opacity-50 blur-[1px] group-hover:blur-none group-hover:opacity-80 transition-all"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src =
                      "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=400&q=80";
                  }}
                />
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                  <span className="text-[10px] font-mono tracking-widest text-amber-300/90 font-bold uppercase drop-shadow">
                    MAGNETIC FOCUS TAPE
                  </span>
                </div>
              </div>

              {/* Right Tape Reel Hub */}
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex flex-col text-right">
                  <span className="text-[9px] font-mono text-slate-500 uppercase">BIAS</span>
                  <span className="text-[10px] font-mono text-slate-300 font-bold">HIGH (CrO2)</span>
                </div>
                <div className={`relative w-12 h-12 rounded-full border-2 border-white/20 flex items-center justify-center bg-black/60 shadow-md ${isPlaying ? "ct-tape-reel-spin" : ""}`}>
                  <div className="w-5 h-5 rounded-full border border-white/30 flex items-center justify-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500/80" />
                  </div>
                  {/* Sprocket teeth */}
                  <div className="absolute w-full h-0.5 bg-white/20" />
                  <div className="absolute h-full w-0.5 bg-white/20" />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Error Banner (if any) ── */}
      {apiError && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 flex-shrink-0 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{apiError}</span>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <a
              href={currentTrack.url}
              target="_blank"
              rel="noreferrer"
              className="px-2 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 text-[11px] font-bold"
            >
              Open YouTube ↗
            </a>
            <button onClick={() => setApiError(null)} className="text-xs hover:text-white px-1">✕</button>
          </div>
        </div>
      )}

      {/* ── Live Title Ticker & Artist Info ── */}
      <div className="px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/[0.06] flex items-center justify-between gap-3 overflow-hidden">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {isPlaying ? (
            <div className="flex items-end gap-0.5 h-3 flex-shrink-0">
              <span className="w-0.5 bg-amber-400 rounded-full ct-eq-bar-1" />
              <span className="w-0.5 bg-orange-400 rounded-full ct-eq-bar-2" />
              <span className="w-0.5 bg-emerald-400 rounded-full ct-eq-bar-3" />
            </div>
          ) : (
            <span className="w-2 h-2 rounded-full bg-slate-500 flex-shrink-0" />
          )}

          <div className="min-w-0 flex-1 overflow-hidden">
            <div className="text-xs font-bold truncate text-[var(--ct-text)]" title={currentTrack.title}>
              {currentTrack.title}
            </div>
            <div className="text-[10px] text-slate-400 truncate">
              {currentTrack.author || "YouTube Soundscape"}
            </div>
          </div>
        </div>

        {/* State Pill */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {isBuffering && (
            <span className="text-[10px] font-mono text-amber-400 animate-pulse">BUFFERING</span>
          )}
          {playbackMode === "library" ? (
            <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold uppercase">
              QUEUE #{libraryIndex + 1}
            </span>
          ) : isCurrentPlaylist ? (
            <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30 font-bold uppercase">
              PLAYLIST
            </span>
          ) : (
            <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-white/[0.05] text-slate-400 border border-white/[0.08] font-bold uppercase">
              SINGLE
            </span>
          )}
        </div>
      </div>

      {/* ── Master Tape Transport & Tactile Controls ── */}
      <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.06] flex flex-wrap items-center justify-between gap-4">
        {/* Playback Buttons */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Previous Track */}
          <button
            onClick={handlePreviousTrack}
            title={playbackMode === "library" ? "Previous track in library queue" : "Previous track in playlist"}
            disabled={!canGoNextOrPrev}
            className={`w-8 h-8 rounded-lg flex items-center justify-center ct-btn ${
              !canGoNextOrPrev ? "opacity-30 cursor-not-allowed" : "hover:scale-105"
            }`}
            style={{ color: "var(--ct-text)" }}
          >
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
            </svg>
          </button>

          {/* Seek -10s */}
          <button
            onClick={() => handleSeek(-10)}
            title="Rewind 10 seconds"
            className="w-8 h-8 rounded-lg flex items-center justify-center ct-btn hover:scale-105"
            style={{ color: "var(--ct-muted)" }}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0019 16V8a1 1 0 00-1.6-.8l-5.334 4zM4.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0011 16V8a1 1 0 00-1.6-.8l-5.334 4z" />
            </svg>
          </button>

          {/* Master Play / Pause Trigger */}
          <button
            onClick={handleTogglePlay}
            id="focus-music-toggle"
            className="w-11 h-11 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold flex items-center justify-center shadow-lg transition-transform hover:scale-105 active:scale-95 mx-1"
            title={isPlaying ? "Pause audio stream" : "Start audio stream"}
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

          {/* Seek +10s */}
          <button
            onClick={() => handleSeek(10)}
            title="Forward 10 seconds"
            className="w-8 h-8 rounded-lg flex items-center justify-center ct-btn hover:scale-105"
            style={{ color: "var(--ct-muted)" }}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M11.934 12.8a1 1 0 000-1.6l-5.334-4A1 1 0 005 8v8a1 1 0 001.6.8l5.334-4zM19.934 12.8a1 1 0 000-1.6l-5.334-4A1 1 0 0013 8v8a1 1 0 001.6.8l5.334-4z" />
            </svg>
          </button>

          {/* Next Track */}
          <button
            onClick={handleNextTrack}
            title={playbackMode === "library" ? "Next track in library queue" : "Next track in playlist"}
            disabled={!canGoNextOrPrev}
            className={`w-8 h-8 rounded-lg flex items-center justify-center ct-btn ${
              !canGoNextOrPrev ? "opacity-30 cursor-not-allowed" : "hover:scale-105"
            }`}
            style={{ color: "var(--ct-text)" }}
          >
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
            </svg>
          </button>
        </div>

        {/* Volume Fader */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleMute}
            title={isMuted ? "Unmute" : "Mute"}
            className="w-7 h-7 flex items-center justify-center ct-icon-btn rounded-lg"
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
            className="w-20 h-1.5 rounded-lg appearance-none cursor-pointer accent-amber-500 bg-white/10"
            title={`Gain: ${isMuted ? 0 : volume}%`}
          />
          <span className="text-[10px] font-mono text-slate-400 w-7 text-right">
            {isMuted ? "0%" : `${volume}%`}
          </span>
        </div>
      </div>

      {/* ── Direct Stream URL Bar ── */}
      <form onSubmit={handleSubmitUrl} className="flex gap-2">
        <div className="relative flex-1">
          <input
            id="focus-music-input"
            type="text"
            placeholder="Paste YouTube track or playlist link..."
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            className="w-full rounded-xl pl-9 pr-7 py-2 text-xs outline-none focus:ring-1 focus:ring-amber-500 transition-colors"
            style={{
              background: "var(--ct-input-bg)",
              border: "1px solid var(--ct-input-bd)",
              color: "var(--ct-text)",
            }}
          />
          <div className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--ct-muted)" }}>
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
            </svg>
          </div>
          {inputUrl && (
            <button
              type="button"
              onClick={() => setInputUrl("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs hover:text-white"
              style={{ color: "var(--ct-muted)" }}
            >
              ✕
            </button>
          )}
        </div>

        <button
          type="submit"
          className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-transform hover:scale-105 active:scale-95 flex items-center gap-1 shadow-sm"
        >
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
          <span>Stream</span>
        </button>

        <button
          type="button"
          onClick={handleSaveToLibrary}
          title="Save track to Focus Queue"
          className="px-3 py-2 rounded-xl ct-btn text-xs font-semibold flex items-center transition-transform hover:scale-105"
          style={{ color: "var(--ct-text)" }}
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
        </button>
      </form>

      {/* ── Curated Focus Presets ── */}
      <div className="grid grid-cols-2 gap-2">
        {PRESET_TRACKS.map((preset: PresetTrack) => (
          <button
            key={preset.id}
            onClick={() => playUrl(preset.url, true)}
            className="flex items-center gap-2 p-2 rounded-xl ct-btn text-left transition-all hover:scale-[1.02]"
            style={{
              background: currentTrack.url === preset.url ? "var(--ct-active-bg)" : "var(--ct-input-bg)",
              borderColor: currentTrack.url === preset.url ? "var(--ct-work-accent)" : "var(--ct-input-bd)",
            }}
          >
            <div className="w-6 h-6 rounded-lg flex items-center justify-center bg-amber-500/10 text-amber-500 flex-shrink-0">
              {preset.icon === "coffee" && (
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M18 8h1a4 4 0 0 1 0 8h-1M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8zM6 1v3M10 1v3M14 1v3" />
                </svg>
              )}
              {preset.icon === "brain" && (
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 1 1 7.072 0l-.548.547A3.374 3.374 0 0 0 14 18.469V19a2 2 0 1 1-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              )}
              {preset.icon === "moon" && (
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
              {preset.icon === "music" && (
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z" />
                </svg>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold truncate" style={{ color: "var(--ct-text)" }}>
                {preset.name}
              </p>
              <p className="text-[10px] text-slate-400 truncate">
                {preset.description}
              </p>
            </div>
          </button>
        ))}
      </div>

      {/* ── Saved Focus Queue Tray (Continuous Playback) ── */}
      {isLibraryOpen && (
        <div className="rounded-2xl p-3.5 bg-black/40 border border-white/[0.08] space-y-3 transition-all">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-white/[0.06]">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--ct-text)]">
                Focus Queue
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 font-bold">
                {savedTracks.length} items
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              {/* Play All Queue Trigger */}
              <button
                onClick={() => handlePlaySavedLibrary(0)}
                disabled={savedTracks.length === 0}
                className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-[11px] font-bold transition-all disabled:opacity-40 flex items-center gap-1 shadow-sm"
              >
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                <span>Play Queue</span>
              </button>

              {/* Loop Toggle */}
              <button
                onClick={toggleLibraryLoop}
                title={isLibraryLoop ? "Loop enabled" : "Loop disabled"}
                className={`p-1.5 rounded-lg ct-btn transition-colors ${
                  isLibraryLoop ? "text-amber-400 border-amber-500/40 bg-amber-500/10" : "text-slate-400"
                }`}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>

              {/* Shuffle Toggle */}
              <button
                onClick={toggleLibraryShuffle}
                title={isLibraryShuffle ? "Shuffle enabled" : "Shuffle disabled"}
                className={`p-1.5 rounded-lg ct-btn transition-colors ${
                  isLibraryShuffle ? "text-amber-400 border-amber-500/40 bg-amber-500/10" : "text-slate-400"
                }`}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              </button>
            </div>
          </div>

          {/* Queue items */}
          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {savedTracks.map((item, idx) => {
              const isCurrent = playbackMode === "library" && libraryIndex === idx;
              return (
                <div
                  key={item.id}
                  className={`flex items-center justify-between gap-2.5 p-2 rounded-xl transition-all ct-btn ${
                    isCurrent ? "bg-amber-500/15 border-amber-500/40 text-amber-300" : "bg-white/[0.02]"
                  }`}
                >
                  <button
                    onClick={() => handlePlaySavedLibrary(idx)}
                    className="flex items-center gap-2.5 min-w-0 flex-1 text-left"
                  >
                    <span className="w-4 text-[10px] font-mono text-slate-500 text-center flex-shrink-0">
                      {isCurrent && isPlaying ? (
                        <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping inline-block" />
                      ) : (
                        idx + 1
                      )}
                    </span>
                    <img
                      src={item.thumbnail || getThumbnailUrl(item.videoId)}
                      alt={item.title}
                      className="w-8 h-8 rounded-lg object-cover flex-shrink-0 bg-black/40"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold truncate">{item.title}</p>
                      <p className="text-[10px] text-slate-400 truncate">{item.author}</p>
                    </div>
                  </button>

                  <button
                    onClick={() => removeSavedTrack(item.id)}
                    title="Remove from queue"
                    className="p-1 rounded-lg text-slate-500 hover:text-red-400 transition-colors"
                  >
                    ✕
                  </button>
                </div>
              );
            })}

            {savedTracks.length === 0 && (
              <p className="text-center py-6 text-xs text-slate-500">
                No items in queue. Click the bookmark icon to save tracks.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
