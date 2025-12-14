// components/ConfirmationModal.tsx - Reusable confirmation modal

import { motion, AnimatePresence } from "framer-motion";

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  warnings?: string[];
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: "danger" | "warning" | "info";
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmationModal({
  isOpen,
  title,
  message,
  warnings = [],
  confirmText = "Confirm",
  cancelText = "Cancel",
  confirmVariant = "danger",
  onConfirm,
  onCancel,
}: ConfirmationModalProps) {
  if (!isOpen) return null;

  const variantStyles = {
    danger: {
      button: "bg-red-600 hover:bg-red-700 text-white",
      icon: "text-red-500",
      border: "border-red-500/30",
    },
    warning: {
      button: "bg-orange-600 hover:bg-orange-700 text-white",
      icon: "text-orange-500",
      border: "border-orange-500/30",
    },
    info: {
      button: "bg-blue-600 hover:bg-blue-700 text-white",
      icon: "text-blue-500",
      border: "border-blue-500/30",
    },
  };

  const styles = variantStyles[confirmVariant];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onCancel}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className={`relative bg-black/90 backdrop-blur-xl rounded-2xl shadow-2xl border ${styles.border} p-6 w-full max-w-md`}
        >
          {/* Icon */}
          <div className="flex items-center justify-center mb-4">
            <div className={`w-16 h-16 rounded-full bg-${confirmVariant === "danger" ? "red" : confirmVariant === "warning" ? "orange" : "blue"}-500/20 flex items-center justify-center`}>
              <svg className={`w-8 h-8 ${styles.icon}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          </div>

          {/* Title */}
          <h2 className="text-2xl font-black text-white text-center mb-3">
            {title}
          </h2>

          {/* Message */}
          <p className="text-neutral-300 text-center mb-4">
            {message}
          </p>

          {/* Warnings */}
          {warnings.length > 0 && (
            <div className={`bg-${confirmVariant === "danger" ? "red" : confirmVariant === "warning" ? "orange" : "blue"}-500/10 border border-${confirmVariant === "danger" ? "red" : confirmVariant === "warning" ? "orange" : "blue"}-500/30 rounded-xl p-4 mb-6`}>
              <ul className="space-y-2">
                {warnings.map((warning, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-neutral-300">
                    <span className={`${styles.icon} mt-0.5`}>•</span>
                    <span>{warning}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold transition-colors"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              className={`flex-1 px-4 py-3 rounded-xl font-bold transition-colors ${styles.button}`}
            >
              {confirmText}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
