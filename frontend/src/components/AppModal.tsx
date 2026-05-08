"use client";

interface AppModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  variant?: "info" | "danger";
  confirmLabel?: string;
  cancelLabel?: string;
  isProcessing?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export default function AppModal({
  isOpen,
  title,
  message,
  variant = "info",
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  isProcessing = false,
  onConfirm,
  onClose,
}: AppModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-eduweb-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-sm p-6 animate-eduweb-modal-in">

        {/* Icon */}
        <div className={`w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-4 ${
          variant === "danger" ? "bg-red-50" : "bg-blue-50"
        }`}>
          <span className={`text-lg ${variant === "danger" ? "text-red-600" : "text-blue-600"}`}>
            {variant === "danger" ? "⚠" : "ℹ"}
          </span>
        </div>

        <h3
          id="modal-title"
          className="text-base font-semibold text-slate-900 text-center mb-2"
        >
          {title}
        </h3>
        <p className="text-sm text-slate-500 leading-relaxed text-center mb-6">
          {message}
        </p>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition-colors duration-150 disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={isProcessing}
            className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors duration-150 disabled:opacity-60 disabled:cursor-not-allowed ${
              variant === "danger"
                ? "bg-red-600 hover:bg-red-700"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {isProcessing ? "Processing…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
