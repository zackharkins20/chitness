import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Chitness",
  description: "Daily strength training tracker.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Chitness",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0b",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-dvh flex flex-col">{children}</body>
    </html>
  );
}
