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
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <InstantShareProvider>
          <div className="pattern"></div>
          {children}
          <SessionExpiredOverlay />
        </InstantShareProvider>
      </body>
    </html>
  );
}
