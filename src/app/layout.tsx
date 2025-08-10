import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: "Клуб молосольных огурчиков🥒",
  description: "Интерактивная игровая экономика с работами, кредитами, переводами и Депалкой",
  keywords: ["игра", "экономика", "деньги", "работа", "кредиты", "депалка", "огурчики"],
  openGraph: {
    title: "Клуб молосольных огурчиков🥒",
    description: "Интерактивная игровая экономика с Депалкой",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Клуб молосольных огурчиков🥒",
    description: "Интерактивная игровая экономика",
  },
  viewport: "width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes",
  robots: "index, follow",
  authors: [{ name: "Клуб молосольных огурчиков" }],
  creator: "Клуб молосольных огурчиков",
  publisher: "Клуб молосольных огурчиков",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'),
  alternates: {
    canonical: '/',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Огурчики🥒" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-TileColor" content="#10b981" />
        <meta name="msapplication-tap-highlight" content="no" />
      </head>
      <body className="antialiased bg-background text-foreground">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
