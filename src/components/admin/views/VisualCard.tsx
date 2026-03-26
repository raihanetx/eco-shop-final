'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface VisualCardProps {
  title: string
  subtitle?: string
  children: React.ReactNode
  className?: string
  delay?: number
}

export const VisualCard: React.FC<VisualCardProps> = ({ 
  title, 
  subtitle, 
  children, 
  className,
  delay = 0 
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className={cn(
        "bg-white border border-slate-200 rounded-xl p-6 flex flex-col gap-4 overflow-hidden",
        "hover:border-slate-300 transition-all group",
        className
      )}
    >
      <div className="flex flex-col gap-1">
        <h3 className="text-[10px] font-mono uppercase tracking-widest text-slate-400 group-hover:text-slate-600 transition-colors">
          {title}
        </h3>
        {subtitle && (
          <p className="text-2xl font-light tracking-tight text-slate-900">
            {subtitle}
          </p>
        )}
      </div>
      <div className="flex-1 min-h-[120px] relative">
        {children}
      </div>
    </motion.div>
  )
}
