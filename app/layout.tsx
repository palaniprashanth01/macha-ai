import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Macha.ai — code-mix writing for Indian creators",
  description:
    "Rewrite drafts in calibrated Hinglish or Tanglish for Instagram, X, and WhatsApp.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
