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

import {api} from "@/lib/api";
import {WebSocketService} from "@/lib/websocket";
import QRCode from "qrcode";

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
  const [loading, setLoading] = useState(false);

  const countdownRef = useRef(null);
  const busRef = useRef(new EventBus());
  const wsRef = useRef(null);
  const sessionIdRef = useRef(null);
  const unsubscribersRef = useRef([]);

  const [toasts, setToasts] = useState([]);
  const showToast = useCallback((message, type = "success", duration = 3000) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  const formatTime = useCallback((seconds) => {
    const m = Math.floor(seconds / 60);
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  }, []);

  const normalizeCode = (c) => (c || "").replace(/[^A-Za-z0-9]/g, "").toUpperCase();
  const withHyphen = (c) => {
    const n = normalizeCode(c);
    return n.length === 6 ? `${n.slice(0,3)}-${n.slice(3)}` : n;
  };

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

  useEffect(() => {
    if (!sessionIdRef.current) {
      sessionIdRef.current = `client_${Math.random().toString(36).slice(2)}`;
    }
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

  const cleanupWebSocketSubscriptions = useCallback(() => {
    unsubscribersRef.current.forEach(unsub => {
      try {
        unsub();
      } catch (e) {
        console.error('Error unsubscribing:', e);
      }
    });
    unsubscribersRef.current = [];
  }, []);

  const createPairing = useCallback(async () => {
    try {
      setLoading(true);

      cleanupWebSocketSubscriptions();

      const response = await api.createRoom();

      const normalized = normalizeCode(response.code);
      const display = withHyphen(normalized);

      const qrData =
          response.qrCodeData ||
          (await QRCode.toDataURL(display, { width: 200, margin: 1 }));

      setCurrentSession({
        id: response.roomId,
        code: normalized,
        codeDisplay: display,
        secret: response.secret || "",
        qrCodeData: qrData,
        createdAt: Date.now(),
      });

      startCountdown();

      wsRef.current = new WebSocketService();
      wsRef.current.connect(response.roomId);

      const unsubPeerJoined = wsRef.current.subscribe("PEER_JOINED", (payload) => {
        console.log("🟢 PEER_JOINED received:", payload);
        setIsConnected(true);
        busRef.current.emit("phoneJoined");
        showToast("Sender connected!");
      });
      unsubscribersRef.current.push(unsubPeerJoined);

      const unsubFileUploaded = wsRef.current.subscribe("FILE_UPLOADED", (payload) => {
        setFiles((prev) => [
          ...prev,
          {
            id: payload.id,
            name: payload.name,
            size: payload.size,
            status: "uploaded",
            progress: 100,
            serverFileId: payload.id,
          },
        ]);
        busRef.current.emit("fileUploaded", payload);
        showToast(`Received ${payload.name}`);
      });
      unsubscribersRef.current.push(unsubFileUploaded);

      const unsubFileDownloaded = wsRef.current.subscribe("FILE_DOWNLOADED", (payload) => {
        setFiles(prev => prev.map(f =>
            f.serverFileId === payload.id || f.id === payload.id
                ? { ...f, status: "downloaded" }
                : f
        ));
      });
      unsubscribersRef.current.push(unsubFileDownloaded);

      const unsubRoomExpired = wsRef.current.subscribe("ROOM_EXPIRED", () => {
        showToast("Session expired", "error");
        leaveRoom();
      });
      unsubscribersRef.current.push(unsubRoomExpired);

      showToast("Pairing session created");
    } catch (error) {
      console.error("Failed to create room:", error);
      showToast("Failed to create session. Try again.", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast, startCountdown, cleanupWebSocketSubscriptions]);

  const joinWithCode = useCallback(
      async (code6) => {
        try {
          setLoading(true);

          cleanupWebSocketSubscriptions();

          const formatted = normalizeCode(code6);
          if (formatted.length !== 6) {
            showToast("Enter a 6-character code", "error");
            return false;
          }

          const response = await api.joinRoom(formatted, sessionIdRef.current);

          if (response.success) {
            setCurrentSession({
              id: response.roomId,
              code: formatted,
              codeDisplay: withHyphen(formatted),
              secret: "",
            });
            setIsConnected(true);

            wsRef.current = new WebSocketService();
            wsRef.current.connect(response.roomId);

            const unsubFileDownloaded = wsRef.current.subscribe('FILE_DOWNLOADED', (payload) => {
              console.log("⬇️ FILE_DOWNLOADED received:", payload);

              setFiles(prev => prev.map(f =>
                  f.serverFileId === payload.id || f.id === payload.id
                      ? { ...f, status: 'downloaded' }
                      : f
              ));

              showToast(`${payload.name} was downloaded`);
            });
            unsubscribersRef.current.push(unsubFileDownloaded);

            const unsubRoomExpired = wsRef.current.subscribe('ROOM_EXPIRED', () => {
              console.log("⏰ ROOM_EXPIRED received");
              showToast("Session expired", "error");
              leaveRoom();
            });
            unsubscribersRef.current.push(unsubRoomExpired);

            busRef.current.emit("phoneJoined", { code: formatted });
            showToast("Successfully joined session");
            return true;
          } else {
            showToast(response.message || "Failed to join", "error");
            return false;
          }
        } catch (error) {
          console.error('Failed to join room:', error);
          showToast("Invalid code. Please try again.", "error");
          return false;
        } finally {
          setLoading(false);
        }
      },
      [showToast, cleanupWebSocketSubscriptions]
  );

  const processFiles = useCallback(async (selectedFiles) => {
    if (!isConnected) {
      showToast("Please join a session first", "error");
      return;
    }

    const MAX_SIZE = 100 * 1024 * 1024;
    const oversizedFiles = selectedFiles.filter(f => f.size > MAX_SIZE);

    if (oversizedFiles.length > 0) {
      showToast(
          `Some files exceed 100MB: ${oversizedFiles.map(f => f.name).join(', ')}`,
          "error"
      );
      selectedFiles = selectedFiles.filter(f => f.size <= MAX_SIZE);
    }

    if (selectedFiles.length === 0) return;

    for (const file of selectedFiles) {
      const tempId = Math.random().toString(36).slice(2);
      const fileObj = {
        id: tempId,
        name: file.name,
        size: file.size,
        status: "uploading",
        progress: 0
      };
      setFiles(prev => [...prev, fileObj]);

      try {
        const { signedUrl, objectPath } = await api.requestUpload(
            currentSession.id,
            file.name,
            file.size,
            file.type || "application/octet-stream"
        );

        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const progress = (e.loaded / e.total) * 100;
            setFiles(prev => prev.map(f =>
                f.id === tempId ? { ...f, progress } : f
            ));
          }
        });

        xhr.addEventListener('load', async () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const metadata = await api.confirmUpload({
                roomId: currentSession.id,
                fileName: file.name,
                objectPath,
                contentType: file.type,
                fileSize: file.size,
              });

              setFiles(prev => prev.map(f =>
                  f.id === tempId
                      ? { ...f, status: "uploaded", progress: 100, serverFileId: metadata.id }
                      : f
              ));

              busRef.current.emit("fileUploaded", {
                ...fileObj,
                status: "uploaded",
                serverFileId: metadata.id,
              });

              showToast(`${file.name} sent successfully`);
            } catch (confirmError) {
              console.error('Failed to confirm upload:', confirmError);
              setFiles(prev => prev.map(f =>
                  f.id === tempId ? { ...f, status: "error" } : f
              ));
              showToast(`Failed to confirm ${file.name}`, "error");
            }
          } else {
            setFiles(prev => prev.map(f =>
                f.id === tempId ? { ...f, status: "error" } : f
            ));
            showToast(`Failed to upload ${file.name}`, "error");
          }
        });

        xhr.addEventListener('error', () => {
          setFiles(prev => prev.map(f =>
              f.id === tempId ? { ...f, status: "error" } : f
          ));
          showToast(`Failed to upload ${file.name}`, "error");
        });

        xhr.open('PUT', signedUrl);
        xhr.setRequestHeader('Content-Type', file.type);
        xhr.send(file);

      } catch (error) {
        console.error('Upload failed:', error);
        setFiles(prev => prev.map(f =>
            f.id === tempId ? { ...f, status: "error" } : f
        ));
        showToast(`Failed to upload ${file.name}`, "error");
      }
    }
  }, [isConnected, currentSession, showToast]);

  const downloadFile = useCallback(
      async (fileId) => {
        if (!currentSession) return;

        try {
          const file = files.find(f => f.id === fileId);
          if (!file) return;

          const response = await api.getDownloadUrl(
              currentSession.id,
              file.serverFileId || fileId
          );

          const link = document.createElement('a');
          link.href = response.downloadUrl;
          link.download = file.name;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);

          setFiles(prev => prev.map(f =>
              f.id === fileId ? { ...f, status: "downloaded" } : f
          ));

          showToast(`Downloaded ${file.name}`);
        } catch (error) {
          console.error('Download failed:', error);
          showToast(`Failed to download file`, "error");
        }
      },
      [currentSession, files, showToast]
  );

  const downloadAllFiles = useCallback(async () => {
    if (!currentSession || files.length === 0) {
      showToast("No files to download", "error");
      return;
    }

    const uploadedFiles = files.filter(f => f.status === "uploaded");

    if (uploadedFiles.length === 0) {
      showToast("No files available to download", "error");
      return;
    }

    showToast(`Downloading ${uploadedFiles.length} file(s)...`);

    for (const file of uploadedFiles) {
      await downloadFile(file.id);
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    showToast("All files downloaded!");
  }, [currentSession, files, downloadFile, showToast]);

  const toggleAutoDownload = useCallback(() => {
    setAutoDownload((v) => {
      const nv = !v;
      showToast(nv ? "Auto-download enabled" : "Auto-download disabled");
      return nv;
    });
  }, [showToast]);

  const leaveRoom = useCallback(async () => {
    const hasFiles = files.length > 0;

    if (hasFiles) {
      const confirmed = window.confirm(
          "Are you sure you want to leave? Any unsent files will be lost."
      );
      if (!confirmed) return;
    }

    if (countdownRef.current) clearInterval(countdownRef.current);

    cleanupWebSocketSubscriptions();

    if (wsRef.current) {
      try {
        wsRef.current.disconnect();
      } catch (e) {
        console.error('Failed to disconnect:', e);
      }
      wsRef.current = null;
    }

    setCurrentSession(null);
    setAutoDownload(false);
    setTimeLeft(600);
    setFiles([]);
    setIsConnected(false);

    showToast("Left session");
  }, [files, showToast, cleanupWebSocketSubscriptions]);

  const resetSession = leaveRoom;

  useEffect(() => {
    if (!autoDownload) return;

    const off = busRef.current.on("fileUploaded", (file) => {
      if (file.status === "uploaded") {
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

  useEffect(() => {
    if (!currentSession) return;

    if (timeLeft === 60) {
      showToast("Session expires in 1 minute", "error");
    } else if (timeLeft === 300) {
      showToast("5 minutes remaining", "error");
    }
  }, [timeLeft, currentSession, showToast]);

  useEffect(() => {
    return () => {
      cleanupWebSocketSubscriptions();
      if (countdownRef.current) clearInterval(countdownRef.current);
      if (wsRef.current) wsRef.current.disconnect();
    };
  }, [cleanupWebSocketSubscriptions]);

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
        leaveRoom,
        downloadAllFiles,
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
        leaveRoom,
        downloadAllFiles,
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