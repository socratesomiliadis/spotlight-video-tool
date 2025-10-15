"use client";

import { useRef, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface VideoTimelineProps {
  duration: number;
  currentTime: number;
  startTime: number;
  endTime: number;
  onStartTimeChange: (time: number) => void;
  onEndTimeChange: (time: number) => void;
  onSeek: (time: number) => void;
  videoElement?: HTMLVideoElement | null;
}

export default function VideoTimeline({
  duration,
  currentTime,
  startTime,
  endTime,
  onStartTimeChange,
  onEndTimeChange,
  onSeek,
  videoElement,
}: VideoTimelineProps) {
  const timelineRef = useRef<HTMLDivElement>(null);
  const [isDraggingStart, setIsDraggingStart] = useState(false);
  const [isDraggingEnd, setIsDraggingEnd] = useState(false);
  const [thumbnails, setThumbnails] = useState<string[]>([]);
  const [isGeneratingThumbnails, setIsGeneratingThumbnails] = useState(false);
  const [thumbnailProgress, setThumbnailProgress] = useState(0);
  const [timelineWidth, setTimelineWidth] = useState(0);
  const rafIdRef = useRef<number | null>(null);
  const pendingSeekRef = useRef<number | null>(null);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Measure timeline width
  useEffect(() => {
    if (!timelineRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setTimelineWidth(entry.contentRect.width);
      }
    });

    resizeObserver.observe(timelineRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // Generate thumbnails from video
  useEffect(() => {
    if (!videoElement || !duration || duration === 0 || timelineWidth === 0)
      return;

    let cancelled = false;
    setIsGeneratingThumbnails(true);
    setThumbnailProgress(0);

    const generateThumbnails = async () => {
      // Calculate thumbnail count based on timeline width
      // Target ~70px per thumbnail for good quality/performance balance
      const targetThumbnailWidth = 70;
      const thumbnailCount = Math.max(
        10,
        Math.min(30, Math.floor(timelineWidth / targetThumbnailWidth))
      );

      // Calculate times to capture
      const times: number[] = [];
      for (let i = 0; i < thumbnailCount; i++) {
        times.push((duration / thumbnailCount) * i);
      }

      // Calculate canvas dimensions
      const aspectRatio = videoElement.videoWidth / videoElement.videoHeight;
      const canvasHeight = 64; // Match timeline height
      const canvasWidth = canvasHeight * aspectRatio;

      const newThumbnails: string[] = new Array(thumbnailCount);
      const originalTime = videoElement.currentTime;

      // Process thumbnails in batches of 3 for speed (parallel seeking)
      const batchSize = 3;
      const batches = Math.ceil(thumbnailCount / batchSize);

      for (let batchIndex = 0; batchIndex < batches; batchIndex++) {
        if (cancelled) break;

        const batchStart = batchIndex * batchSize;
        const batchEnd = Math.min(batchStart + batchSize, thumbnailCount);
        const batchPromises = [];

        for (let i = batchStart; i < batchEnd; i++) {
          const time = times[i];
          const index = i;

          // Create a promise for each thumbnail in the batch
          const promise = (async () => {
            // Create a separate canvas for each thumbnail to avoid race conditions
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d", { alpha: false });
            if (!ctx) return { index, dataUrl: "" };

            canvas.height = canvasHeight;
            canvas.width = canvasWidth;

            // Create a temporary video element for parallel seeking
            const tempVideo = document.createElement("video");
            tempVideo.src = videoElement.src;
            tempVideo.muted = true;
            tempVideo.preload = "auto"; // Changed from "metadata" to "auto"
            tempVideo.crossOrigin = "anonymous";

            // Wait for video to be ready to play
            await new Promise<void>((resolve, reject) => {
              const timeout = setTimeout(
                () => reject(new Error("Timeout loading video")),
                5000
              );

              const onCanPlay = () => {
                clearTimeout(timeout);
                tempVideo.removeEventListener("canplay", onCanPlay);
                tempVideo.removeEventListener("loadedmetadata", onCanPlay);
                resolve();
              };

              // Listen to both events in case one is already fired
              if (tempVideo.readyState >= 3) {
                // HAVE_FUTURE_DATA or better
                clearTimeout(timeout);
                resolve();
              } else {
                tempVideo.addEventListener("canplay", onCanPlay);
                tempVideo.addEventListener("loadedmetadata", onCanPlay);
              }
            });

            // Seek to the target time
            tempVideo.currentTime = time;

            // Wait for seek to complete AND frame to be ready
            await new Promise<void>((resolve, reject) => {
              let resolved = false;
              const timeout = setTimeout(() => {
                if (!resolved) {
                  resolved = true;
                  cleanup();
                  resolve(); // Don't reject, just resolve with whatever we have
                }
              }, 1000);

              const cleanup = () => {
                tempVideo.removeEventListener("seeked", onSeeked);
                tempVideo.removeEventListener("canplay", onSeeked);
              };

              const onSeeked = () => {
                if (!resolved && tempVideo.readyState >= 2) {
                  // HAVE_CURRENT_DATA or better
                  resolved = true;
                  clearTimeout(timeout);
                  cleanup();
                  // Give extra time for frame to be fully decoded
                  setTimeout(resolve, 100);
                }
              };

              tempVideo.addEventListener("seeked", onSeeked);
              tempVideo.addEventListener("canplay", onSeeked);
            });

            // Draw the frame to this thumbnail's dedicated canvas
            ctx.drawImage(tempVideo, 0, 0, canvas.width, canvas.height);
            const dataUrl = canvas.toDataURL("image/jpeg", 0.7);

            // Clean up
            tempVideo.src = "";
            tempVideo.remove();

            return { index, dataUrl };
          })();

          batchPromises.push(promise);
        }

        // Wait for all thumbnails in this batch
        const results = await Promise.all(batchPromises);
        results.forEach(({ index, dataUrl }) => {
          newThumbnails[index] = dataUrl;
        });

        // Update progress
        if (!cancelled) {
          const progress = (batchEnd / thumbnailCount) * 100;
          setThumbnailProgress(progress);
        }
      }

      if (!cancelled) {
        // Restore original time
        videoElement.currentTime = originalTime;
        setThumbnails(newThumbnails);
        setIsGeneratingThumbnails(false);
        setThumbnailProgress(100);
      }
    };

    generateThumbnails().catch((error) => {
      console.error("Error generating thumbnails:", error);
      setIsGeneratingThumbnails(false);
    });

    return () => {
      cancelled = true;
      setIsGeneratingThumbnails(false);
    };
  }, [videoElement, duration, timelineWidth]);

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current || isDraggingStart || isDraggingEnd) return;

    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const time = percentage * duration;

    onSeek(Math.max(0, Math.min(duration, time)));
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!timelineRef.current) return;

    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, x / rect.width));
    const time = percentage * duration;

    if (isDraggingStart) {
      const newTime = Math.max(0, Math.min(endTime - 0.1, time));
      onStartTimeChange(newTime);
      pendingSeekRef.current = newTime;

      // Throttle seeking using requestAnimationFrame
      if (rafIdRef.current === null) {
        rafIdRef.current = requestAnimationFrame(() => {
          if (pendingSeekRef.current !== null) {
            onSeek(pendingSeekRef.current);
            pendingSeekRef.current = null;
          }
          rafIdRef.current = null;
        });
      }
    } else if (isDraggingEnd) {
      const newTime = Math.max(startTime + 0.1, Math.min(duration, time));
      onEndTimeChange(newTime);
      pendingSeekRef.current = newTime;

      // Throttle seeking using requestAnimationFrame
      if (rafIdRef.current === null) {
        rafIdRef.current = requestAnimationFrame(() => {
          if (pendingSeekRef.current !== null) {
            onSeek(pendingSeekRef.current);
            pendingSeekRef.current = null;
          }
          rafIdRef.current = null;
        });
      }
    }
  };

  const handleMouseUp = () => {
    // Cancel any pending animation frame
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }

    // Do a final seek to ensure we're at the exact position
    if (isDraggingStart) {
      onSeek(startTime);
    } else if (isDraggingEnd) {
      onSeek(endTime);
    }

    pendingSeekRef.current = null;
    setIsDraggingStart(false);
    setIsDraggingEnd(false);
  };

  useEffect(() => {
    if (isDraggingStart || isDraggingEnd) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
        // Clean up any pending animation frame
        if (rafIdRef.current !== null) {
          cancelAnimationFrame(rafIdRef.current);
          rafIdRef.current = null;
        }
      };
    }
  }, [isDraggingStart, isDraggingEnd, duration, startTime, endTime]);

  const startPercentage = (startTime / duration) * 100;
  const endPercentage = (endTime / duration) * 100;
  const currentPercentage = (currentTime / duration) * 100;

  return (
    <div>
      <div className="flex justify-between text-sm text-muted-foreground mb-3">
        <span>Trim Selection</span>
        <span>
          {formatTime(endTime - startTime)} / {formatTime(duration)}
        </span>
      </div>

      <div
        ref={timelineRef}
        onClick={handleTimelineClick}
        className="relative h-16 bg-muted cursor-pointer rounded-md border-[2px] border-black/20"
      >
        {/* Thumbnails and overlays container - clipped to rounded corners */}
        <div className="absolute inset-0 overflow-hidden rounded-md">
          {/* Loading indicator */}
          {isGeneratingThumbnails && (
            <div className="absolute inset-0 flex items-center justify-center bg-muted z-10">
              <div className="text-center">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="w-4 h-4 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" />
                  <span>
                    Generating thumbnails... {Math.round(thumbnailProgress)}%
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Video thumbnails */}
          {thumbnails.length > 0 && !isGeneratingThumbnails && (
            <div className="absolute inset-0 flex">
              {thumbnails.map((thumbnail, index) => (
                <div
                  key={index}
                  className="flex-1 h-full bg-cover bg-center"
                  style={{
                    backgroundImage: `url(${thumbnail})`,
                    backgroundSize: "cover",
                  }}
                />
              ))}
            </div>
          )}

          {/* Overlay for non-selected regions */}
          <div
            className="absolute top-0 bottom-0 left-0 bg-white/85 pointer-events-none"
            style={{ width: `${startPercentage}%` }}
          />
          <div
            className="absolute top-0 bottom-0 right-0 bg-white/85 pointer-events-none"
            style={{ width: `${100 - endPercentage}%` }}
          />
        </div>

        {/* Current time indicator */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-foreground z-20"
          style={{ left: `${currentPercentage}%` }}
        >
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-foreground rounded-full " />
        </div>

        {/* Start handle */}
        <div
          className="absolute top-0 bottom-0 w-1 bg-foreground cursor-ew-resize z-30 hover:w-2 transition-[width] duration-100"
          style={{ left: `${startPercentage}%` }}
          onMouseDown={(e) => {
            e.stopPropagation();
            setIsDraggingStart(true);
          }}
        >
          <div className="absolute top-1/2 -translate-y-1/2 -left-2 w-5 h-8 bg-foreground rounded-sm flex items-center justify-center ">
            <ChevronLeft className="w-4 h-4 text-background" />
          </div>
          <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs text-foreground whitespace-nowrap font-mono bg-background/90 px-1 py-0.5 rounded shadow-sm select-none">
            {formatTime(startTime)}
          </div>
        </div>

        {/* End handle */}
        <div
          className="absolute top-0 bottom-0 w-1 bg-foreground cursor-ew-resize z-30 hover:w-2 transition-[width] duration-100"
          style={{ left: `${endPercentage}%` }}
          onMouseDown={(e) => {
            e.stopPropagation();
            setIsDraggingEnd(true);
          }}
        >
          <div className="absolute top-1/2 -translate-y-1/2 -right-2 w-5 h-8 bg-foreground rounded-sm flex items-center justify-center ">
            <ChevronRight className="w-4 h-4 text-background" />
          </div>
          <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs text-foreground whitespace-nowrap font-mono bg-background/90 px-1 py-0.5 rounded shadow-sm select-none">
            {formatTime(endTime)}
          </div>
        </div>
      </div>
    </div>
  );
}
