import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BIO-CAPSULE | 2X PACK - الحل الأمثل للتوتر والأرق",
  description: "استعد توازنك الطبيعي مع باقة 2X PACK. نهار هادئ ونوم عميق بفضل تركيبة طبيعية 100%.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700;800;900&display=swap" rel="stylesheet" />
      </head>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
