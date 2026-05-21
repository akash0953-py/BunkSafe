import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BunkSafe — Smart Attendance Planner",
  description:
    "Know exactly how many classes you can skip safely. AI-powered attendance planning for college students.",
  manifest: "/manifest.json",
  themeColor: "#0a0a0f",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
