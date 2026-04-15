"use client";

import { useEffect, useState, useCallback, createContext, useContext } from "react";

type Toast = {
  id: number;
  message: string;
  type: "info" | "success";
};

type ToastContextValue = {
  showToast: (message: string, type?: "info" | "success") => void;
};

const ToastContext = createContext<ToastContextValue>({
  showToast: () => {},
});

export function useToast() {
  return useContext(ToastContext);
}

let globalShowToast: (message: string, type?: "info" | "success") => void = () => {};

export function showComingSoon(feature?: string) {
  const msg = feature
    ? `${feature} kommer snart! Vi jobber med integrasjonen.`
    : "Denne funksjonen kommer snart! Vi jobber med det.";
  globalShowToast(msg, "info");
}

export function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  let counter = 0;

  const showToast = useCallback((message: string, type: "info" | "success" = "info") => {
    const id = ++counter;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  useEffect(() => {
    globalShowToast = showToast;
  }, [showToast]);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 items-center pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto animate-slide-up rounded-xl bg-ink px-5 py-3 text-sm text-white shadow-lg flex items-center gap-3 max-w-sm"
        >
          {toast.type === "info" ? (
            <svg className="h-5 w-5 text-amber flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          ) : (
            <svg className="h-5 w-5 text-emerald-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
          {toast.message}
        </div>
      ))}
    </div>
  );
}
