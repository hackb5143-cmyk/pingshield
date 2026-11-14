import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PingShield — Private Item Recovery",
  description: "Help return a tagged item with a recovery note and consent-based location sharing.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
