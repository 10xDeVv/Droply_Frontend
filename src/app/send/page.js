"use client";
import Link from "next/link";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useApp } from "../InstantShareContext";

function Nav() {
  return (
      <nav className="flex items-center justify-between py-12 mb-16">
        <div className="text-lg font-medium text-white">Droply</div>
        <Link href="/" className="text-sm text-gray-400 px-4 py-2 transition-colors duration-150 hover:text-white">Home</Link>
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
      <div className="flex gap-4 justify-center items-center my-8" id="otpContainer">
        {[0,1,2].map(i => (
            <input
                key={i}
                ref={el => inputsRef.current[i]=el}
                type="text"
                className={`w-12 h-16 bg-gray-900 border ${values[i] ? 'border-[#00ff88] bg-gray-800' : 'border-gray-800'} rounded text-white text-xl font-medium text-center font-mono transition-all duration-150 focus:outline-none focus:border-[#00ff88] focus:bg-gray-800`}
                maxLength={1}
                autoComplete="off"
                aria-label={`${i+1} digit`}
                value={values[i]}
                onChange={(e)=>setAt(i,e.target.value)}
                onKeyDown={(e)=>onKeyDown(e,i)}
            />
        ))}
        <span className="text-2xl text-gray-500 mx-2">-</span>
        {[3,4,5].map(i => (
            <input
                key={i}
                ref={el => inputsRef.current[i]=el}
                type="text"
                className={`w-12 h-16 bg-gray-900 border ${values[i] ? 'border-[#00ff88] bg-gray-800' : 'border-gray-800'} rounded text-white text-xl font-medium text-center font-mono transition-all duration-150 focus:outline-none focus:border-[#00ff88] focus:bg-gray-800`}
                maxLength={1}
                autoComplete="off"
                aria-label={`${i+1} digit`}
                value={values[i]}
                onChange={(e)=>setAt(i,e.target.value)}
                onKeyDown={(e)=>onKeyDown(e,i)}
            />
        ))}
      </div>
  );
}

function UploadList(){
  const { files, formatFileSize } = useApp();
  if (files.length === 0) return null;
  return (
      <div id="uploadList" className="my-12">
        {files.map(file => (
            <div key={file.id} className="flex items-center justify-between p-6 bg-gray-900 border border-gray-800 rounded mb-4 transition-all duration-150 hover:bg-gray-800 hover:border-gray-500">
              <div className="flex items-center gap-6">
                <div className="w-8 h-8 bg-[#00ff88] rounded flex items-center justify-center text-sm text-black">📄</div>
                <div>
                  <h4 className="text-sm font-medium mb-0.5">{file.name}</h4>
                  <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                  {file.status === 'uploading' && (
                      <div className="w-full h-0.5 bg-gray-800 rounded overflow-hidden mt-2">
                        <div className="progress-fill h-full bg-[#00ff88] rounded" style={{ width: `${file.progress}%` }}></div>
                      </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className={`w-1.5 h-1.5 rounded-full ${file.status === 'uploading' ? 'bg-yellow-400 status-dot pending' : 'bg-[#00ff88]'}`}></div>
                <span className="text-xs text-gray-500">
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
    e.preventDefault();
    e.currentTarget.classList.remove('border-[#00ff88]', 'bg-[rgba(0,255,136,0.1)]');
    const files = Array.from(e.dataTransfer.files);
    processFiles(files);
  };
  const onDragOver = (e) => {
    e.preventDefault();
    e.currentTarget.classList.add('border-[#00ff88]', 'bg-[rgba(0,255,136,0.1)]');
  };
  const onFileSelect = (e) => {
    const files = Array.from(e.target.files);
    processFiles(files);
  };

  return (
      <div className="max-w-7xl mx-auto px-8">
        <Nav />

        <div className="min-h-[70vh]" id="send">
          <div className="text-center mb-8">
            <h1 className="text-6xl lg:text-8xl xl:text-9xl font-normal leading-tight tracking-tight mb-6">Join session</h1>
            <p className="text-lg text-gray-400 leading-relaxed text-center max-w-2xl mx-auto mb-16">Enter the code from the receiving device</p>
          </div>

          {!isConnected && (
              <div id="joinStep" className="bg-gray-900 border border-gray-800 rounded-lg p-12 text-center">
                <h3 className="text-2xl lg:text-3xl font-normal leading-tight mb-8">Enter Pairing Code</h3>
                <OTPInputs onChange={setCode} />
                <div>
                  <button
                      className={`inline-flex items-center gap-2 px-6 py-4 border rounded text-base font-medium transition-all duration-150 ${canJoin ? 'bg-[#00ff88] text-black border-[#00ff88] hover:opacity-90' : 'bg-gray-900 text-white border-gray-800 cursor-not-allowed opacity-50'}`}
                      onClick={join}
                      disabled={!canJoin}
                  >
                    Join Session
                  </button>
                  <button
                      className="inline-flex items-center gap-2 px-6 py-4 border border-gray-800 rounded bg-gray-900 text-white text-base font-medium ml-6 transition-all duration-150 hover:bg-gray-800 hover:border-gray-500"
                      onClick={()=>setModalOpen(true)}
                  >
                    Scan QR
                  </button>
                </div>
              </div>
          )}

          {isConnected && (
              <div id="uploadStep" className="bg-gray-900 border border-gray-800 rounded-lg p-12">
                <div className="flex items-center gap-6 mb-8">
                  <div className="w-8 h-8 rounded flex items-center justify-center text-base bg-[rgba(0,255,136,0.1)] text-[#00ff88]">✓</div>
                  <div>
                    <h3 className="text-2xl lg:text-3xl font-normal leading-tight">Connected - Ready to Send</h3>
                  </div>
                </div>

                <div
                    className="border border-dashed border-gray-800 rounded-lg p-12 text-center transition-all duration-150 cursor-pointer my-12 bg-gray-900 hover:border-[#00ff88] hover:bg-[rgba(0,255,136,0.1)]"
                    role="button"
                    tabIndex={0}
                    aria-label="Click to select files or drag and drop"
                    onClick={() => document.getElementById('fileInput')?.click()}
                    onDragOver={onDragOver}
                    onDrop={onDrop}
                >
                  <div className="text-3xl mb-6 text-gray-500">📁</div>
                  <div className="text-base font-medium mb-2">Drop files here or click to browse</div>
                  <div className="text-gray-500 text-sm">Any file type, up to 100MB each</div>
                </div>
                <input type="file" id="fileInput" multiple className="hidden" onChange={onFileSelect} />
                <UploadList />
              </div>
          )}
        </div>

        {modalOpen && (
            <div className="fixed top-0 left-0 w-full h-full bg-black/80 z-[2000] flex items-center justify-center" id="qrModal">
              <div className="bg-gray-800 border border-gray-800 rounded-lg p-12 max-w-lg w-[90%]">
                <h3 className="text-2xl lg:text-3xl font-normal leading-tight mb-8">Scan QR Code</h3>
                <div className="camera-overlay bg-black rounded aspect-[4/3] flex items-center justify-center my-8 border border-gray-800 relative">
                  <p className="text-gray-500 text-sm">Camera simulation</p>
                </div>
                <div className="mt-8 text-center">
                  <button
                      className="inline-flex items-center gap-2 px-6 py-4 border bg-[#00ff88] text-black border-[#00ff88] rounded text-base font-medium transition-all duration-150 hover:opacity-90"
                      onClick={simulateScan}
                  >
                    Detect Code
                  </button>
                  <button
                      className="inline-flex items-center gap-2 px-6 py-4 border border-gray-800 rounded bg-gray-900 text-white text-base font-medium ml-6 transition-all duration-150 hover:bg-gray-800 hover:border-gray-500"
                      onClick={()=>setModalOpen(false)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
        )}
      </div>
  );
}