'use client'

import { ReactNode } from 'react'
import { motion, AnimatePresence, Variants } from 'framer-motion'

interface PageTransitionProps {
  children: ReactNode
  className?: string
}

// Page transition variants
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

// Fade transition (lighter)
const fadeVariants: Variants = {
  initial: {
    opacity: 0,
  },
  enter: {
    opacity: 1,
    transition: {
      duration: 0.25,
      ease: 'easeOut',
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: 0.15,
      ease: 'easeIn',
    },
  },
}

// Stagger children animation
const staggerVariants: Variants = {
  initial: {},
  enter: {
    transition: {
      staggerChildren: 0.05,
    },
  },
}

const itemVariants: Variants = {
  initial: { opacity: 0, y: 20 },
  enter: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.3,
      ease: [0.25, 0.1, 0.25, 1] as const,
    }
  },
}

// Main page transition wrapper
export function PageTransition({ children, className }: PageTransitionProps) {
  return (
    <motion.div
      initial="initial"
      animate="enter"
      exit="exit"
      variants={pageVariants}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// Light fade transition for content changes
export function FadeTransition({ children, className }: PageTransitionProps) {
  return (
    <motion.div
      initial="initial"
      animate="enter"
      exit="exit"
      variants={fadeVariants}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// Stagger container for list items
export function StaggerContainer({ children, className }: PageTransitionProps) {
  return (
    <motion.div
      initial="initial"
      animate="enter"
      variants={staggerVariants}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// Stagger item for individual elements
export function StaggerItem({ children, className }: PageTransitionProps) {
  return (
    <motion.div variants={itemVariants} className={className}>
      {children}
    </motion.div>
  )
}

// Animated presence wrapper for route transitions
export function AnimatedPage({ children, className }: PageTransitionProps) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
        className={className}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}

// Skeleton pulse animation
export function SkeletonPulse({ className }: { className?: string }) {
  return (
    <motion.div
      className={`bg-gray-200 rounded ${className}`}
      animate={{
        opacity: [0.5, 1, 0.5],
      }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    />
  )
}

// Success checkmark animation
export function SuccessCheck({ show }: { show: boolean }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        >
          <i className="ri-checkbox-circle-fill text-green-500 text-2xl" />
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Counter animation
export function AnimatedCounter({ 
  value, 
  className 
}: { 
  value: number
  className?: string 
}) {
  return (
    <motion.span
      key={value}
      initial={{ scale: 1.2, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.2 }}
      className={className}
    >
      {value}
    </motion.span>
  )
}
