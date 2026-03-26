'use client'

import { useEffect, useRef } from 'react'
import { create } from 'zustand'

// Toast store for global state - minimal, just for triggering
interface ToastState {
  visible: boolean
  showToast: () => void
  hideToast: () => void
}

export const useCartToast = create<ToastState>((set) => ({
  visible: false,
  showToast: () => set({ visible: true }),
  hideToast: () => set({ visible: false }),
}))

// Simple center text toast - shows "Added to cart!" briefly
export function CartToast() {
  const { visible, hideToast } = useCartToast()
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  useEffect(() => {
    if (visible) {
      timerRef.current = setTimeout(() => {
        hideToast()
      }, 1000)
    }
  }, [visible, hideToast])

  if (!visible) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none">
      <div className="bg-black/80 text-white px-8 py-4 rounded-xl animate-fade-in">
        <div className="flex items-center gap-3">
          <i className="ri-checkbox-circle-fill text-2xl text-green-400"></i>
          <span className="font-bold text-lg font-bangla">কার্টে যোগ হয়েছে!</span>
        </div>
      </div>
      
      <style jsx>{`
        @keyframes fade-in {
          0% { opacity: 0; transform: scale(0.9); }
          100% { opacity: 1; transform: scale(1); }
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out forwards;
        }
      `}</style>
    </div>
  )
}
