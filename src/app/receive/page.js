"use client";
import Link from "next/link";
import React, { useEffect, useRef } from "react";
import { useApp } from "../InstantShareContext";

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

/* Minimal QR generator behavior */
class QRCodeGenerator {
  constructor(canvas, text, size = 200) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.size = size;
    this.canvas.width = size;
    this.canvas.height = size;
    this.generate(text);
  }
  generate(text) {
    const moduleSize = this.size / 25;
    this.ctx.fillStyle = "#000";
    this.ctx.fillRect(0, 0, this.size, this.size);
    this.ctx.fillStyle = "#fff";
    const hash = this.simpleHash(text);
    for (let x = 0; x < 25; x++) {
      for (let y = 0; y < 25; y++) {
        const shouldFill = (hash + x * 25 + y) % 3 === 0;
        if (shouldFill)
          this.ctx.fillRect(x * moduleSize, y * moduleSize, moduleSize, moduleSize);
      }
    }
    this.drawCorner(0, 0, moduleSize);
    this.drawCorner(18 * moduleSize, 0, moduleSize);
    this.drawCorner(0, 18 * moduleSize, moduleSize);
  }
  drawCorner(x, y, size) {
    this.ctx.fillStyle = "#fff";
    this.ctx.fillRect(x, y, size * 7, size * 7);
    this.ctx.fillStyle = "#000";
    this.ctx.fillRect(x + size, y + size, size * 5, size * 5);
    this.ctx.fillStyle = "#fff";
    this.ctx.fillRect(x + size * 2, y + size * 2, size * 3, size * 3);
  }
  simpleHash(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) {
      h = (h << 5) - h + str.charCodeAt(i);
      h = h & h;
    }
    return Math.abs(h);
  }
}

function QRCanvas({ code, secret }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!ref.current || !code || !secret) return;
    const data = `app://send?code=${code.replace("-", "")}&secret=${secret}`;
    new QRCodeGenerator(ref.current, data);
  }, [code, secret]);
  return (
    <canvas
      ref={ref}
      aria-label="QR code"
      className="block w-[200px] h-[200px]"
    />
  );
}

export default function ReceivePage() {
  const {
    currentSession,
    createPairing,
    timeLeft,
    formatTime,
    autoDownload,
    toggleAutoDownload,
    isConnected,
    files,
    formatFileSize,
    downloadFile,
    bus,
  } = useApp();

  useEffect(() => {
    const off = bus.on("phoneJoined", () => {});
    return off;
  }, [bus]);

  const receivedFiles = files.filter(
    (f) => f.status === "uploaded" || f.status === "downloaded"
  );

  return (
    <div className="max-w-[1200px] mx-auto px-8">
      <Nav />

      <div className="min-h-[70vh]" id="receive">
        <div className="text-center">
         <h1 className="text-[clamp(2rem,5vw,3.5rem)] font-normal leading-[1.2] tracking-[-0.01em] mb-6">
  Ready to receive
</h1>

          <p className="text-[1.125rem] text-[#999] leading-[1.6] text-center max-w-[600px] mx-auto mb-16">
            Share the code or QR with the sending device
          </p>
        </div>

        {!currentSession && (
  <div className="bg-[#111] border border-[#222] rounded-lg p-12 text-center transition hover:bg-[#1a1a1a] hover:border-[#666] focus-outline">
    <div className="flex items-center justify-center gap-6 mb-8">
      <div className="w-8 h-8 rounded bg-[rgba(255,215,0,0.1)] text-[#ffd700] flex items-center justify-center text-base">
        ⏳
      </div>
      <div>
        <h3 className="text-[clamp(1.5rem,3vw,2rem)] leading-[1.3] font-normal mb-4">
          Create Pairing Session
        </h3>
        <p className="text-base text-[#999] leading-[1.6]">
          Generate a secure code for file sharing
        </p>
      </div>
    </div>

    <button
      onClick={createPairing}
      className="inline-flex items-center justify-center px-12 py-6 rounded-[4px] text-black font-medium text-base bg-[#00ff88] border border-[#00ff88] hover:opacity-90 transition whitespace-nowrap"
    >
      Create Pairing
    </button>
  </div>
)}

        {currentSession && !isConnected && (
          <div className="bg-[#111] border border-[#222] rounded-lg p-12 text-center transition hover:bg-[#1a1a1a] hover:border-[#666] focus-outline">
            <div className="flex items-center justify-center gap-6 mb-8">
              <div className="w-8 h-8 rounded bg-[rgba(0,255,136,0.1)] text-[#00ff88] flex items-center justify-center text-base">
                ✓
              </div>
              <h3 className="text-[clamp(1.5rem,3vw,2rem)] leading-[1.3] font-normal">Session Active</h3>
            </div>

            <div className="text-center my-16"> {/* qr-section */}
  <div className="inline-block p-8 bg-white rounded-lg my-8 border border-[#222]"> {/* qr-wrapper */}
    <QRCanvas code={currentSession.code} secret={currentSession.secret} />
  </div>
  <div
    id="codeDisplay"
    className="font-mono text-[2rem] font-semibold tracking-[0.1em] text-white mt-8 mb-4"
  >
    {currentSession.code}
  </div>
  <div className="text-sm text-[#666]">
    Expires in <span id="timeLeft" className="align-center">{formatTime(timeLeft)}</span>
  </div>
</div>


            <div className="flex items-center justify-center gap-6 my-12">
              <label htmlFor="autoDownload" className="text-sm text-[#999]">
                Auto-download files
              </label>
              <div
                role="switch"
                aria-checked={autoDownload}
                tabIndex={0}
                onClick={toggleAutoDownload}
                className={`relative w-12 h-6 border rounded-[12px] cursor-pointer transition ${
                  autoDownload ? "bg-[#00ff88] border-[#00ff88]" : "bg-[#111] border-[#222]"
                }`}
              >
                <div
                  className={`absolute top-[2px] left-[2px] w-[18px] h-[18px] rounded-full transition ${
                    autoDownload
                      ? "translate-x-6 bg-black"
                      : "translate-x-0 bg-white"
                  }`}
                />
              </div>
            </div>
          </div>
        )}

        {isConnected && (
          <div id="connectedState">
            <div className="bg-[#111] border border-[#222] rounded-lg p-8 transition hover:bg-[#1a1a1a] hover:border-[#666] focus-outline">
              <div className="flex items-center gap-6 mb-8">
                <div className="w-8 h-8 rounded bg-[rgba(0,255,136,0.1)] text-[#00ff88] flex items-center justify-center text-base">
                  ✓
                </div>
                <div>
                  <h3 className="text-[clamp(1.5rem,3vw,2rem)] leading-[1.3] font-normal">Connected</h3>
                  <p className="text-base text-[#999] leading-[1.6]">
                    Devices are paired and ready for file transfer
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-[#111] border border-[#222] rounded-lg p-8 mt-8 transition hover:bg-[#1a1a1a] hover:border-[#666] focus-outline">
              <h3 className="text-2xl font-normal mb-4">Inbox</h3>

              <div id="inboxList" className="my-12">
                {receivedFiles.length === 0 ? (
                  <div className="text-center text-[#666] py-10">
                    <p>Waiting for files...</p>
                  </div>
                ) : (
                  receivedFiles.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center justify-between p-6 bg-[#111] border border-[#222] rounded mb-4 transition hover:bg-[#1a1a1a] hover:border-[#666]"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded bg-[#00ff88] text-black flex items-center justify-center text-sm">
                          📄
                        </div>
                        <div>
                          <h4 className="text-sm font-medium mb-[2px]">
                            {file.name}
                          </h4>
                          <p className="text-xs text-[#666]">
                            {formatFileSize(file.size)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {file.status === "uploaded" ? (
                          <button
                            onClick={() => downloadFile(file.id)}
                            className="inline-flex items-center justify-center px-4 py-2 rounded bg-[#111] border border-[#222] text-white text-sm font-medium hover:bg-[#1a1a1a] hover:border-[#666] transition"
                          >
                            Download
                          </button>
                        ) : (
                          <span className="text-xs text-[#666]">Downloaded</span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
