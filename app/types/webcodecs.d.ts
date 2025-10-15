// WebCodecs API Type Definitions
// https://www.w3.org/TR/webcodecs/

interface VideoEncoderConfig {
  codec: string;
  width: number;
  height: number;
  bitrate?: number;
  framerate?: number;
  hardwareAcceleration?:
    | "no-preference"
    | "prefer-hardware"
    | "prefer-software";
  alpha?: "discard" | "keep";
  scalabilityMode?: string;
  bitrateMode?: "constant" | "variable";
  latencyMode?: "quality" | "realtime";
}

interface VideoEncoderSupport {
  supported: boolean;
  config: VideoEncoderConfig;
}

interface EncodedVideoChunkMetadata {
  decoderConfig?: {
    codec: string;
    codedWidth?: number;
    codedHeight?: number;
    displayAspectWidth?: number;
    displayAspectHeight?: number;
    description?: BufferSource;
  };
  svc?: {
    temporalLayerId?: number;
  };
  alphaSideData?: BufferSource;
}

interface VideoEncoderInit {
  output: (
    chunk: EncodedVideoChunk,
    metadata?: EncodedVideoChunkMetadata
  ) => void;
  error: (error: Error) => void;
}

interface VideoFrameInit {
  timestamp: number;
  duration?: number;
  alpha?: "discard" | "keep";
  visibleRect?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  displayWidth?: number;
  displayHeight?: number;
}

declare class VideoEncoder {
  constructor(init: VideoEncoderInit);
  configure(config: VideoEncoderConfig): void;
  encode(frame: VideoFrame, options?: { keyFrame?: boolean }): void;
  flush(): Promise<void>;
  reset(): void;
  close(): void;
  readonly state: "unconfigured" | "configured" | "closed";
  readonly encodeQueueSize: number;
  static isConfigSupported(
    config: VideoEncoderConfig
  ): Promise<VideoEncoderSupport>;
}

declare class VideoFrame {
  constructor(image: CanvasImageSource | ImageBitmap, init?: VideoFrameInit);
  constructor(
    data: BufferSource,
    init: VideoFrameInit & {
      format: string;
      codedWidth: number;
      codedHeight: number;
    }
  );
  readonly format: string | null;
  readonly codedWidth: number;
  readonly codedHeight: number;
  readonly displayWidth: number;
  readonly displayHeight: number;
  readonly timestamp: number;
  readonly duration: number | null;
  readonly colorSpace: VideoColorSpace;
  clone(): VideoFrame;
  close(): void;
}

declare class EncodedVideoChunk {
  constructor(init: {
    type: "key" | "delta";
    timestamp: number;
    duration?: number;
    data: BufferSource;
  });
  readonly type: "key" | "delta";
  readonly timestamp: number;
  readonly duration: number | null;
  readonly byteLength: number;
  copyTo(destination: BufferSource): void;
}

declare class VideoColorSpace {
  constructor(init?: {
    primaries?: string;
    transfer?: string;
    matrix?: string;
    fullRange?: boolean;
  });
  readonly primaries: string | null;
  readonly transfer: string | null;
  readonly matrix: string | null;
  readonly fullRange: boolean | null;
}

interface VideoDecoderConfig {
  codec: string;
  description?: BufferSource;
  codedWidth?: number;
  codedHeight?: number;
  displayAspectWidth?: number;
  displayAspectHeight?: number;
  colorSpace?: {
    primaries?: string;
    transfer?: string;
    matrix?: string;
    fullRange?: boolean;
  };
  hardwareAcceleration?:
    | "no-preference"
    | "prefer-hardware"
    | "prefer-software";
  optimizeForLatency?: boolean;
}

interface VideoDecoderInit {
  output: (frame: VideoFrame) => void;
  error: (error: Error) => void;
}

declare class VideoDecoder {
  constructor(init: VideoDecoderInit);
  configure(config: VideoDecoderConfig): void;
  decode(chunk: EncodedVideoChunk): void;
  flush(): Promise<void>;
  reset(): void;
  close(): void;
  readonly state: "unconfigured" | "configured" | "closed";
  readonly decodeQueueSize: number;
  static isConfigSupported(config: VideoDecoderConfig): Promise<{
    supported: boolean;
    config: VideoDecoderConfig;
  }>;
}

// Extend Window interface
interface Window {
  VideoEncoder: typeof VideoEncoder;
  VideoDecoder: typeof VideoDecoder;
  VideoFrame: typeof VideoFrame;
  EncodedVideoChunk: typeof EncodedVideoChunk;
  VideoColorSpace: typeof VideoColorSpace;
}

// Extend HTMLMediaElement for captureStream
interface HTMLMediaElement {
  captureStream?(): MediaStream;
}
