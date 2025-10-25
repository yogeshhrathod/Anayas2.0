import * as React from "react"
import { create } from "zustand"

export type Toast = {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
  // an optional action element (e.g., button)
  action?: React.ReactNode
  variant?: "default" | "destructive" | "success" | "warning"
  // minimal props we use from Radix toast
  open?: boolean
  duration?: number
}

const TOAST_LIMIT = 5

// Internal toast store
interface ToastStore {
  toasts: Toast[]
  addToast: (toast: Omit<Toast, "id">) => void
  updateToast: (id: string, toast: Partial<Toast>) => void
  dismissToast: (id?: string) => void
  removeToast: (id?: string) => void
}

export const useToastStore = create<ToastStore>((set, get) => ({
  toasts: [],
  addToast: (toast) => {
    const id = Math.random().toString(36).slice(2)
    set((state) => {
      const next = [{ ...toast, id }, ...state.toasts].slice(0, TOAST_LIMIT)
      return { toasts: next }
    })
  },
  updateToast: (id, toast) => {
    set((state) => ({
      toasts: state.toasts.map((t) => (t.id === id ? { ...t, ...toast } : t)),
    }))
  },
  dismissToast: (id) => {
    const { toasts } = get()
    if (id) {
      const t = toasts.find((t) => t.id === id)
      if (t) get().updateToast(id, { open: false })
    } else {
      toasts.forEach((t) => get().updateToast(t.id, { open: false }))
    }
  },
  removeToast: (id) => {
    if (id) set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }))
    else set({ toasts: [] })
  },
}))

export function useToast() {
  const { addToast, dismissToast } = useToastStore()

  return React.useMemo(
    () => ({
      toast: (props: Omit<Toast, "id">) => addToast({ duration: 4000, ...props }),
      dismiss: dismissToast,
      // helpers
      success: (title: React.ReactNode, description?: React.ReactNode) =>
        addToast({ title, description, variant: "success", duration: 4000 }),
      error: (title: React.ReactNode, description?: React.ReactNode) =>
        addToast({ title, description, variant: "destructive", duration: 5000 }),
      warning: (title: React.ReactNode, description?: React.ReactNode) =>
        addToast({ title, description, variant: "warning", duration: 5000 }),
    }),
    [addToast, dismissToast]
  )
}

export const toast = (
  ...args: Parameters<ReturnType<typeof useToast>["toast"]>
) => {
  const { toast } = useToastStore.getState() as any
  return toast?.(...args)
}
