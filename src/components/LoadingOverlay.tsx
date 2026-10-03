interface LoadingOverlayProps {
  text?: string;
}

export default function LoadingOverlay({
  text = "Loading..."
}: LoadingOverlayProps) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white px-8 py-6 rounded-2xl border border-slate-100 shadow-2xl flex flex-col items-center gap-3">
        <span className="h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />

        <p className="text-xs font-bold text-slate-800 uppercase tracking-widest font-mono">
          {text}
        </p>
      </div>
    </div>
  );
}