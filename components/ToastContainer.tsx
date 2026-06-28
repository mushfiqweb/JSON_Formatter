"use client";

import React from "react";
import { useJSONStore, ToastMessage } from "@/store/store";
import { X, AlertTriangle, AlertOctagon, Info, CheckCircle, Terminal } from "lucide-react";

export default function ToastContainer() {
  const toasts = useJSONStore((state) => state.toasts);
  const dismissToast = useJSONStore((state) => state.dismissToast);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-4 w-full max-w-[420px] px-4 md:px-0">
      {toasts.map((toast: ToastMessage) => {
        const isError = toast.type === "error";
        const isWarning = toast.type === "warning";
        const isInfo = toast.type === "info";
        const isSuccess = toast.type === "success";

        let TypeIcon = Info;
        let iconColor = "text-cyan-400";
        let borderGlow = "border-cyan-500/20 bg-cyan-950/10 shadow-[0_0_20px_rgba(6,182,212,0.08)]";
        let titleColor = "text-cyan-200";

        if (isError) {
          TypeIcon = AlertOctagon;
          iconColor = "text-red-400";
          borderGlow = "border-red-500/20 bg-red-950/10 shadow-[0_0_20px_rgba(239,68,68,0.08)]";
          titleColor = "text-red-200";
        } else if (isWarning) {
          TypeIcon = AlertTriangle;
          iconColor = "text-amber-400";
          borderGlow = "border-amber-500/20 bg-amber-950/10 shadow-[0_0_20px_rgba(245,158,11,0.08)]";
          titleColor = "text-amber-200";
        } else if (isSuccess) {
          TypeIcon = CheckCircle;
          iconColor = "text-emerald-400";
          borderGlow = "border-emerald-500/20 bg-emerald-950/10 shadow-[0_0_20px_rgba(16,185,129,0.08)]";
          titleColor = "text-emerald-200";
        }

        return (
          <div
            key={toast.id}
            className={`w-full p-4 rounded-xl border backdrop-blur-md transition-all duration-300 hover:scale-[1.01] ${borderGlow} animate-in fade-in slide-in-from-bottom-5`}
            role="alert"
          >
            <div className="flex items-start space-x-3">
              <div className={`p-1.5 rounded-lg bg-zinc-950/60 border border-zinc-800 ${iconColor}`}>
                <TypeIcon size={16} />
              </div>
              <div className="flex-1 min-w-0 pr-6">
                <h4 className={`text-xs font-semibold tracking-wide uppercase font-mono ${titleColor}`}>
                  {toast.title}
                </h4>
                <p className="text-[11px] text-zinc-300 mt-1 leading-relaxed font-sans">
                  {toast.description}
                </p>

                {toast.technicalNote && (
                  <div className="mt-3 rounded-lg bg-zinc-950/80 border border-zinc-900 overflow-hidden font-mono text-[9px] text-zinc-400">
                    <div className="flex items-center space-x-1.5 px-2.5 py-1.5 bg-zinc-900/50 border-b border-zinc-900 text-[8px] tracking-widest text-zinc-500 uppercase font-semibold">
                      <Terminal size={10} className={iconColor} />
                      <span>Architect Diagnostic</span>
                    </div>
                    <div className="p-2.5 text-zinc-500 select-all leading-normal whitespace-pre-wrap">
                      <span className={`${iconColor} mr-1`}>$</span>
                      {toast.technicalNote}
                    </div>
                  </div>
                )}
              </div>
              <button
                onClick={() => dismissToast(toast.id)}
                className="absolute top-3 right-3 p-1 rounded-md text-zinc-500 hover:text-white hover:bg-zinc-800/50 transition-all cursor-pointer"
                aria-label="Close notification"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
