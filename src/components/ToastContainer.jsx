import React from 'react';

export default function ToastContainer({ toasts, onDismiss }) {
  return (
    <div
      id="toastContainer"
      className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none max-w-sm w-[calc(100%-2.5rem)]"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto bg-[#231712] text-[#FAF9F6] text-xs font-semibold px-4 py-3 rounded-xl shadow-lg border border-[#FAF9F6]/20 flex items-center justify-between gap-3"
        >
          <span>{toast.message}</span>
          <button
            type="button"
            onClick={() => onDismiss(toast.id)}
            aria-label="Tutup notifikasi"
            className="text-[#FAF9F6]/75 hover:text-[#FAF9F6] font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
