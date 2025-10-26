"use client";
import Link from "next/link";
import React, {useEffect, useMemo, useRef, useState} from "react";
import {useApp} from "../InstantShareContext";
import QRScanner from "@/components/QRScanner";

function Nav() {
    return (
        <nav className="flex items-center justify-between py-12 mb-16">
            <div className="text-lg font-medium text-white">Droply</div>
            <Link
                href="/"
                className="text-sm text-[#999] px-4 py-2 hover:text-white transition">
                Home
            </Link>
        </nav>
    );
}

function parseJoinUrl(text) {
    try {
        const url = new URL(text);
        return {
            code: (url.searchParams.get("code") || "").replace(/\D/g, ""),
            secret: url.searchParams.get("secret") || undefined,
        };
    } catch {
        const code = (text.match(/code=(\d{6})/i)?.[1] || "").replace(/\D/g, "");
        const secret = text.match(/secret=([A-Za-z0-9_-]+)/i)?.[1];
        return {code, secret};
    }
}

const getFileIcon = (fileName) => {
    const ext = fileName.split('.').pop().toLowerCase();
    const iconMap = {
        pdf: '📄',
        doc: '📝', docx: '📝',
        jpg: '🖼️', jpeg: '🖼️', png: '🖼️', gif: '🖼️',
        mp4: '🎬', mov: '🎬', avi: '🎬',
        mp3: '🎵', wav: '🎵',
        zip: '🗜️', rar: '🗜️',
        txt: '📃',
    };
    return iconMap[ext] || '📄';
};

function OTPInputs({onChange, prefill = ""}) {
    const inputsRef = useRef([]);
    const [values, setValues] = useState(["", "", "", "", "", ""]);

    useEffect(() => {
        onChange(values.join(""));
    }, [values, onChange]);

    useEffect(() => {
        const digits = prefill.replace(/\D/g, "").slice(0, 6).split("");
        if (digits.length === 6) setValues(digits);
    }, [prefill]);

    const setAt = (i, val) => {
        const clean = val.replace(/\D/g, "").slice(0, 1);
        setValues(prev => prev.map((v, idx) => (idx === i ? clean : v)));
        if (clean) {
            const nextIndex = Math.min(i + 1, 5);
            inputsRef.current[nextIndex]?.focus();
        }
    };

    const onKeyDown = (e, i) => {
        if (e.key === "Backspace" && !values[i]) {
            const prevIndex = Math.max(0, i - 1);
            inputsRef.current[prevIndex]?.focus();
        }
    };

    return (
        <div id="otpContainer" className="flex gap-2 sm:gap-4 justify-center items-center my-16 px-4">
            {[0, 1, 2].map(i => (
                <input
                    key={i}
                    ref={el => (inputsRef.current[i] = el)}
                    type="text"
                    maxLength={1}
                    value={values[i]}
                    onChange={(e) => setAt(i, e.target.value)}
                    onKeyDown={(e) => onKeyDown(e, i)}
                    className={`w-10 h-14 sm:w-12 sm:h-16 bg-[#111] border border-[#222] rounded text-white text-lg sm:text-xl font-medium text-center transition outline-none focus:border-[#00ff88] focus:bg-[#1a1a1a] ${values[i] ? "border-[#00ff88] bg-[#1a1a1a]" : ""}`}
                />
            ))}
            <span className="text-[1.25rem] sm:text-[1.5rem] text-[#666] mx-1 sm:mx-2 shrink-0">-</span>
            {[3, 4, 5].map(i => (
                <input
                    key={i}
                    ref={el => (inputsRef.current[i] = el)}
                    type="text"
                    maxLength={1}
                    value={values[i]}
                    onChange={(e) => setAt(i, e.target.value)}
                    onKeyDown={(e) => onKeyDown(e, i)}
                    className={`w-10 h-14 sm:w-12 sm:h-16 bg-[#111] border border-[#222] rounded text-white text-lg sm:text-xl font-medium text-center transition outline-none focus:border-[#00ff88] focus:bg-[#1a1a1a] ${values[i] ? "border-[#00ff88] bg-[#1a1a1a]" : ""}`}
                />
            ))}
        </div>
    );
}

function UploadList() {
    const {files, formatFileSize, downloadAllFiles} = useApp();
    if (files.length === 0) return null;

    const uploadedFiles = files.filter(f => f.status === "uploaded");

    return (
        <div id="uploadList" className="my-8">
            {uploadedFiles.length > 1 && (
                <div className="flex justify-end mb-4">
                    <button
                        onClick={downloadAllFiles}
                        className="px-6 py-3 rounded bg-[#00ff88] text-black font-medium text-sm hover:opacity-90 transition flex items-center gap-2"
                    >
                        <span>⬇️</span>
                        Download All ({uploadedFiles.length})
                    </button>
                </div>
            )}
            {files.map((file) => (
                <div
                    key={file.id}
                    className="flex items-center justify-between p-6 bg-[#111] border border-[#222] rounded mb-4 transition hover:bg-[#1a1a1a] hover:border-[#666]"
                >
                    <div className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded bg-[#00ff88] text-black flex items-center justify-center text-sm">
                            {getFileIcon(file.name)}
                        </div>
                        <div>
                            <h4 className="text-sm font-medium mb-[2px]">{file.name}</h4>
                            <p className="text-xs text-[#666]">{formatFileSize(file.size)}</p>
                            {file.status === "uploading" && (
                                <div className="w-full h-[2px] bg-[#222] rounded mt-2 overflow-hidden">
                                    <div
                                        className="h-full bg-[#00ff88] rounded transition-[width] duration-300 ease-linear"
                                        style={{width: `${file.progress}%`}}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <div
                            className={`w-[6px] h-[6px] rounded-full ${
                                file.status === "uploading"
                                    ? "bg-[#ffd700] animate-pulse"
                                    : "bg-[#00ff88]"
                            }`}
                        />
                        <span className="text-xs text-[#666]">
              {file.status === "uploading"
                  ? "Sending..."
                  : file.status === "uploaded"
                      ? "Sent"
                      : "Downloaded"}
            </span>
                    </div>
                </div>
            ))}
        </div>
    );
}

export default function SendPage() {
    const {currentSession, isConnected, joinWithCode, processFiles, showToast, leaveRoom} = useApp();
    const [code, setCode] = useState("");
    const [modalOpen, setModalOpen] = useState(false);

    const canJoin = useMemo(
        () => code.replace(/\D/g, "").length === 6,
        [code]
    );

    const onScanResult = async (text) => {
        const {code: scanned} = parseJoinUrl(text);
        if (!scanned || scanned.length !== 6) {
            showToast("Invalid QR", "error");
            return;
        }
        setCode(scanned);
        setModalOpen(false);
        await joinWithCode(scanned);
    };

    const join = async () => {
        const six = code.replace(/\D/g, "").slice(0, 6);
        await joinWithCode(six);
    };

    const onDrop = (e) => {
        e.preventDefault();
        e.currentTarget.classList.remove("dragover");
        const files = Array.from(e.dataTransfer.files);
        processFiles(files);
    };

    const onDragOver = (e) => {
        e.preventDefault();
        e.currentTarget.classList.add("dragover");
    };

    const onFileSelect = (e) => {
        const files = Array.from(e.target.files);
        processFiles(files);
    };

    return (
        <div className="max-w-[1200px] mx-auto px-8">
            <Nav/>

            <div className="min-h-[70vh]" id="send">
                <div className="text-center mb-8">
                    <h1 className="text-[clamp(2rem,5vw,3.5rem)] font-normal leading-[1.2] tracking-[-0.01em] mb-6">
                        Join session
                    </h1>
                    <p className="text-[1.125rem] text-[#999] leading-[1.6] text-center max-w-[600px] mx-auto mb-16">
                        Enter the code from the receiving device
                    </p>
                </div>

                {/* Leave button when connected */}
                {isConnected && (
                    <div className="flex justify-between items-center mb-8">
                        <div className="text-sm text-[#666]">
                            Session: <span className="text-white font-mono">{currentSession?.codeDisplay}</span>
                        </div>
                        <button
                            onClick={leaveRoom}
                            className="px-6 py-3 rounded bg-[#111] border border-[#222] text-white text-sm font-medium hover:bg-[#1a1a1a] hover:border-red-500 hover:text-red-400 transition"
                        >
                            Leave Session
                        </button>
                    </div>
                )}

                {!isConnected && (
                    <div
                        className="bg-[#111] border border-[#222] rounded-lg p-12 text-center transition hover:bg-[#1a1a1a] hover:border-[#666]">
                        <h3 className="text-[clamp(1.5rem,3vw,2rem)] leading-[1.3] font-normal mb-8">
                            Enter Pairing Code
                        </h3>
                        <OTPInputs onChange={setCode} prefill={code}/>

                        <div className="flex items-center justify-center gap-6">
                            <button
                                onClick={join}
                                disabled={!canJoin}
                                className="inline-flex items-center justify-center px-12 py-6 rounded-[4px] text-black font-medium text-base bg-[#00ff88] border border-[#00ff88] hover:opacity-90 transition disabled:opacity-50 disabled:pointer-events-none"
                            >
                                Join Session
                            </button>
                            <button
                                onClick={() => setModalOpen(true)}
                                className="inline-flex items-center justify-center px-12 py-6 rounded-[4px] bg-[#111] border border-[#222] text-white text-base font-medium hover:bg-[#1a1a1a] hover:border-[#666] transition"
                            >
                                Scan QR
                            </button>
                        </div>
                    </div>
                )}

                {isConnected && (
                    <div
                        className="bg-[#111] border border-[#222] rounded-lg p-12 transition hover:bg-[#1a1a1a] hover:border-[#666] focus-outline">
                        <div className="flex items-center gap-4 mb-6">
                            <div
                                className="w-8 h-8 rounded bg-[rgba(0,255,136,0.1)] text-[#00ff88] flex items-center justify-center text-base">
                                ✓
                            </div>
                            <div>
                                <h3 className="text-[clamp(1.5rem,3vw,2rem)] leading-[1.3] font-normal">Connected - Ready
                                    to Send</h3>
                            </div>
                        </div>

                        <div
                            role="button"
                            tabIndex={0}
                            aria-label="Click to select files or drag and drop"
                            onClick={() => document.getElementById("fileInput")?.click()}
                            onDragOver={onDragOver}
                            onDrop={onDrop}
                            className="border border-dashed border-[#222] rounded-lg px-12 py-24 text-center cursor-pointer my-8 bg-[#111]
             hover:border-[#00ff88] hover:bg-[rgba(0,255,136,0.1)]
             [&.dragover]:border-[#00ff88] [&.dragover]:bg-[rgba(0,255,136,0.1)]"
                        >
                            <div className="text-2xl mb-4 text-[#666]">📁</div>
                            <div className="text-base font-medium mb-2">Drop files here or click to browse</div>
                            <div className="text-sm text-[#666]">Any file type, up to 100MB each</div>
                        </div>

                        <input
                            type="file"
                            id="fileInput"
                            multiple
                            className="hidden"
                            onChange={onFileSelect}
                        />

                        <UploadList/>
                    </div>
                )}
            </div>

            {modalOpen && (
                <QRScanner
                    onResult={onScanResult}
                    onClose={() => setModalOpen(false)}
                />
            )}
        </div>
    );
}