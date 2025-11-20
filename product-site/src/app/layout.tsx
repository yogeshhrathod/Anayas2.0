import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Anayas - The Professional API Client for Developers",
  description: "Experience the speed of a native API client. Anayas offers zero-latency requests, smart collections, and a beautiful interface designed for modern development.",
  keywords: ["API Client", "Rest API", "Developer Tools", "Electron", "React", "Anayas"],
  openGraph: {
    title: "Anayas - The Professional API Client",
    description: "Built for speed. Designed for developers.",
    type: "website",
    url: "https://anayas.app", // Placeholder
    images: [
      {
        url: "/og-image.png", // Placeholder
        width: 1200,
        height: 630,
        alt: "Anayas API Client",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Anayas - The Professional API Client",
    description: "Built for speed. Designed for developers.",
  },
};

import { Navbar } from "@/components/navbar";
import { SmoothScrollProvider } from "@/components/providers/smooth-scroll";
import { BackgroundParticles } from "@/components/ui/background-particles";
import { CanvasWrapper } from "@/components/3d/canvas-wrapper";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <SmoothScrollProvider>
          <CanvasWrapper />
          <BackgroundParticles />
          <Navbar />
          {children}
        </SmoothScrollProvider>
      </body>
    </html>
  );
}
