import type { Metadata } from "next";
import "./globals.css";
import ThemeToggle from "@/components/ThemeToggle";

export const metadata: Metadata = {
  title: {
    default: "OKSA — Обирай. Замовляй. Отримуй.",
    template: "%s | OKSA"
  },
  description: "Сучасний український онлайн-маркетплейс OKSA.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://prostoshop.online"),
  robots: { index: true, follow: true }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="uk">
      <body>{children}<ThemeToggle /></body>
    </html>
  );
}