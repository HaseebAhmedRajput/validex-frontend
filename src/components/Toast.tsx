 

import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle, AlertCircle, X, Info } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  text: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onClose: (id: string) => void;
}

export default function ToastContainer({ toasts, onClose }: ToastProps) {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-lg ${
              toast.type === 'success'
                ? 'bg-emerald-50 border-emerald-100 text-emerald-800'
                : toast.type === 'error'
                ? 'bg-rose-50 border-rose-100 text-rose-800'
                : 'bg-indigo-50 border-indigo-100 text-indigo-800'
            }`}
          >
            <div className="mt-0.5">
              {toast.type === 'success' && <CheckCircle className="h-5 w-5 text-emerald-600" />}
              {toast.type === 'error' && <AlertCircle className="h-5 w-5 text-rose-600" />}
              {toast.type === 'info' && <Info className="h-5 w-5 text-indigo-600" />}
            </div>
            
            <div className="flex-1 text-sm font-medium leading-relaxed">
              {toast.text}
            </div>
            
            <button
              onClick={() => onClose(toast.id)}
              className="text-slate-400 hover:text-slate-600 transition-colors p-0.5 rounded-md hover:bg-white/50"
            >
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
