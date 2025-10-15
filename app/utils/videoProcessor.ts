import { Muxer, ArrayBufferTarget } from "webm-muxer";

interface ProcessVideoOptions {
  file: File;
  startTime: number;
  endTime: number;
  outputFormat: "webm" | "mp4";
  quality: number;
  bitrate: number;
  fps: number;
  onProgress: (progress: number) => void;
}

export async function processVideo(
  options: ProcessVideoOptions
): Promise<Blob> {
  const {
    file,
    startTime,
    endTime,
    outputFormat,
    quality,
    bitrate,
    onProgress,
  } = options;

  // Check if WebCodecs is supported
  const webCodecsSupported =
    typeof window !== "undefined" &&
    "VideoEncoder" in window &&
    "VideoDecoder" in window;

  if (webCodecsSupported && outputFormat === "webm") {
    return processWithWebCodecs(options);
  } else {
    return processWithMediaRecorder(options);
  }
}

async function processWithWebCodecs(
  options: ProcessVideoOptions
): Promise<Blob> {
  const { file, startTime, endTime, bitrate, fps, onProgress } = options;

  return new Promise(async (resolve, reject) => {
    try {
      const video = document.createElement("video");
      video.src = URL.createObjectURL(file);
      video.muted = true;
      video.preload = "auto";

      await new Promise((res) => {
        video.onloadedmetadata = () => res(null);
      });

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d", { alpha: false })!;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Determine codec - try VP9 first, fallback to VP8
      let codec = "vp09.00.10.08";
      const vp9Supported = await VideoEncoder.isConfigSupported({
        codec: "vp09.00.10.08",
        width: canvas.width,
        height: canvas.height,
        bitrate,
        framerate: fps,
      });

      if (!vp9Supported.supported) {
        codec = "vp8";
      }

      // Set up WebM muxer
      const muxer = new Muxer({
        target: new ArrayBufferTarget(),
        video: {
          codec: codec === "vp8" ? "V_VP8" : "V_VP9",
          width: canvas.width,
          height: canvas.height,
          frameRate: fps,
        },
      });

      let frameCount = 0;
      const duration = endTime - startTime;
      const totalFrames = Math.ceil(duration * fps);

      const videoEncoder = new VideoEncoder({
        output: (chunk, metadata) => {
          muxer.addVideoChunk(chunk, metadata);
        },
        error: (e) => {
          console.error("VideoEncoder error:", e);
          reject(e);
        },
      });

      videoEncoder.configure({
        codec,
        width: canvas.width,
        height: canvas.height,
        bitrate,
        framerate: fps,
      });

      // Process frames sequentially
      const processFrames = async () => {
        try {
          console.log(
            `Processing ${totalFrames} frames from ${startTime}s to ${endTime}s`
          );

          for (let i = 0; i < totalFrames; i++) {
            const currentFrameTime = startTime + i / fps;

            if (currentFrameTime > endTime) break;

            // Seek to the frame time
            video.currentTime = currentFrameTime;
            await new Promise<void>((res, rej) => {
              const seekHandler = () => {
                video.removeEventListener("seeked", seekHandler);
                res();
              };
              const errorHandler = () => {
                video.removeEventListener("error", errorHandler);
                rej(new Error("Video seek failed"));
              };
              video.addEventListener("seeked", seekHandler);
              video.addEventListener("error", errorHandler);

              // Add timeout in case seeking never completes
              setTimeout(() => {
                video.removeEventListener("seeked", seekHandler);
                video.removeEventListener("error", errorHandler);
                res(); // Continue anyway
              }, 1000);
            });

            // Draw the current frame
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

            // Create VideoFrame from canvas
            const videoFrame = new VideoFrame(canvas, {
              timestamp: (i * 1_000_000) / fps,
            });

            // Encode the frame
            videoEncoder.encode(videoFrame, { keyFrame: i % 150 === 0 });
            videoFrame.close();

            frameCount++;
            const progress = (frameCount / totalFrames) * 100;
            onProgress(progress);

            // Log progress every 30 frames (1 second)
            if (i % 30 === 0) {
              console.log(
                `Encoded ${i}/${totalFrames} frames (${progress.toFixed(1)}%)`
              );
            }
          }

          console.log("Flushing encoder...");
          // Finalize encoding
          await videoEncoder.flush();
          videoEncoder.close();
          muxer.finalize();

          const buffer = (muxer.target as ArrayBufferTarget).buffer;
          console.log(
            `WebM file created: ${(buffer.byteLength / 1024 / 1024).toFixed(
              2
            )} MB`
          );
          URL.revokeObjectURL(video.src);
          resolve(new Blob([buffer], { type: "video/webm" }));
        } catch (err) {
          console.error("Frame processing error:", err);
          videoEncoder.close();
          URL.revokeObjectURL(video.src);
          reject(err);
        }
      };

      // Start processing after initial seek
      video.currentTime = startTime;
      await new Promise<void>((res) => {
        const seekHandler = () => {
          video.removeEventListener("seeked", seekHandler);
          res();
        };
        video.addEventListener("seeked", seekHandler);
      });

      processFrames();
    } catch (error) {
      reject(error);
    }
  });
}

async function processWithMediaRecorder(
  options: ProcessVideoOptions
): Promise<Blob> {
  const { file, startTime, endTime, outputFormat, bitrate, fps, onProgress } =
    options;

  return new Promise(async (resolve, reject) => {
    try {
      const video = document.createElement("video");
      video.src = URL.createObjectURL(file);
      video.muted = true;
      video.preload = "auto";

      await new Promise((res, rej) => {
        video.onloadedmetadata = () => res(null);
        video.onerror = () => rej(new Error("Failed to load video"));
      });

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d", { alpha: false })!;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const stream = canvas.captureStream(fps);

      const mimeType =
        outputFormat === "webm" ? "video/webm; codecs=vp8" : "video/mp4";

      // Check if the desired mimeType is supported
      const supportedMimeType = MediaRecorder.isTypeSupported(mimeType)
        ? mimeType
        : MediaRecorder.isTypeSupported("video/webm")
        ? "video/webm"
        : "video/webm;codecs=vp8";

      const recorder = new MediaRecorder(stream, {
        mimeType: supportedMimeType,
        videoBitsPerSecond: bitrate,
      });

      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, {
          type: outputFormat === "webm" ? "video/webm" : "video/mp4",
        });
        URL.revokeObjectURL(video.src);
        resolve(blob);
      };

      recorder.onerror = (e) => {
        URL.revokeObjectURL(video.src);
        reject(e);
      };

      // Start recording
      recorder.start(100); // Collect data every 100ms

      // Set up video to start at startTime
      video.currentTime = startTime;
      await new Promise((res) => {
        video.onseeked = () => res(null);
      });

      const duration = endTime - startTime;
      let recordingStartTime = Date.now();

      // Draw frames to canvas
      const drawFrame = () => {
        if (video.currentTime < endTime && recorder.state === "recording") {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

          const elapsed = (Date.now() - recordingStartTime) / 1000;
          const progress = Math.min((elapsed / duration) * 100, 100);
          onProgress(progress);

          requestAnimationFrame(drawFrame);
        }
      };

      // Start playback
      video.play().then(() => {
        recordingStartTime = Date.now();
        drawFrame();
      });

      // Set up time update listener
      video.ontimeupdate = () => {
        if (video.currentTime >= endTime) {
          video.pause();
          setTimeout(() => {
            recorder.stop();
          }, 200); // Small delay to ensure last frames are captured
        }
      };

      // Fallback timeout to ensure recording stops
      setTimeout(() => {
        if (recorder.state === "recording") {
          recorder.stop();
          video.pause();
        }
      }, (duration + 2) * 1000); // Add 2 seconds buffer
    } catch (error) {
      reject(error);
    }
  });
}

// Helper function to detect video codec
export async function detectVideoCodec(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.src = URL.createObjectURL(file);

    video.onloadedmetadata = () => {
      // Try to determine codec from the file
      const videoTrack = (video as any).videoTracks?.[0];
      if (videoTrack) {
        resolve(videoTrack.label || "unknown");
      } else {
        // Fallback: check MIME type
        resolve(file.type);
      }
      URL.revokeObjectURL(video.src);
    };

    video.onerror = () => {
      URL.revokeObjectURL(video.src);
      reject(new Error("Failed to load video"));
    };
  });
}

// Check WebCodecs support for specific codec
export async function checkCodecSupport(codec: string): Promise<boolean> {
  if (typeof window === "undefined" || !("VideoEncoder" in window)) {
    return false;
  }

  try {
    const config = await VideoEncoder.isConfigSupported({
      codec,
      width: 1920,
      height: 1080,
      bitrate: 2000000,
      framerate: 30,
    });
    return config.supported || false;
  } catch {
    return false;
  }
}

// Detect video FPS by analyzing frame timing
export async function detectVideoFPS(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    const videoUrl = URL.createObjectURL(file);
    video.src = videoUrl;
    video.muted = true;
    video.preload = "metadata";

    const cleanup = () => {
      URL.revokeObjectURL(videoUrl);
    };

    video.onloadedmetadata = () => {
      // Try to detect FPS using requestVideoFrameCallback if available
      if ("requestVideoFrameCallback" in video) {
        const frameTimes: number[] = [];
        let frameCount = 0;
        const maxFrames = 10;

        const measureFrameRate = () => {
          (video as any).requestVideoFrameCallback(
            (now: number, metadata: any) => {
              frameTimes.push(now);
              frameCount++;

              if (frameCount < maxFrames) {
                measureFrameRate();
              } else {
                // Calculate average time between frames
                const intervals: number[] = [];
                for (let i = 1; i < frameTimes.length; i++) {
                  intervals.push(frameTimes[i] - frameTimes[i - 1]);
                }

                const avgInterval =
                  intervals.reduce((a, b) => a + b, 0) / intervals.length;
                const detectedFps = Math.round(1000 / avgInterval);

                // Snap to common FPS values
                const commonFps = [24, 25, 30, 50, 60];
                const closest = commonFps.reduce((prev, curr) => {
                  return Math.abs(curr - detectedFps) <
                    Math.abs(prev - detectedFps)
                    ? curr
                    : prev;
                });

                video.pause();
                cleanup();
                resolve(closest);
              }
            }
          );
        };

        video.currentTime = 0;
        video.play().catch(() => {
          // If play fails, just default to 30fps
          cleanup();
          resolve(30);
        });
        measureFrameRate();
      } else {
        // Fallback: Use common defaults based on region/format
        // Most videos are 30fps or 24fps, default to 30
        cleanup();
        resolve(30);
      }
    };

    video.onerror = () => {
      cleanup();
      reject(new Error("Failed to load video for FPS detection"));
    };
  });
}
