"use client";
import React, { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";

export default function QRScanner({ onResult, onClose }) {
    const videoRef = useRef(null);
    const [err, setErr] = useState(null);

    useEffect(() => {
        const reader = new BrowserMultiFormatReader();
        let stop;
        (async () => {
            try {
                const devices = await BrowserMultiFormatReader.listVideoInputDevices();
                const back = devices.find((d) => /back|rear/i.test(d.label));
                const deviceId = back?.deviceId ?? devices[0]?.deviceId;
                if (!videoRef.current || !deviceId) return;
                const ctrl = await reader.decodeFromVideoDevice(
                    deviceId,
                    videoRef.current,
                    (res) => {
                        if (res) {
                            onResult(res.getText());
                        }
                    }
                );
                stop = () => ctrl?.stop();
            } catch (e) {
                setErr(e?.message || "Camera error");
            }
        })();
        return () => {
            stop?.();
        };
    }, [onResult]);

    return (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/80">
            <div className="bg-[#111] border border-[#222] rounded-lg p-8 w-[92%] max-w-[540px]">
                <h3 className="text-xl mb-4">Scan QR Code</h3>
                <div className="relative aspect-[4/3] rounded border border-[#222] overflow-hidden">
                    <video
                        ref={videoRef}
                        className="w-full h-full object-cover"
                        playsInline
                        muted
                    />
                    <div className="absolute inset-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] h-[60%] rounded border border-[#00ff88]/80 pointer-events-none" />
                </div>
                {err && <p className="text-sm text-red-400 mt-3">{err}</p>}
                <div className="mt-6 text-right">
                    <button
                        onClick={onClose}
                        className="px-5 py-3 rounded bg-[#111] border border-[#222] hover:bg-[#1a1a1a]"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}
