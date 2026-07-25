import { useEffect, useState } from "react";

type ToastType = "success" | "warning" | "error";

interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}

const toasts: ToastItem[] = [];
const listeners: Set<() => void> = new Set();

function notify() {
  listeners.forEach((fn) => fn());
}

function addToast(message: string, type: ToastType = "success") {
  const id = Date.now() + Math.random();
  toasts.push({ id, message, type });
  notify();
  setTimeout(() => {
    const idx = toasts.findIndex((t) => t.id === id);
    if (idx !== -1) {
      toasts.splice(idx, 1);
      notify();
    }
  }, 3000);
}

export function useToast() {
  const [, setTick] = useState(0);

  useEffect(() => {
    const handler = () => setTick((n) => n + 1);
    listeners.add(handler);
    return () => { listeners.delete(handler); };
  }, []);

  return {
    warning: (message: string) => addToast(message, "warning"),
    success: (message: string) => addToast(message, "success"),
    error: (message: string) => addToast(message, "error"),
  };
}
