"use client";
import Link from "next/link";
import InstantShareProvider from "@/app/InstantShareContext";

function Nav() {
  return (
    <nav className="flex items-center justify-between py-12 mb-16">
      <div className="text-lg font-medium text-white">Droply</div>
      <Link
        href="/"
        className="text-sm text-[#999] px-4 py-2 hover:text-white transition"
      >
        Home
      </Link>
    </nav>
  );
}

function Landing() {
  return (
    <div className="min-h-[70vh]" id="landing">
      <div className="text-center py-16">
        <div className="inline-flex items-center gap-2 text-[0.75rem] leading-none uppercase tracking-[0.05em] text-[#00ff88] mb-8 before:content-['●'] before:inline-block before:transform before:translate-y-[-1px] before:text-[#00ff88]">
  Available Now
</div>


        <h1 className="group text-[clamp(3rem,8vw,6rem)] font-normal leading-[1.1] tracking-[-0.02em] mb-8 text-center">
          Instant file sharing for
  <br />
  <i
  className="
    text-metal
    group-hover:animate-[metal-sheen_1.6s_ease-in-out]
    [filter:drop-shadow(0_0.5px_0_rgba(255,255,255,0.15))]
    [text-shadow:0_-0.5px_0_rgba(0,0,0,0.25)]
    [will-change:background-position]
  "
>
    anyone
  </i>
        </h1>
        <p className="text-[1.125rem] text-[#999] leading-[1.6] text-center max-w-[600px] mx-auto mb-16">
          I was too lazy to use cables so I made this app instead...lol
        </p>

       <div className="grid [grid-template-columns:repeat(auto-fit,minmax(400px,1fr))] gap-12 mt-16">
  <Link
    href="/receive"
    className="block cursor-pointer bg-[#111] border border-[#222] rounded-lg p-12 transition hover:bg-[#1a1a1a] hover:border-[#666] hover:-translate-y-0.5 focus-outline"
  >
    <h3 className="text-[clamp(1.5rem,3vw,2rem)] leading-[1.3] font-normal mb-4">Receive files</h3>
    <p className="text-base text-[#999] leading-[1.6] mb-8">
      Create a secure session on this device to receive files from your
      phone or another device. Generate a code instantly.
    </p>
    <div className="inline-flex items-center justify-center px-12 py-6 rounded-[4px] text-black font-medium text-base bg-white border border-white hover:bg-[#999] hover:border-[#999] transition whitespace-nowrap">
      Start Receiving →
    </div>
  </Link>

  <Link
    href="/send"
    className="block cursor-pointer bg-[#111] border border-[#222] rounded-lg p-12 transition hover:bg-[#1a1a1a] hover:border-[#666] hover:-translate-y-0.5"
  >
    <h3 className="text-[clamp(1.5rem,3vw,2rem)] leading-[1.3] font-normal mb-4">Send files</h3>
    <p className="text-base text-[#999] leading-[1.6] mb-8">
      Join an existing session with a code or QR scan to instantly share
      your files. Works with any file type.
    </p>
    <div className="inline-flex items-center justify-center px-12 py-6 rounded-[4px] text-black font-medium text-base bg-white border border-white hover:bg-[#999] hover:border-[#999] transition whitespace-nowrap">
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
      <div className="max-w-[1200px] mx-auto px-8">
        <Nav />
        <Landing />
      </div>
  );
}
