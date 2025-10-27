"use client";
import React, { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";

export default function QRScanner({ onResult, onClose }) {
    const videoRef = useRef(null);
    const readerRef = useRef(null);
    const [err, setErr] = useState(null);
    const [scanning, setScanning] = useState(false);

    useEffect(() => {
        let mounted = true;
        let controls = null;

        const startScanning = async () => {
            try {
                setScanning(true);
                setErr(null);

                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: "environment" }
                });

                stream.getTracks().forEach(track => track.stop());

                if (!mounted) return;

                const devices = await BrowserMultiFormatReader.listVideoInputDevices();

                if (devices.length === 0) {
                    setErr("No cameras found on this device");
                    return;
                }

                const backCamera = devices.find((d) =>
                    /back|rear|environment/i.test(d.label)
                );
                const deviceId = backCamera?.deviceId ?? devices[0]?.deviceId;

                if (!videoRef.current || !deviceId) {
                    setErr("Could not initialize camera");
                    return;
                }

                const reader = new BrowserMultiFormatReader();
                readerRef.current = reader;

                controls = await reader.decodeFromVideoDevice(
                    deviceId,
                    videoRef.current,
                    (result, error) => {
                        if (result) {
                            console.log("QR Code detected:", result.getText());
                            onResult(result.getText());
                            if (controls) {
                                controls.stop();
                            }
                        }
                    }
                );

            } catch (error) {
                console.error("Scanner error:", error);

                if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
                    setErr("Camera permission denied. Please enable camera access.");
                } else if (error.name === "NotFoundError") {
                    setErr("No camera found on this device");
                } else if (error.name === "NotReadableError") {
                    setErr("Camera is already in use by another app");
                } else {
                    setErr(error.message || "Failed to start camera");
                }
            } finally {
                setScanning(false);
            }
        };

        startScanning();

        return () => {
            mounted = false;
            if (controls) {
                try {
                    controls.stop();
                } catch (e) {
                    console.error("Error stopping scanner:", e);
                }
            }
            if (readerRef.current) {
                try {
                    readerRef.current.reset();
                } catch (e) {
                    console.error("Error resetting reader:", e);
                }
            }
        };
    }, [onResult]);

    return (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/90">
            <div className="bg-[#111] border border-[#222] rounded-lg p-8 w-[92%] max-w-[540px]">
                <h3 className="text-xl mb-4 text-white">Scan QR Code</h3>

                <div className="relative aspect-[4/3] rounded border border-[#222] overflow-hidden bg-black">
                    <video
                        ref={videoRef}
                        className="w-full h-full object-cover"
                        playsInline
                        muted
                        autoPlay
                    />

                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-[60%] h-[60%] border-2 border-[#00ff88] rounded-lg relative">
                            <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-[#00ff88]"></div>
                            <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-[#00ff88]"></div>
                            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-[#00ff88]"></div>
                            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-[#00ff88]"></div>
                        </div>
                    </div>

                    {scanning && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                            <div className="text-white text-sm">Starting camera...</div>
                        </div>
                    )}
                </div>

                {err && (
                    <div className="mt-4 p-3 bg-red-500/10 border border-red-500/50 rounded text-red-400 text-sm">
                        {err}
                    </div>
                )}

                {!err && (
                    <p className="text-sm text-[#666] mt-3 text-center">
                        Position the QR code within the frame
                    </p>
                )}

                <div className="mt-6 flex gap-3 justify-end">
                    <button
                        onClick={onClose}
                        className="px-5 py-3 rounded bg-[#111] border border-[#222] text-white hover:bg-[#1a1a1a] transition"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}