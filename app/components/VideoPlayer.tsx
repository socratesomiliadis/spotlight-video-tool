"use client";

import { forwardRef, useState, useImperativeHandle, useRef } from "react";
import { Play, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";

interface VideoPlayerProps {
  src: string;
  onLoadedMetadata: (element: HTMLVideoElement) => void;
  onTimeUpdate: (time: number) => void;
  startTime: number;
  endTime: number;
}

export interface VideoPlayerRef {
  currentTime: number;
  togglePlayPause: () => void;
  videoElement: HTMLVideoElement | null;
}

const VideoPlayer = forwardRef<VideoPlayerRef, VideoPlayerProps>(
  ({ src, onLoadedMetadata, onTimeUpdate, startTime, endTime }, ref) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);

    const togglePlayPause = () => {
      if (videoRef.current) {
        if (isPlaying) {
          videoRef.current.pause();
        } else {
          // If we're outside the trim range, seek to start
          const currentTime = videoRef.current.currentTime;
          if (currentTime < startTime || currentTime >= endTime) {
            videoRef.current.currentTime = startTime;
          }
          videoRef.current.play();
        }
        setIsPlaying(!isPlaying);
      }
    };

    useImperativeHandle(ref, () => ({
      get currentTime() {
        return videoRef.current?.currentTime ?? 0;
      },
      set currentTime(time: number) {
        if (videoRef.current) {
          videoRef.current.currentTime = time;
        }
      },
      get videoElement() {
        return videoRef.current;
      },
      togglePlayPause,
    }));

    const handleTimeUpdate = (e: React.SyntheticEvent<HTMLVideoElement>) => {
      const currentTime = e.currentTarget.currentTime;
      onTimeUpdate(currentTime);

      // If we've reached or passed the end time, pause and seek to start
      if (currentTime >= endTime && isPlaying) {
        e.currentTarget.pause();
        e.currentTarget.currentTime = startTime;
      }
    };

    return (
      <div className="relative bg-black rounded-lg overflow-hidden border">
        <video
          ref={videoRef}
          src={src}
          onLoadedMetadata={(e) => onLoadedMetadata(e.currentTarget)}
          onTimeUpdate={handleTimeUpdate}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          className="w-full h-auto max-h-[500px] object-contain"
          controls
        />
        <Button
          onClick={togglePlayPause}
          size="icon"
          className="absolute bottom-4 left-4 rounded-full bg-background/80 hover:bg-background/90 backdrop-blur-sm"
          variant="secondary"
        >
          {isPlaying ? (
            <Pause className="h-5 w-5" />
          ) : (
            <Play className="h-5 w-5 ml-0.5" />
          )}
        </Button>
      </div>
    );
  }
);

VideoPlayer.displayName = "VideoPlayer";

export default VideoPlayer;
