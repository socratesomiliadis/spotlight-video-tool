"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Card } from "@/components/ui/card";
import { Check } from "lucide-react";

interface ConversionSettingsProps {
  outputFormat: "webm" | "mp4";
  quality: number;
  bitrate: number;
  fps: number;
  onFormatChange: (format: "webm" | "mp4") => void;
  onQualityChange: (quality: number) => void;
  onBitrateChange: (bitrate: number) => void;
  onFpsChange: (fps: number) => void;
}

export default function ConversionSettings({
  outputFormat,
  quality,
  bitrate,
  fps,
  onFormatChange,
  onQualityChange,
  onBitrateChange,
  onFpsChange,
}: ConversionSettingsProps) {
  const [webCodecsSupported, setWebCodecsSupported] = useState(false);

  useEffect(() => {
    setWebCodecsSupported(
      typeof window !== "undefined" &&
        "VideoEncoder" in window &&
        "VideoDecoder" in window
    );
  }, []);

  const commonFpsOptions = [24, 25, 30, 50, 60];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-foreground mb-3">
            Output Format
          </label>
          <div className="flex gap-2">
            <Button
              variant={outputFormat === "webm" ? "default" : "outline"}
              onClick={() => onFormatChange("webm")}
              className="flex-1"
            >
              WebM
            </Button>
            <Button
              variant={outputFormat === "mp4" ? "default" : "outline"}
              onClick={() => onFormatChange("mp4")}
              className="flex-1"
            >
              MP4
            </Button>
          </div>
          {webCodecsSupported && (
            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
              <Check className="h-3 w-3" /> WebCodecs supported
            </p>
          )}
          {!webCodecsSupported && (
            <p className="text-xs text-muted-foreground mt-2">
              Using fallback encoder
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-3">
            Frame Rate: {fps} fps
          </label>
          <div className="grid grid-cols-5 gap-2">
            {commonFpsOptions.map((fpsOption) => (
              <Button
                key={fpsOption}
                variant={fps === fpsOption ? "default" : "outline"}
                onClick={() => onFpsChange(fpsOption)}
                size="sm"
              >
                {fpsOption}
              </Button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Current video: {fps} fps
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-foreground mb-3">
            Quality: {Math.round(quality * 100)}%
          </label>
          <Slider
            value={[quality]}
            onValueChange={(value) => onQualityChange(value[0])}
            min={0.1}
            max={1}
            step={0.1}
            className="mt-2"
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-2">
            <span>Low</span>
            <span>High</span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-3">
            Bitrate: {(bitrate / 1000000).toFixed(1)} Mbps
          </label>
          <Slider
            value={[bitrate]}
            onValueChange={(value) => onBitrateChange(value[0])}
            min={500000}
            max={8000000}
            step={500000}
            className="mt-2"
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-2">
            <span>0.5</span>
            <span>8.0</span>
          </div>
        </div>
      </div>
    </div>
  );
}
