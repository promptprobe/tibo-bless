import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://tibos-mercy.cloudy-gull-7634.chatgpt.site"),
  title: "티보의 은총 — Tibo Bless",
  description:
    "티보의 은총 기록과 공개 신호로 24·48시간 확률을 보여주는 한국어·영어 PWA.",
  applicationName: "Tibo Bless",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [{ url: "/tibo-bless-logo.png", sizes: "1254x1254", type: "image/png" }],
    apple: [{ url: "/tibo-bless-logo.png", sizes: "1254x1254", type: "image/png" }],
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
