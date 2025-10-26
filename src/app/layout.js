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
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-black text-white`}
      >
        <InstantShareProvider>
          <div
            aria-hidden
            className="fixed left-0 right-0 bottom-0 h-[200px] pointer-events-none opacity-30 -z-10"
            style={{
              backgroundImage:
                "radial-gradient(circle at 1px 1px, #666 1px, transparent 0)",
              backgroundSize: "20px 20px",
              backgroundPosition: "0 0, 10px 10px",
            }}
          />
          {children}
          <SessionExpiredOverlay />
        </InstantShareProvider>
      </body>
    </html>
  );
}
