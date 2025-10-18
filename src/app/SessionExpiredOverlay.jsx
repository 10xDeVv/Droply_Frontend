"use client";
import React, { useEffect, useState } from "react";
import { useApp } from "./InstantShareContext";
import { useRouter, usePathname } from "next/navigation";

export default function SessionExpiredOverlay() {
  const { timeLeft, resetSession } = useApp();
  const [visible, setVisible] = useState(false);
  const router = useRouter();
  const path = usePathname();

  useEffect(() => {
    setVisible(timeLeft <= 0);
  }, [timeLeft]);

  const onReset = () => {
    resetSession();
    if (path !== "/") router.push("/");
  };

  if (!visible) return null;
  return (
    <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/95">
      <div className="bg-[#111] border border-[#222] rounded-lg p-12 text-center max-w-[400px] w-[90%]">
        <div className="text-5xl mb-8 text-[#666]">🔒</div>
        <h2 className="text-2xl font-normal mb-4">Session Expired</h2>
        <p className="text-base text-[#999] mb-8">
          Your sharing session has ended for security.
        </p>
        <button
          onClick={onReset}
          className="inline-flex items-center gap-2 px-8 py-4 rounded-lg text-black font-medium text-base bg-white border border-white hover:bg-[#999] hover:border-[#999] transition"
        >
          Start New Session
        </button>
      </div>
    </div>
  );
}
