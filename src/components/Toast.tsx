import { useEffect, useState } from "react";
import { listen } from "@tauri-apps/api/event";
import type { ActionError } from "../types";

type ToastMessage = {
  id: number;
  text: string;
  type: "error" | "info";
};

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    let nextId = 0;

    const addToast = (text: string, type: ToastMessage["type"]) => {
      const id = nextId++;
      setToasts((prev) => [...prev, { id, text, type }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 5000);
    };

    const unlistenError = listen<ActionError>("action-error", (event) => {
      addToast(
        `スイッチ ${event.payload.endpoint_id - 1}: ${event.payload.error}`,
        "error"
      );
    });

    const unlistenOffline = listen("sidecar-offline", () => {
      addToast("Matter サーバーがオフラインになりました", "error");
    });

    return () => {
      void unlistenError.then((fn) => fn());
      void unlistenOffline.then((fn) => fn());
    };
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast toast-${toast.type}`}>
          {toast.text}
        </div>
      ))}
    </div>
  );
}
