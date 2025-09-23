"use client";
import Link from "next/link";
import InstantShareProvider from "@/app/InstantShareContext";

function Nav() {
  return (
      <nav className="flex items-center justify-between py-12 mb-16">
        <div className="text-lg font-medium text-white">Droply</div>
        <Link href="/" className="text-sm text-gray-400 px-4 py-2 transition-colors duration-150 hover:text-white">Home</Link>
      </nav>
  );
}

function Landing() {
  return (
      <div className="min-h-[70vh]">
        <div className="text-center py-16">
          <div className="inline-flex items-center gap-2 text-xs uppercase tracking-wide text-[#00ff88] mb-8">
            <span className="text-[#00ff88]">●</span>
            Available Now
          </div>
          <h1 className="text-6xl lg:text-8xl xl:text-9xl font-normal leading-none tracking-tight mb-8 text-center">
            Instant file sharing for<br/><i>anyone</i>
          </h1>
          <p className="text-lg text-gray-400 leading-relaxed text-center max-w-2xl mx-auto mb-16">
            I was too lazy to use cables so I made this app instead...lol
          </p>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mt-16">
            <Link href="/receive" className="bg-gray-900 border border-gray-800 rounded-lg p-12 transition-all duration-150 hover:bg-gray-800 hover:border-gray-500 hover:-translate-y-0.5 cursor-pointer block">
              <h3 className="text-2xl lg:text-3xl font-normal leading-tight mb-4">Receive files</h3>
              <p className="text-base text-gray-400 leading-relaxed mb-8">Create a secure session on this device to receive files from your phone or another device. Generate a code instantly.</p>
              <div className="inline-flex items-center gap-2 px-6 py-4 border border-gray-800 rounded bg-white text-black text-base font-medium transition-colors duration-150 hover:bg-gray-300 hover:border-gray-500">
                Start Receiving →
              </div>
            </Link>
            <Link href="/send" className="bg-gray-900 border border-gray-800 rounded-lg p-12 transition-all duration-150 hover:bg-gray-800 hover:border-gray-500 hover:-translate-y-0.5 cursor-pointer block">
              <h3 className="text-2xl lg:text-3xl font-normal leading-tight mb-4">Send files</h3>
              <p className="text-base text-gray-400 leading-relaxed mb-8">Join an existing session with a code or QR scan to instantly share your files. Works with any file type.</p>
              <div className="inline-flex items-center gap-2 px-6 py-4 border border-gray-800 rounded bg-white text-black text-base font-medium transition-colors duration-150 hover:bg-gray-300 hover:border-gray-500">
                Start Sending →
              </div>
            </Link>
          </div>
        </div>
      </div>
  );
}

export default function Home() {
  return (
      <InstantShareProvider>
        <div className="max-w-7xl mx-auto px-8">
          <Nav />
          <Landing />
        </div>
      </InstantShareProvider>
  );
}