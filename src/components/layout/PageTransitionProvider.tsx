'use client'

import { ReactNode } from 'react'

interface PageTransitionProviderProps {
  children: ReactNode
}

// No animations - just normal page navigation
export function PageTransitionProvider({ children }: PageTransitionProviderProps) {
  return <>{children}</>
}
