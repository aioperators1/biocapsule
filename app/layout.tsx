import type { Metadata } from "next";
import "./globals.css";
import { getSettings } from "@/lib/settings";
import FacebookPixel from "@/components/pixels/FacebookPixel";
import SnapchatPixel from "@/components/pixels/SnapchatPixel";
import TikTokPixel from "@/components/pixels/TikTokPixel";

export const metadata: Metadata = {
  title: "BIO-CAPSULE | 2X PACK - الحل الأمثل للتوتر والأرق",
  description: "استعد توازنك الطبيعي مع باقة 2X PACK. نهار هادئ ونوم عميق بفضل تركيبة طبيعية 100%.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const settings = await getSettings();

  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700;800;900&display=swap" rel="stylesheet" />
        <FacebookPixel pixelId={settings.facebookPixelId || '2125016868358712'} />
        {settings.snapchatPixelId && <SnapchatPixel pixelId={settings.snapchatPixelId} />}
        {settings.tiktokPixelId && <TikTokPixel pixelId={settings.tiktokPixelId} />}
      </head>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
