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
  metadataBase: new URL("https://tibos-mercy.cloudy-gull-7634.chatgpt.site"),
  title: "Tibo Bless — Codex Reset Monitor",
  description:
    "A simple bilingual monitor for verified Codex resets and next-reset probabilities.",
  applicationName: "Tibo Bless",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [{ url: "/icon-192.png", sizes: "192x192", type: "image/png" }, { url: "/icon-512.png", sizes: "512x512", type: "image/png" }],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "Tibo Bless" },
  openGraph: {
    title: "Tibo Bless",
    description:
      "Verified Codex reset evidence and next-reset probabilities — in Korean and English.",
    type: "website",
    locale: "ko_KR",
    alternateLocale: "en_US",
    images: [{ url: "/og.png", width: 1731, height: 909, alt: "Tibo Bless — Codex Reset Monitor" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Tibo Bless",
    description: "Simple bilingual Codex reset monitor.",
    images: ["/og.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
