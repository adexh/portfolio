import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { GoogleAnalytics } from '@next/third-parties/google'

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Adesh - WebDev",
  description: "Portfolio website of Adesh Tamrakar - Fullstack web developer",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <link rel="icon" href="/favicon.ico" sizes="any" />
      <link rel="apple-touch-icon" sizes="180x180" href="/favicon_io/apple-touch-icon.png"/>
      <link rel="icon" type="image/png" sizes="32x32" href="/favicon_io/favicon-32x32.png"/>
      <link rel="icon" type="image/png" sizes="16x16" href="/favicon_io/favicon-16x16.png"/>
      <link rel="manifest" href="/favicon_io/site.webmanifest"/>
      <body className={inter.className}>{children}</body>
      <GoogleAnalytics gaId={`${process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS}`} />
    </html>
  );
}