"use client";
import Link from "next/link";
import React, { useEffect, useRef } from "react";
import { useApp } from "../InstantShareContext";

function Nav() {
  return (
      <nav className="flex items-center justify-between py-12 mb-16">
        <div className="text-lg font-medium text-white">Droply</div>
        <Link href="/" className="text-sm text-gray-400 px-4 py-2 transition-colors duration-150 hover:text-white">Home</Link>
      </nav>
  );
}

// Minimal QR generator copied behavior
class QRCodeGenerator {
  constructor(canvas, text, size = 200) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.size = size;
    this.canvas.width = size; this.canvas.height = size;
    this.generate(text);
  }
  generate(text) {
    const moduleSize = this.size / 25;
    this.ctx.fillStyle = '#000'; this.ctx.fillRect(0,0,this.size,this.size);
    this.ctx.fillStyle = '#fff';
    const hash = this.simpleHash(text);
    for (let x=0;x<25;x++) {
      for (let y=0;y<25;y++) {
        const shouldFill = (hash + x*25 + y) % 3 === 0;
        if (shouldFill) this.ctx.fillRect(x*moduleSize, y*moduleSize, moduleSize, moduleSize);
      }
    }
    this.drawCorner(0,0,moduleSize);
    this.drawCorner(18*moduleSize,0,moduleSize);
    this.drawCorner(0,18*moduleSize,moduleSize);
  }
  drawCorner(x,y,size){
    this.ctx.fillStyle = '#fff'; this.ctx.fillRect(x,y,size*7,size*7);
    this.ctx.fillStyle = '#000'; this.ctx.fillRect(x+size,y+size,size*5,size*5);
    this.ctx.fillStyle = '#fff'; this.ctx.fillRect(x+size*2,y+size*2,size*3,size*3);
  }
  simpleHash(str){ let h=0; for(let i=0;i<str.length;i++){ h=((h<<5)-h)+str.charCodeAt(i); h=h&h; } return Math.abs(h); }
}

function QRCanvas({ code, secret }){
  const ref = useRef(null);
  useEffect(() => {
    if (!ref.current || !code || !secret) return;
    const data = `app://send?code=${code.replace('-', '')}&secret=${secret}`;
    new QRCodeGenerator(ref.current, data);
  }, [code, secret]);
  return <canvas className="block w-48 h-48" ref={ref} aria-label="QR code"></canvas>;
}

export default function ReceivePage(){
  const { currentSession, createPairing, timeLeft, formatTime, autoDownload, toggleAutoDownload, isConnected, files, formatFileSize, downloadFile, bus } = useApp();

  useEffect(() => {
    const off = bus.on('phoneJoined', () => {});
    return off;
  }, [bus]);

  const receivedFiles = files.filter(f => f.status === 'uploaded' || f.status === 'downloaded');

  return (
      <div className="max-w-7xl mx-auto px-8">
        <Nav />

        <div className="min-h-[70vh]" id="receive">
          <div className="text-center mb-8">
            <h1 className="text-6xl lg:text-8xl xl:text-9xl font-normal leading-tight tracking-tight mb-6">Ready to receive</h1>
            <p className="text-lg text-gray-400 leading-relaxed text-center max-w-2xl mx-auto mb-16">Share the code or QR with the sending device</p>
          </div>

          {!currentSession && (
              <div id="pairingStep" className="bg-gray-900 border border-gray-800 rounded-lg p-12 text-center">
                <div className="flex items-center gap-6 mb-8 justify-center">
                  <div className="w-8 h-8 rounded flex items-center justify-center text-base bg-yellow-400/10 text-yellow-400">⏳</div>
                  <div>
                    <h3 className="text-2xl lg:text-3xl font-normal leading-tight">Create Pairing Session</h3>
                    <p className="text-base text-gray-400 leading-relaxed">Generate a secure code for file sharing</p>
                  </div>
                </div>
                <button
                    className="inline-flex items-center gap-2 px-6 py-4 border bg-[#00ff88] text-black border-[#00ff88] rounded text-base font-medium transition-all duration-150 hover:opacity-90"
                    onClick={createPairing}
                >
                  Create Pairing
                </button>
              </div>
          )}

          {currentSession && !isConnected && (
              <div id="pairingActive" className="bg-gray-900 border border-gray-800 rounded-lg p-12 text-center">
                <div className="flex items-center gap-6 mb-8 justify-center">
                  <div className="w-8 h-8 rounded flex items-center justify-center text-base bg-[rgba(0,255,136,0.1)] text-[#00ff88]">✓</div>
                  <h3 className="text-2xl lg:text-3xl font-normal leading-tight">Session Active</h3>
                </div>
                <div className="text-center my-8">
                  <div className="inline-block p-8 bg-white rounded-lg my-8 border border-gray-800">
                    <QRCanvas code={currentSession.code} secret={currentSession.secret} />
                  </div>
                  <div className="font-mono text-3xl font-semibold text-white tracking-wide my-8" id="codeDisplay">
                    {currentSession.code}
                  </div>
                  <div className="text-sm text-gray-500">
                    Expires in <span id="timeLeft">{formatTime(timeLeft)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-6 justify-center my-12">
                  <label className="text-sm text-gray-400" htmlFor="autoDownload">Auto-download files</label>
                  <div
                      className={`relative w-12 h-6 rounded-full cursor-pointer transition-all duration-150 ${autoDownload ? 'bg-[#00ff88] border-[#00ff88]' : 'bg-gray-900 border-gray-800'} border`}
                      role="switch"
                      aria-checked={autoDownload}
                      tabIndex={0}
                      onClick={toggleAutoDownload}
                  >
                    <div className={`absolute top-0.5 w-5 h-5 rounded-full transition-all duration-150 ${autoDownload ? 'translate-x-6 bg-black' : 'translate-x-0.5 bg-white'}`}></div>
                  </div>
                </div>
              </div>
          )}

          {isConnected && (
              <div id="connectedState">
                <div className="bg-gray-900 border border-gray-800 rounded-lg p-12">
                  <div className="flex items-center gap-6 mb-8">
                    <div className="w-8 h-8 rounded flex items-center justify-center text-base bg-[rgba(0,255,136,0.1)] text-[#00ff88]">✓</div>
                    <div>
                      <h3 className="text-2xl lg:text-3xl font-normal leading-tight">Connected</h3>
                      <p className="text-base text-gray-400 leading-relaxed">Devices are paired and ready for file transfer</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-900 border border-gray-800 rounded-lg p-12 mt-8">
                  <h3 className="text-2xl lg:text-3xl font-normal leading-tight mb-4">Inbox</h3>
                  <div id="inboxList" className="my-12">
                    {receivedFiles.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <p>Waiting for files...</p>
                        </div>
                    ) : (
                        receivedFiles.map(file => (
                            <div key={file.id} className="flex items-center justify-between p-6 bg-gray-900 border border-gray-800 rounded mb-4 transition-all duration-150 hover:bg-gray-800 hover:border-gray-500">
                              <div className="flex items-center gap-6">
                                <div className="w-8 h-8 bg-[#00ff88] rounded flex items-center justify-center text-sm text-black">📄</div>
                                <div>
                                  <h4 className="text-sm font-medium mb-0.5">{file.name}</h4>
                                  <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-4">
                                {file.status === 'uploaded' ? (
                                    <button
                                        className="inline-flex items-center gap-2 px-4 py-2 border border-gray-800 rounded bg-gray-900 text-white text-sm font-medium transition-all duration-150 hover:bg-gray-800 hover:border-gray-500"
                                        onClick={() => downloadFile(file.id)}
                                    >
                                      Download
                                    </button>
                                ) : (
                                    <span className="text-xs text-gray-500">Downloaded</span>
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