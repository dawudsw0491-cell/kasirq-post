import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Toko Wiwid | POS",
  description: "Sistem kasir dan operasional Toko Wiwid"
};

export default function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
