import React from 'react';

export default function LoadingSpinner({ text = 'Loading...' }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <div className="w-8 h-8 border-2 border-slate-200 border-t-primary rounded-full animate-spin" />
      <p className="text-sm text-slate-400">{text}</p>
    </div>
  );
}

export function PageLoader() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-white z-50">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-3 border-slate-100 border-t-primary rounded-full animate-spin" />
        <p className="text-slate-500 text-sm font-medium">HR-DESK</p>
      </div>
    </div>
  );
}
