// components/ToastContainer.tsx - Container for managing multiple toasts

import { AnimatePresence } from "framer-motion";
import Toast from "./Toast";
import type { ToastProps } from "./Toast";

interface ToastContainerProps {
  toasts: Omit<ToastProps, "onDismiss">[];
  onDismiss: (id: string) => void;
}

export default function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-md">
      <AnimatePresence>
        {toasts.map((toast) => (
          <Toast key={toast.id} {...toast} onDismiss={onDismiss} />
        ))}
      </AnimatePresence>
    </div>
  );
}
