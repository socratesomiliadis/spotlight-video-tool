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

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Generate thumbnails from video
  useEffect(() => {
    if (!videoElement || !duration || duration === 0) return;

    const generateThumbnails = async () => {
      const thumbnailCount = 15; // Number of thumbnails to generate
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Set canvas size to match video aspect ratio but smaller
      const aspectRatio = videoElement.videoWidth / videoElement.videoHeight;
      canvas.height = 64; // Match timeline height
      canvas.width = canvas.height * aspectRatio;

      const newThumbnails: string[] = [];
      const originalTime = videoElement.currentTime;

      for (let i = 0; i < thumbnailCount; i++) {
        const time = (duration / thumbnailCount) * i;

        // Seek to the time
        videoElement.currentTime = time;
        await new Promise<void>((resolve) => {
          const seeked = () => {
            videoElement.removeEventListener("seeked", seeked);
            resolve();
          };
          videoElement.addEventListener("seeked", seeked);
          // Timeout fallback
          setTimeout(resolve, 100);
        });

        // Draw the frame
        ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

        // Convert to data URL
        const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
        newThumbnails.push(dataUrl);
      }

      // Restore original time
      videoElement.currentTime = originalTime;

      setThumbnails(newThumbnails);
    };

    generateThumbnails();
  }, [videoElement, duration]);

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
      onSeek(newTime);
    } else if (isDraggingEnd) {
      const newTime = Math.max(startTime + 0.1, Math.min(duration, time));
      onEndTimeChange(newTime);
      onSeek(newTime);
    }
  };

  const handleMouseUp = () => {
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
        className="relative h-16 bg-muted rounded-md cursor-pointer overflow-hidden border"
      >
        {/* Video thumbnails */}
        {thumbnails.length > 0 && (
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
          className="absolute top-0 bottom-0 left-0 bg-black/60 pointer-events-none"
          style={{ width: `${startPercentage}%` }}
        />
        <div
          className="absolute top-0 bottom-0 right-0 bg-black/60 pointer-events-none"
          style={{ width: `${100 - endPercentage}%` }}
        />

        {/* Selected region borders */}
        <div
          className="absolute top-0 bottom-0 border-l-2 border-r-2 border-foreground pointer-events-none"
          style={{
            left: `${startPercentage}%`,
            right: `${100 - endPercentage}%`,
          }}
        />

        {/* Current time indicator */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-foreground z-20"
          style={{ left: `${currentPercentage}%` }}
        >
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-foreground rounded-full" />
        </div>

        {/* Start handle */}
        <div
          className="absolute top-0 bottom-0 w-1 bg-foreground cursor-ew-resize z-30 hover:w-2 transition-all"
          style={{ left: `${startPercentage}%` }}
          onMouseDown={(e) => {
            e.stopPropagation();
            setIsDraggingStart(true);
          }}
        >
          <div className="absolute top-1/2 -translate-y-1/2 -left-2 w-5 h-8 bg-foreground rounded-sm flex items-center justify-center">
            <ChevronLeft className="w-4 h-4 text-background" />
          </div>
          <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs text-foreground whitespace-nowrap font-mono">
            {formatTime(startTime)}
          </div>
        </div>

        {/* End handle */}
        <div
          className="absolute top-0 bottom-0 w-1 bg-foreground cursor-ew-resize z-30 hover:w-2 transition-all"
          style={{ left: `${endPercentage}%` }}
          onMouseDown={(e) => {
            e.stopPropagation();
            setIsDraggingEnd(true);
          }}
        >
          <div className="absolute top-1/2 -translate-y-1/2 -right-2 w-5 h-8 bg-foreground rounded-sm flex items-center justify-center">
            <ChevronRight className="w-4 h-4 text-background" />
          </div>
          <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs text-foreground whitespace-nowrap font-mono">
            {formatTime(endTime)}
          </div>
        </div>

        {/* Time markers */}
        <div className="absolute inset-0 flex items-end">
          {[0, 0.25, 0.5, 0.75, 1].map((fraction) => (
            <div
              key={fraction}
              className="absolute bottom-0 h-2 w-px bg-black"
              style={{ left: `${fraction * 100}%` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
