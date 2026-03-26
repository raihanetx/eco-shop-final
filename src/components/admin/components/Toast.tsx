'use client'

import React, { useEffect, useRef } from 'react'

interface ToastProps {
  show: boolean
  message: string
  type?: 'success' | 'error'
}

const Toast: React.FC<ToastProps> = ({ show, message, type = 'success' }) => {
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  if (!show) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none">
      <div className="bg-black/80 text-white px-8 py-4 rounded-xl animate-toast-in">
        <div className="flex items-center gap-3">
          <i className={`text-2xl ${type === 'success' ? 'ri-checkbox-circle-fill text-green-400' : 'ri-close-circle-fill text-red-400'}`}></i>
          <span className="font-semibold text-lg">{message}</span>
        </div>
      </div>
      
      <style jsx>{`
        @keyframes toast-in {
          0% { 
            opacity: 0; 
            transform: scale(0.9) translateY(-10px); 
          }
          100% { 
            opacity: 1; 
            transform: scale(1) translateY(0); 
          }
        }
        .animate-toast-in {
          animation: toast-in 0.25s ease-out forwards;
        }
      `}</style>
    </div>
  )
}

export default Toast
