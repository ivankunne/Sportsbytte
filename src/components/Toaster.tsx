"use client";

import { useEffect, useState, useCallback, useRef } from "react";

type ToastType = "info" | "success" | "error";

type Toast = {
  id: number;
  message: string;
  type: ToastType;
};

let globalShowToast: (message: string, type?: ToastType) => void = () => {};

export function showComingSoon(feature?: string) {
  const msg = feature
    ? `${feature} kommer snart!`
    : "Denne funksjonen kommer snart!";
  globalShowToast(msg, "info");
}

export function showSuccess(message: string) {
  globalShowToast(message, "success");
}

export function showError(message: string) {
  globalShowToast(message, "error");
}

export function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const counter = useRef(0);

  const showToast = useCallback((message: string, type: ToastType = "info") => {
    const id = ++counter.current;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  useEffect(() => {
    globalShowToast = showToast;
  }, [showToast]);

  if (toasts.length === 0) return null;

  const icons: Record<ToastType, React.ReactNode> = {
    info: (
      <svg className="h-5 w-5 text-amber flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
      </svg>
    ),
    success: (
      <svg className="h-5 w-5 text-emerald-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    error: (
      <svg className="h-5 w-5 text-red-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
      </svg>
    ),
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 items-center pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto rounded-xl bg-ink px-5 py-3 text-sm text-white shadow-lg flex items-center gap-3 max-w-sm"
          style={{ animation: "slideUp 0.18s ease-out" }}
        >
          {icons[toast.type]}
          {toast.message}
        </div>
      ))}
    </div>
  );
}
