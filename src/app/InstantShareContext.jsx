"use client";
import React, {
  createContext,
  useContext,
  useMemo,
  useRef,
  useState,
  useEffect,
  useCallback,
} from "react";

/* Simple Event Bus */
class EventBus {
  constructor() {
    this.events = {};
  }
  on(event, cb) {
    if (!this.events[event]) this.events[event] = [];
    this.events[event].push(cb);
    return () => {
      this.events[event] = (this.events[event] || []).filter((f) => f !== cb);
    };
  }
  emit(event, data) {
    (this.events[event] || []).forEach((cb) => cb(data));
  }
}

/* Toasts */
const ToastCtx = createContext();
export function useToast() {
  return useContext(ToastCtx);
}

function Toasts({ toasts }) {
  return (
    <div
      id="toastContainer"
      aria-live="polite"
      aria-atomic="true"
      className="fixed top-8 right-8 z-[1000] flex flex-col gap-4"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-center gap-2 bg-[#111] text-white border border-[#222] rounded p-4 min-w-[280px] text-sm animate-[slideIn_0.3s_ease_forwards] ${
            t.type === "success" ? "border-l-2" : "border-l-2"
          }`}
          style={{
            borderLeftColor: t.type === "success" ? "#00ff88" : "#ff4757",
          }}
        >
          <span>{t.type === "success" ? "✓" : "✕"}</span>
          <span className="text-white/90">{t.message}</span>
        </div>
      ))}
    </div>
  );
}

/* App Context */
const AppCtx = createContext(null);
export function useApp() {
  return useContext(AppCtx);
}

export default function InstantShareProvider({ children }) {
  const [currentSession, setCurrentSession] = useState(null);
  const [autoDownload, setAutoDownload] = useState(false);
  const [timeLeft, setTimeLeft] = useState(600);
  const [files, setFiles] = useState([]);
  const [isConnected, setIsConnected] = useState(false);

  const countdownRef = useRef(null);
  const busRef = useRef(new EventBus());

  // Toast manager
  const [toasts, setToasts] = useState([]);
  const showToast = useCallback((message, type = "success", duration = 3000) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  // Utilities
  const formatTime = useCallback((seconds) => {
    const m = Math.floor(seconds / 60);
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  }, []);

  const formatFileSize = useCallback((bytes) => {
    const units = ["B", "KB", "MB", "GB"];
    let size = bytes;
    let i = 0;
    while (size >= 1024 && i < units.length - 1) {
      size /= 1024;
      i++;
    }
    return `${size.toFixed(1)} ${units[i]}`;
  }, []);

  // Session
  const generateSessionCode = useCallback(() => {
    return Math.floor(100000 + Math.random() * 900000)
      .toString()
      .replace(/(\d{3})(\d{3})/, "$1-$2");
  }, []);

  const startCountdown = useCallback(() => {
    setTimeLeft(600);
    if (countdownRef.current) clearInterval(countdownRef.current);
    countdownRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(countdownRef.current);
          busRef.current.emit("sessionExpired");
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  }, []);

  const createPairing = useCallback(() => {
    const code = generateSessionCode();
    const secret = Math.random().toString(36).substring(2, 15);
    setCurrentSession({ code, secret, createdAt: Date.now() });
    startCountdown();
    showToast("Pairing session created");
  }, [generateSessionCode, showToast, startCountdown]);

  const joinWithCode = useCallback(
    (code6) => {
      const formatted = code6.substring(0, 3) + "-" + code6.substring(3);
      if (currentSession && currentSession.code === formatted) {
        setIsConnected(true);
        busRef.current.emit("phoneJoined", { code: formatted });
        showToast("Successfully joined session");
        return true;
      }
      showToast("Invalid code. Please try again.", "error");
      return false;
    },
    [currentSession, showToast]
  );

  const processFiles = useCallback(
    (selectedFiles) => {
      if (!isConnected) {
        showToast("Please join a session first", "error");
        return;
      }
      selectedFiles.forEach((file) => {
        const fileObj = {
          id: Math.random().toString(36).slice(2),
          name: file.name,
          size: file.size,
          status: "uploading",
          progress: 0,
        };
        setFiles((prev) => [...prev, fileObj]);

        // simulate upload
        const duration = 1000 + Math.random() * 2000;
        const interval = 50;
        const steps = duration / interval;
        const step = 100 / steps;
        let cur = 0;
        const timer = setInterval(() => {
          cur += step;
          setFiles((prev) =>
            prev.map((f) =>
              f.id === fileObj.id ? { ...f, progress: Math.min(cur, 100) } : f
            )
          );
          if (cur >= 100) {
            clearInterval(timer);
            setFiles((prev) =>
              prev.map((f) =>
                f.id === fileObj.id
                  ? { ...f, status: "uploaded", progress: 100 }
                  : f
              )
            );
            busRef.current.emit("fileUploaded", {
              ...fileObj,
              status: "uploaded",
              progress: 100,
            });
            showToast(`${fileObj.name} sent successfully`);
          }
        }, interval);
      });
    },
    [isConnected, showToast]
  );

  const downloadFile = useCallback(
    (id) => {
      setFiles((prev) =>
        prev.map((f) => (f.id === id ? { ...f, status: "downloaded" } : f))
      );
      const f = files.find((x) => x.id === id);
      if (f) showToast(`Downloaded ${f.name}`);
    },
    [files, showToast]
  );

  const toggleAutoDownload = useCallback(() => {
    setAutoDownload((v) => {
      const nv = !v;
      showToast(nv ? "Auto-download enabled" : "Auto-download disabled");
      return nv;
    });
  }, [showToast]);

  const resetSession = useCallback(() => {
    if (countdownRef.current) clearInterval(countdownRef.current);
    setCurrentSession(null);
    setAutoDownload(false);
    setTimeLeft(600);
    setFiles([]);
    setIsConnected(false);
    showToast("Session reset successfully");
  }, [showToast]);

  // Auto-download behavior
  useEffect(() => {
    const off = busRef.current.on("fileUploaded", (file) => {
      if (autoDownload && file.status === "uploaded") {
        setTimeout(() => {
          setFiles((prev) =>
            prev.map((f) =>
              f.id === file.id ? { ...f, status: "downloaded" } : f
            )
          );
          showToast(`Auto-downloaded ${file.name}`);
        }, 500);
      }
    });
    return off;
  }, [autoDownload, showToast]);

  const value = useMemo(
    () => ({
      currentSession,
      autoDownload,
      timeLeft,
      files,
      isConnected,
      formatTime,
      formatFileSize,
      createPairing,
      joinWithCode,
      processFiles,
      downloadFile,
      toggleAutoDownload,
      resetSession,
      bus: busRef.current,
      showToast,
    }),
    [
      currentSession,
      autoDownload,
      timeLeft,
      files,
      isConnected,
      formatTime,
      formatFileSize,
      createPairing,
      joinWithCode,
      processFiles,
      downloadFile,
      toggleAutoDownload,
      resetSession,
      showToast,
    ]
  );

  return (
    <ToastCtx.Provider value={{ show: showToast }}>
      <AppCtx.Provider value={value}>
        <Toasts toasts={toasts} />
        {children}
      </AppCtx.Provider>
    </ToastCtx.Provider>
  );
}
