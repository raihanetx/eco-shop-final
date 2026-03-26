/**
 * Animation Variants for Framer Motion
 * 
 * WHY: Consistent animations across the app
 * - Same timing, same feel
 * - Easy to maintain
 * - Professional look
 * 
 * WHAT MAKES THIS SMART:
 * - Reduced motion support for accessibility
 * - Smooth spring physics
 * - Staggered animations for lists
 */

import { Variants, Transition } from 'framer-motion'

// === TRANSITION PRESETS ===
export const transitions = {
  fast: { duration: 0.15, ease: 'easeOut' } as Transition,
  normal: { duration: 0.25, ease: 'easeOut' } as Transition,
  slow: { duration: 0.4, ease: 'easeOut' } as Transition,
  spring: { type: 'spring', stiffness: 400, damping: 30 } as Transition,
  springGentle: { type: 'spring', stiffness: 200, damping: 25 } as Transition,
  springBouncy: { type: 'spring', stiffness: 500, damping: 20 } as Transition,
}

// === FADE ANIMATIONS ===
export const fadeIn: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
}

export const fadeInUp: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
}

export const fadeInDown: Variants = {
  initial: { opacity: 0, y: -20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 10 },
}

export const fadeInScale: Variants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
}

// === SLIDE ANIMATIONS ===
export const slideInLeft: Variants = {
  initial: { opacity: 0, x: -30 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
}

export const slideInRight: Variants = {
  initial: { opacity: 0, x: 30 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 20 },
}

export const slideInUp: Variants = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 20 },
}

// === SCALE ANIMATIONS ===
export const scaleIn: Variants = {
  initial: { opacity: 0, scale: 0.8 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.8 },
}

export const popIn: Variants = {
  initial: { opacity: 0, scale: 0.5 },
  animate: { 
    opacity: 1, 
    scale: 1,
    transition: { type: 'spring', stiffness: 500, damping: 15 }
  },
  exit: { opacity: 0, scale: 0.5 },
}

// === CART SPECIFIC ANIMATIONS ===
export const cartItemAdd: Variants = {
  initial: { opacity: 0, x: 50, scale: 0.8 },
  animate: { 
    opacity: 1, 
    x: 0, 
    scale: 1,
    transition: { type: 'spring', stiffness: 400, damping: 25 }
  },
  exit: { 
    opacity: 0, 
    x: -50, 
    scale: 0.8,
    transition: { duration: 0.2 }
  },
}

export const cartItemRemove: Variants = {
  initial: { opacity: 1, x: 0, scale: 1 },
  animate: { opacity: 1, x: 0, scale: 1 },
  exit: { 
    opacity: 0, 
    x: -100, 
    scale: 0.8,
    transition: { duration: 0.3, ease: 'easeIn' }
  },
}

export const cartBounce: Variants = {
  initial: { scale: 1 },
  animate: { 
    scale: [1, 1.2, 1],
    transition: { duration: 0.3 }
  },
}

// === PRODUCT CARD ANIMATIONS ===
export const productCardHover: Variants = {
  initial: { y: 0, scale: 1 },
  hover: { 
    y: -5, 
    scale: 1.02,
    transition: { type: 'spring', stiffness: 400, damping: 20 }
  },
  tap: { 
    scale: 0.98,
    transition: { duration: 0.1 }
  },
}

export const productImageHover: Variants = {
  initial: { scale: 1 },
  hover: { 
    scale: 1.1,
    transition: { duration: 0.3, ease: 'easeOut' }
  },
}

// === BUTTON ANIMATIONS ===
export const buttonTap: Variants = {
  initial: { scale: 1 },
  tap: { 
    scale: 0.95,
    transition: { duration: 0.1 }
  },
}

export const buttonSuccess: Variants = {
  initial: { scale: 1 },
  success: { 
    scale: [1, 1.1, 1],
    transition: { duration: 0.3 }
  },
}

// === MODAL/OVERLAY ANIMATIONS ===
export const modalOverlay: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
}

export const modalContent: Variants = {
  initial: { opacity: 0, scale: 0.95, y: 20 },
  animate: { 
    opacity: 1, 
    scale: 1, 
    y: 0,
    transition: { type: 'spring', stiffness: 300, damping: 25 }
  },
  exit: { 
    opacity: 0, 
    scale: 0.95, 
    y: 20,
    transition: { duration: 0.2 }
  },
}

export const modalSlideUp: Variants = {
  initial: { opacity: 0, y: '100%' },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: { type: 'spring', stiffness: 300, damping: 30 }
  },
  exit: { 
    opacity: 0, 
    y: '100%',
    transition: { duration: 0.25, ease: 'easeIn' }
  },
}

// === LIST STAGGER ANIMATIONS ===
export const staggerContainer: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    }
  },
  exit: {
    transition: {
      staggerChildren: 0.03,
      staggerDirection: -1,
    }
  },
}

export const staggerItem: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: { type: 'spring', stiffness: 300, damping: 24 }
  },
  exit: { 
    opacity: 0, 
    y: -10,
    transition: { duration: 0.15 }
  },
}

export const staggerItemFast: Variants = {
  initial: { opacity: 0, y: 10 },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.2 }
  },
  exit: { 
    opacity: 0, 
    transition: { duration: 0.1 }
  },
}

// === NOTIFICATION/TOAST ANIMATIONS ===
export const toastSlideIn: Variants = {
  initial: { opacity: 0, x: 100, scale: 0.9 },
  animate: { 
    opacity: 1, 
    x: 0, 
    scale: 1,
    transition: { type: 'spring', stiffness: 400, damping: 25 }
  },
  exit: { 
    opacity: 0, 
    x: 100, 
    scale: 0.9,
    transition: { duration: 0.2 }
  },
}

// === LOADING ANIMATIONS ===
export const pulse: Variants = {
  initial: { opacity: 0.5 },
  animate: { 
    opacity: [0.5, 1, 0.5],
    transition: { 
      duration: 1.5, 
      repeat: Infinity,
      ease: 'easeInOut'
    }
  },
}

export const shimmer: Variants = {
  initial: { backgroundPosition: '-200% 0' },
  animate: { 
    backgroundPosition: '200% 0',
    transition: { 
      duration: 1.5, 
      repeat: Infinity,
      ease: 'linear'
    }
  },
}

// === NUMBER/COUNTER ANIMATION ===
export const counterChange: Variants = {
  initial: { scale: 1 },
  change: { 
    scale: [1, 1.3, 1],
    transition: { duration: 0.2 }
  },
}

// === SHAKE ANIMATION (for errors) ===
export const shake: Variants = {
  initial: { x: 0 },
  shake: { 
    x: [0, -10, 10, -10, 10, 0],
    transition: { duration: 0.4 }
  },
}

// === HELPER: Check for reduced motion preference ===
export const prefersReducedMotion = typeof window !== 'undefined' 
  ? window.matchMedia('(prefers-reduced-motion: reduce)').matches 
  : false

// === HELPER: Get transition respecting reduced motion ===
export function getAccessibleTransition(transition: Transition): Transition {
  if (prefersReducedMotion) {
    return { duration: 0.01 }
  }
  return transition
}
