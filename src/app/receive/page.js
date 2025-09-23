"use client";
import Link from "next/link";
import React, { useEffect, useRef } from "react";
import { useApp } from "../InstantShareContext";

function Nav() {
  return (
    <nav className="nav">
      <div className="logo">Droply</div>
      <Link href="/" className="nav-item">Home</Link>
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
  return <canvas className="qr-code" ref={ref} aria-label="QR code"></canvas>;
}

export default function ReceivePage(){
  const { currentSession, createPairing, timeLeft, formatTime, autoDownload, toggleAutoDownload, isConnected, files, formatFileSize, downloadFile, bus } = useApp();

  useEffect(() => {
    const off = bus.on('phoneJoined', () => {});
    return off;
  }, [bus]);

  const receivedFiles = files.filter(f => f.status === 'uploaded' || f.status === 'downloaded');

  return (
    <div className="container">
      <Nav />

      <div className="view" id="receive">
        <div className="text-center mb-lg">
          <h1 className="display-1">Ready to receive</h1>
          <p className="subtitle">Share the code or QR with the sending device</p>
        </div>

        {!currentSession && (
          <div id="pairingStep" className="card text-center">
            <div className="state-header" style={{ justifyContent: 'center' }}>
              <div className="state-icon waiting">⏳</div>
              <div>
                <h3 className="display-2">Create Pairing Session</h3>
                <p className="body">Generate a secure code for file sharing</p>
              </div>
            </div>
            <button className="btn btn-accent btn-lg" onClick={createPairing}>Create Pairing</button>
          </div>
        )}

        {currentSession && !isConnected && (
          <div id="pairingActive" className="card text-center">
            <div className="state-header" style={{ justifyContent: 'center' }}>
              <div className="state-icon success">✓</div>
              <h3 className="display-2">Session Active</h3>
            </div>
            <div className="qr-section">
              <div className="qr-wrapper">
                <QRCanvas code={currentSession.code} secret={currentSession.secret} />
              </div>
              <div className="code-display" id="codeDisplay">{currentSession.code}</div>
              <div className="countdown-text">Expires in <span id="timeLeft">{formatTime(timeLeft)}</span></div>
            </div>
            <div className="toggle-container">
              <label className="toggle-label" htmlFor="autoDownload">Auto-download files</label>
              <div className={`toggle ${autoDownload ? 'active' : ''}`} role="switch" aria-checked={autoDownload} tabIndex={0} onClick={toggleAutoDownload}>
                <div className="toggle-thumb"></div>
              </div>
            </div>
          </div>
        )}

        {isConnected && (
          <div id="connectedState">
            <div className="card">
              <div className="state-header">
                <div className="state-icon success">✓</div>
                <div>
                  <h3 className="display-2">Connected</h3>
                  <p className="body">Devices are paired and ready for file transfer</p>
                </div>
              </div>
            </div>

            <div className="card mt-lg">
              <h3 className="display-2">Inbox</h3>
              <div id="inboxList" className="file-list">
                {receivedFiles.length === 0 ? (
                  <div className="empty-state"><p>Waiting for files...</p></div>
                ) : (
                  receivedFiles.map(file => (
                    <div key={file.id} className="file-item">
                      <div className="file-info">
                        <div className="file-icon">📄</div>
                        <div className="file-details">
                          <h4>{file.name}</h4>
                          <p>{formatFileSize(file.size)}</p>
                        </div>
                      </div>
                      <div className="file-status">
                        {file.status === 'uploaded' ? (
                          <button className="btn" onClick={() => downloadFile(file.id)}>Download</button>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Downloaded</span>
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
