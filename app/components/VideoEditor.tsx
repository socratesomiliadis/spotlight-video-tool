"use client";

import { useState, useRef, useEffect } from "react";
import VideoPlayer, { VideoPlayerRef } from "./VideoPlayer";
import VideoTimeline from "./VideoTimeline";
import ConversionSettings from "./ConversionSettings";
import { processVideo, detectVideoFPS } from "../utils/videoProcessor";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { X } from "lucide-react";

interface VideoEditorProps {
  file: File;
  onClose: () => void;
}

export default function VideoEditor({ file, onClose }: VideoEditorProps) {
  const [videoUrl, setVideoUrl] = useState<string>("");
  const [duration, setDuration] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [startTime, setStartTime] = useState<number>(0);
  const [endTime, setEndTime] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [outputFormat, setOutputFormat] = useState<"webm" | "mp4">("webm");
  const [quality, setQuality] = useState(0.8);
  const [bitrate, setBitrate] = useState(3500000);
  const [fps, setFps] = useState(30);
  const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(
    null
  );
  const videoRef = useRef<VideoPlayerRef>(null);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setVideoUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  // Add keyboard event listener for spacebar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle spacebar if we're not focused on an input or button
      if (e.code === "Space" && e.target === document.body) {
        e.preventDefault();
        videoRef.current?.togglePlayPause();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleLoadedMetadata = async (element: HTMLVideoElement) => {
    const dur = element.duration;
    setDuration(dur);
    setEndTime(dur);
    setVideoElement(element);

    // Try to detect video FPS
    try {
      const detectedFps = await detectVideoFPS(file);
      setFps(detectedFps);
    } catch (error) {
      console.log("Could not detect FPS, using default 30fps");
    }
  };

  const handleExport = async () => {
    setIsProcessing(true);
    setProgress(0);

    try {
      console.log(
        `Starting export: ${outputFormat}, quality: ${quality}, bitrate: ${bitrate}, fps: ${fps}`
      );
      const blob = await processVideo({
        file,
        startTime,
        endTime,
        outputFormat,
        quality,
        bitrate,
        fps,
        onProgress: setProgress,
      });

      console.log(
        `Export complete: ${(blob.size / 1024 / 1024).toFixed(2)} MB`
      );

      // Download the processed video
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `edited-${Date.now()}.${outputFormat}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error processing video:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      alert(
        `Error processing video: ${errorMessage}\n\nCheck the console for details.`
      );
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <Card className="border-black/20 shadow-none">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-2xl">{file.name}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              disabled={isProcessing}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <VideoPlayer
            ref={videoRef}
            src={videoUrl}
            onLoadedMetadata={handleLoadedMetadata}
            onTimeUpdate={(time: number) => setCurrentTime(time)}
            startTime={startTime}
            endTime={endTime}
          />

          <VideoTimeline
            duration={duration}
            currentTime={currentTime}
            startTime={startTime}
            endTime={endTime}
            onStartTimeChange={setStartTime}
            onEndTimeChange={setEndTime}
            onSeek={(time: number) => {
              if (videoRef.current) {
                videoRef.current.currentTime = time;
              }
            }}
            videoElement={videoElement}
          />

          <ConversionSettings
            outputFormat={outputFormat}
            quality={quality}
            bitrate={bitrate}
            fps={fps}
            onFormatChange={setOutputFormat}
            onQualityChange={setQuality}
            onBitrateChange={setBitrate}
            onFpsChange={setFps}
          />

          <div className="flex gap-4">
            <Button
              onClick={handleExport}
              disabled={isProcessing}
              className="flex-1"
              size="lg"
            >
              {isProcessing
                ? `Processing... ${Math.round(progress)}%`
                : "Export Video"}
            </Button>
            <Button
              onClick={onClose}
              disabled={isProcessing}
              variant="outline"
              size="lg"
            >
              Cancel
            </Button>
          </div>

          {isProcessing && <Progress value={progress} className="w-full" />}
        </CardContent>
      </Card>
    </div>
  );
}
