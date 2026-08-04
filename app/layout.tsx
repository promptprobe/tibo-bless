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
  title: "Tibos Mercy — Codex Reset Intelligence",
  description:
    "A bilingual monitor for verified Codex resets, reasoning Juice, and capability signals.",
  applicationName: "Tibos Mercy",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [{ url: "/icon-192.png", sizes: "192x192", type: "image/png" }, { url: "/icon-512.png", sizes: "512x512", type: "image/png" }],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "Tibos Mercy" },
  openGraph: {
    title: "Tibos Mercy",
    description:
      "Verified Codex reset evidence, forecast probabilities, Juice, and capability signals — in Korean and English.",
    type: "website",
    locale: "ko_KR",
    alternateLocale: "en_US",
    images: [{ url: "/og.png", width: 1731, height: 909, alt: "Tibos Mercy — Codex Reset Intelligence" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Tibos Mercy",
    description: "Bilingual Codex reset intelligence.",
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
