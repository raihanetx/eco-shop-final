'use client'

import { ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence, Variants } from 'framer-motion'

interface PageTransitionProviderProps {
  children: ReactNode
}

// Page transition variants - smooth fade and slide
const pageVariants: Variants = {
  initial: {
    opacity: 0,
    y: 10,
  },
  enter: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: [0.25, 0.1, 0.25, 1] as const,
    },
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: {
      duration: 0.2,
      ease: [0.25, 0.1, 0.25, 1] as const,
    },
  },
}

export function PageTransitionProvider({ children }: PageTransitionProviderProps) {
  const pathname = usePathname()

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial="initial"
        animate="enter"
        exit="exit"
        variants={pageVariants}
        className="min-h-screen"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}
