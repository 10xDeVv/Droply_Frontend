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
      <div className="fixed top-0 left-0 w-full h-full bg-black/95 z-[3000] flex items-center justify-center" id="sessionExpired">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-12 text-center max-w-sm w-[90%]">
          <div className="text-5xl mb-8 text-gray-500">🔒</div>
          <h2 className="text-2xl lg:text-3xl font-normal leading-tight mb-4">Session Expired</h2>
          <p className="text-base text-gray-400 leading-relaxed mb-8">Your sharing session has ended for security.</p>
          <button className="inline-flex items-center gap-2 px-6 py-4 border border-gray-800 rounded bg-white text-black text-base font-medium transition-colors duration-150 hover:bg-gray-300 hover:border-gray-500" onClick={onReset}>
            Start New Session
          </button>
        </div>
      </div>
  );
}