"use client";
import Link from "next/link";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useApp } from "../InstantShareContext";

function Nav() {
  return (
    <nav className="nav">
      <div className="logo">Droply</div>
      <Link href="/" className="nav-item">Home</Link>
    </nav>
  );
}

function OTPInputs({ onChange }){
  const inputsRef = useRef([]);
  const [values, setValues] = useState(["","","","","",""]);

  useEffect(() => { onChange(values.join("")); }, [values, onChange]);

  const setAt = (i, val) => {
    const clean = val.replace(/\D/g, "").slice(0, 1);
    setValues((prev) => prev.map((v, idx) => idx === i ? clean : v));
    if (clean) {
      const nextIndex = i === 2 ? 4 : Math.min(i + 1, 5);
      inputsRef.current[nextIndex]?.focus();
    }
  };

  const onKeyDown = (e, i) => {
    if (e.key === 'Backspace' && !values[i]) {
      const prevIndex = i === 4 ? 2 : Math.max(0, i - 1);
      inputsRef.current[prevIndex]?.focus();
    }
  };

  return (
    <div className="otp-container" id="otpContainer">
      {[0,1,2].map(i => (
        <input key={i} ref={el => inputsRef.current[i]=el} type="text" className={`otp-input ${values[i] ? 'filled' : ''}`} maxLength={1} autoComplete="off" aria-label={`${i+1} digit`} value={values[i]} onChange={(e)=>setAt(i,e.target.value)} onKeyDown={(e)=>onKeyDown(e,i)} />
      ))}
      <span className="otp-separator">-</span>
      {[3,4,5].map(i => (
        <input key={i} ref={el => inputsRef.current[i]=el} type="text" className={`otp-input ${values[i] ? 'filled' : ''}`} maxLength={1} autoComplete="off" aria-label={`${i+1} digit`} value={values[i]} onChange={(e)=>setAt(i,e.target.value)} onKeyDown={(e)=>onKeyDown(e,i)} />
      ))}
    </div>
  );
}

function UploadList(){
  const { files, formatFileSize } = useApp();
  if (files.length === 0) return null;
  return (
    <div id="uploadList" className="file-list">
      {files.map(file => (
        <div key={file.id} className="file-item">
          <div className="file-info">
            <div className="file-icon">📄</div>
            <div className="file-details">
              <h4>{file.name}</h4>
              <p>{formatFileSize(file.size)}</p>
              {file.status === 'uploading' && (
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${file.progress}%` }}></div>
                </div>
              )}
            </div>
          </div>
          <div className="file-status">
            <div className={`status-dot ${file.status}`}></div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {file.status === 'uploading' ? 'Sending...' : file.status === 'uploaded' ? 'Sent' : 'Downloaded'}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function SendPage(){
  const { currentSession, isConnected, joinWithCode, processFiles, showToast } = useApp();
  const [code, setCode] = useState("");
  const [modalOpen, setModalOpen] = useState(false);

  const canJoin = useMemo(() => code.replace(/\D/g, "").length === 6, [code]);

  const join = () => {
    const six = code.replace(/\D/g, "").slice(0,6);
    joinWithCode(six);
  };

  const simulateScan = () => {
    if (currentSession) {
      const six = currentSession.code.replace('-', '');
      setCode(six);
      setModalOpen(false);
      showToast('QR code detected');
    }
  };

  const onDrop = (e) => {
    e.preventDefault(); e.currentTarget.classList.remove('dragover');
    const files = Array.from(e.dataTransfer.files);
    processFiles(files);
  };
  const onDragOver = (e) => { e.preventDefault(); e.currentTarget.classList.add('dragover'); };
  const onFileSelect = (e) => { const files = Array.from(e.target.files); processFiles(files); };

  return (
    <div className="container">
      <Nav />

      <div className="view" id="send">
        <div className="text-center mb-lg">
          <h1 className="display-1">Join session</h1>
          <p className="subtitle">Enter the code from the receiving device</p>
        </div>

        {!isConnected && (
          <div id="joinStep" className="card text-center">
            <h3 className="display-2 mb-lg">Enter Pairing Code</h3>
            <OTPInputs onChange={setCode} />
            <div>
              <button className="btn btn-accent btn-lg" onClick={join} disabled={!canJoin}>Join Session</button>
              <button className="btn btn-lg" onClick={()=>setModalOpen(true)} style={{ marginLeft: 'var(--space-md)' }}>Scan QR</button>
            </div>
          </div>
        )}

        {isConnected && (
          <div id="uploadStep" className="card">
            <div className="state-header">
              <div className="state-icon success">✓</div>
              <div>
                <h3 className="display-2">Connected - Ready to Send</h3>
              </div>
            </div>

            <div className="upload-zone" role="button" tabIndex={0} aria-label="Click to select files or drag and drop"
                 onClick={() => document.getElementById('fileInput')?.click()}
                 onDragOver={onDragOver} onDrop={onDrop}>
              <div className="upload-icon">📁</div>
              <div className="upload-title">Drop files here or click to browse</div>
              <div className="upload-subtitle">Any file type, up to 100MB each</div>
            </div>
            <input type="file" id="fileInput" multiple style={{ display: 'none' }} onChange={onFileSelect} />
            <UploadList />
          </div>
        )}
      </div>

      {modalOpen && (
        <div className="modal-overlay" id="qrModal">
          <div className="modal">
            <h3 className="display-2 mb-lg">Scan QR Code</h3>
            <div className="camera-overlay">
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Camera simulation</p>
            </div>
            <div className="mt-lg text-center">
              <button className="btn btn-accent btn-lg" onClick={simulateScan}>Detect Code</button>
              <button className="btn btn-lg" onClick={()=>setModalOpen(false)} style={{ marginLeft: 'var(--space-md)' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
