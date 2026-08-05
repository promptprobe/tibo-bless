import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  // vinext currently omits Viewport.viewportFit, so keep the valid token in
  // the serialized width value until its metadata shim supports the field.
  width: "device-width, viewport-fit=cover",
  initialScale: 1,
  themeColor: "#ebe8e4",
  colorScheme: "light",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://tibobless.vercel.app"),
  title: "티보의 은총 — Tibo Bless",
  description:
    "티보의 은총 기록과 공개 신호로 24·48시간 확률을 보여주는 한국어·영어 PWA.",
  applicationName: "Tibo Bless",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/tibo-bless-icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/tibo-bless-icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/tibo-bless-apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Tibo Bless" },
  openGraph: {
    title: "티보의 은총 | Tibo Bless",
    description:
      "은총 기록과 공개 신호를 한국어와 영어로 확인하세요.",
    type: "website",
    locale: "ko_KR",
    alternateLocale: "en_US",
    images: [{ url: "/og.png", width: 1731, height: 909, alt: "티보의 은총 — Tibo Bless" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "티보의 은총 | Tibo Bless",
    description: "Bilingual mercy timeline and Codex signal monitor.",
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
      <body>{children}</body>
    </html>
  );
}
