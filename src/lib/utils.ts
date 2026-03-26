import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Round a number to whole integer (no decimals)
export function roundPrice(value: number | string | null | undefined): number {
  if (value === null || value === undefined) return 0
  const num = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(num)) return 0
  return Math.round(num)
}

// Format price for display (always whole number)
export function formatPrice(value: number | string | null | undefined): string {
  return roundPrice(value).toString()
}
