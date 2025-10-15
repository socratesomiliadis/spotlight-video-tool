import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import Header from "@/components/header";

const helveticaNow = localFont({
  src: "../fonts/HelveticaNowVar.woff2",
  variable: "--font-helvetica-now",
});

export const metadata: Metadata = {
  title: "Video Editor - Trim, Compress & Convert",
  description:
    "Browser-based video processing tool. Trim, compress, and convert videos to WebM using hardware-accelerated WebCodecs API. All processing happens locally in your browser.",
  keywords: [
    "video editor",
    "video converter",
    "webm",
    "video compression",
    "webcodecs",
    "browser video editor",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${helveticaNow.variable} font-helvetica-now antialiased`}
      >
        <Header />
        {children}
      </body>
    </html>
  );
}
