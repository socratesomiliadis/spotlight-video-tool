# Video Editor - Browser-Based Video Processing Tool

A powerful, client-side video processing application built with Next.js that allows users to trim, compress, and convert videos directly in their browser using hardware acceleration.

## Features

### 🎬 Video Trimming

- Interactive timeline with drag-to-trim functionality
- Visual preview of selected region
- Precise start and end time controls
- Real-time video preview

### 🗜️ Video Compression

- Adjustable quality settings (10% - 100%)
- Configurable bitrate (0.5 - 8.0 Mbps)
- Hardware-accelerated encoding when supported

### 🔄 Format Conversion

- **WebM Output**: VP9/VP8 codec with WebCodecs API
- **MP4 Output**: H.264 fallback support
- Automatic codec detection and optimization
- Graceful fallback for unsupported browsers

### ⚡ Performance

- **WebCodecs API**: Uses hardware-accelerated encoding when supported (Chrome, Edge, Opera)
- **MediaRecorder Fallback**: Works in all modern browsers
- **Client-Side Processing**: All processing happens locally - no server uploads required
- **Progress Tracking**: Real-time progress indicator during export

## Technology Stack

- **Framework**: Next.js 15 (App Router)
- **UI**: React 19 + Tailwind CSS 4 + shadcn/ui
- **Design**: Minimal black and white theme
- **Video Processing**:
  - WebCodecs API (primary)
  - MediaRecorder API (fallback)
  - Canvas API for frame manipulation

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm (or npm/yarn)

### Installation

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to use the app.

### Build for Production

```bash
pnpm build
pnpm start
```

## How It Works

### WebCodecs API (Modern Browsers)

1. Decodes input video frames
2. Extracts frames within the trim selection
3. Re-encodes frames with specified quality/bitrate settings
4. Outputs optimized WebM file

### MediaRecorder Fallback (All Browsers)

1. Creates canvas element matching video dimensions
2. Captures canvas stream at 30fps
3. Records stream during trim selection
4. Outputs video file in supported format

## Browser Compatibility

| Feature       | Chrome | Edge   | Firefox | Safari |
| ------------- | ------ | ------ | ------- | ------ |
| WebCodecs API | ✅ 94+ | ✅ 94+ | ❌      | ❌     |
| MediaRecorder | ✅     | ✅     | ✅      | ✅ 14+ |
| WebM Export   | ✅     | ✅     | ✅      | ❌     |
| MP4 Export    | ✅     | ✅     | Varies  | ✅     |

## Supported Input Formats

The app supports any video format that your browser can play:

- MP4 (H.264, H.265)
- WebM (VP8, VP9)
- MOV
- AVI (if browser supports)
- And more...

## Limitations

- **File Size**: Processing large videos (>500MB) may be slow or cause memory issues
- **Safari**: WebCodecs not supported, uses MediaRecorder fallback
- **Firefox**: Limited WebM encoder support in MediaRecorder
- **Processing Time**: ~1-2x video duration for encoding (varies by hardware)
- **Audio**: Audio tracks are not preserved in the output (video only)

## Project Structure

```
app/
├── components/
│   ├── VideoEditor.tsx       # Main editor container
│   ├── VideoPlayer.tsx       # Video player with controls
│   ├── VideoTimeline.tsx     # Interactive trim timeline
│   └── ConversionSettings.tsx # Format and quality settings
├── utils/
│   └── videoProcessor.ts     # Core video processing logic
├── types/
│   └── webcodecs.d.ts        # TypeScript definitions for WebCodecs
├── page.tsx                  # Landing page
└── globals.css               # Global styles with shadcn/ui theme
components/
└── ui/                       # shadcn/ui components
    ├── button.tsx
    ├── card.tsx
    ├── slider.tsx
    ├── progress.tsx
    └── separator.tsx
lib/
└── utils.ts                  # Utility functions (cn helper)
```

## UI Components

This project uses [shadcn/ui](https://ui.shadcn.com/) for a consistent, accessible component library with a minimal black and white design theme.

## Future Enhancements

- [ ] Audio track preservation during trimming
- [ ] Video filters and effects
- [ ] Batch processing multiple videos
- [ ] Thumbnail generation
- [ ] Advanced codec settings (GOP size, encoding profile)
- [ ] WebAssembly-based FFmpeg integration for broader codec support
- [ ] Dark mode toggle

## Contributing

This is a demonstration project. Feel free to fork and extend it for your needs!

## License

MIT

## Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)
- Icons from [Lucide](https://lucide.dev/)
- Video processing powered by [WebCodecs API](https://www.w3.org/TR/webcodecs/)
