import React, { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle2, AlertTriangle, XCircle, Info, Zap, X } from "lucide-react";

export type ToastType = "success" | "warning" | "error" | "info";

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  latencyMs?: number;
}

interface ToastContextType {
  toasts: ToastItem[];
  addToast: (toast: Omit<ToastItem, "id">) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    ({ type, title, message, latencyMs }: Omit<ToastItem, "id">) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const newToast: ToastItem = { id, type, title, message, latencyMs };

      setToasts((prev) => [...prev.slice(-4), newToast]);

      setTimeout(() => {
        removeToast(id);
      }, 4500);
    },
    [removeToast]
  );

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      {/* Toast Render Viewport */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2.5 max-w-md w-full pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl border shadow-xl backdrop-blur-md transition-all duration-300 transform translate-y-0 opacity-100 ${
              t.type === "success"
                ? "bg-white/95 dark:bg-[#131926]/95 border-emerald-500/30 text-emerald-950 dark:text-emerald-50"
                : t.type === "warning"
                ? "bg-white/95 dark:bg-[#131926]/95 border-amber-500/30 text-amber-950 dark:text-amber-50"
                : t.type === "error"
                ? "bg-white/95 dark:bg-[#131926]/95 border-rose-500/30 text-rose-950 dark:text-rose-50"
                : "bg-white/95 dark:bg-[#131926]/95 border-sky-500/30 text-sky-950 dark:text-sky-50"
            }`}
          >
            <div className="mt-0.5 shrink-0">
              {t.type === "success" && <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />}
              {t.type === "warning" && <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />}
              {t.type === "error" && <XCircle className="w-5 h-5 text-rose-600 dark:text-rose-400" />}
              {t.type === "info" && <Info className="w-5 h-5 text-sky-600 dark:text-sky-400" />}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-xs text-[#1F2421] dark:text-[#F1F5F9]">{t.title}</span>
                {t.latencyMs !== undefined && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                    <Zap className="w-2.5 h-2.5" />
                    {t.latencyMs.toFixed(1)}ms
                  </span>
                )}
              </div>
              {t.message && (
                <p className="text-xs text-[#5C6460] dark:text-[#94A3B8] mt-0.5 leading-relaxed break-words">
                  {t.message}
                </p>
              )}
            </div>

            <button
              onClick={() => removeToast(t.id)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};

