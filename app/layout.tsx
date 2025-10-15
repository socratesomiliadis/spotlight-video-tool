import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import Header from "@/components/header";

const helveticaNow = localFont({
  src: "../fonts/HelveticaNowVar.woff2",
  variable: "--font-helvetica-now",
});

export const metadata: Metadata = {
  title: "Spotlight — Video Tool",
  description:
    "A tool to trim, compress, and convert videos directly in your browser.",
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "Spotlight — Video Tool",
    type: "website",
    url: "https://video-tool.spotlight.day",
    description:
      "A tool to trim, compress, and convert videos directly in your browser.",
    images: [
      {
        url: "https://video-tool.spotlight.day/ogImage.png",
        width: 1600,
        height: 900,
        alt: "Preview image for Spotlight — Video Tool",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@SpotlightDay",
  },
  robots: "index, follow",
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
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
