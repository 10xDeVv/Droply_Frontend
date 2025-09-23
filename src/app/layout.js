import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import InstantShareProvider from "./InstantShareContext";
import SessionExpiredOverlay from "./SessionExpiredOverlay";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Droply - Instant File Sharing",
  description: "Instant file sharing for anyone",
};

export default function RootLayout({ children }) {
  return (
      <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-black text-white font-sans leading-relaxed`}>
      <InstantShareProvider>
        <div className="pattern fixed bottom-0 left-0 right-0 h-48 pointer-events-none -z-10 opacity-30"></div>
        {children}
        <SessionExpiredOverlay />
      </InstantShareProvider>
      </body>
      </html>
  );
}