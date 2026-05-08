"use client";

import { useEffect } from "react";

export type ToastType = "success" | "error" | "info";

interface ToastProps {
  message: string;
  type?: ToastType;
  visible: boolean;
  onDismiss: () => void;
}

const styles: Record<ToastType, { wrapper: string; icon: string; iconBg: string; glyph: string }> = {
  success: { wrapper: "border-green-200", icon: "text-green-600", iconBg: "bg-green-50", glyph: "✓" },
  error:   { wrapper: "border-red-200",   icon: "text-red-600",   iconBg: "bg-red-50",   glyph: "⚠" },
  info:    { wrapper: "border-blue-200",  icon: "text-blue-600",  iconBg: "bg-blue-50",  glyph: "ℹ" },
};

export default function Toast({
  message,
  type = "success",
  visible,
  onDismiss,
}: ToastProps) {
  useEffect(() => {
    if (!visible) return;
    const t = setTimeout(onDismiss, 3500);
    return () => clearTimeout(t);
  }, [visible, onDismiss]);

  if (!visible) return null;

  const s = styles[type];

  return (
    <div className="fixed top-20 right-4 z-[200] max-w-xs w-full animate-eduweb-toast-in pointer-events-auto">
      <div className={`flex items-start gap-3 bg-white border ${s.wrapper} rounded-2xl shadow-lg px-4 py-3`}>
        <span className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mt-0.5 ${s.iconBg} ${s.icon}`}>
          {s.glyph}
        </span>
        <p className="flex-1 text-sm text-slate-700 leading-snug pt-0.5">{message}</p>
        <button
          onClick={onDismiss}
          aria-label="Dismiss notification"
          className="flex-shrink-0 text-slate-300 hover:text-slate-500 transition-colors duration-150 text-sm mt-0.5"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
