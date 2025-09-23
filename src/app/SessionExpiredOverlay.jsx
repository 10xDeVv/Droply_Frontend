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
    <div className="session-expired" id="sessionExpired">
      <div className="session-expired-content">
        <div className="session-expired-icon">🔒</div>
        <h2 className="display-2">Session Expired</h2>
        <p className="body mb-lg">Your sharing session has ended for security.</p>
        <button className="btn btn-primary btn-lg" onClick={onReset}>Start New Session</button>
      </div>
    </div>
  );
}
