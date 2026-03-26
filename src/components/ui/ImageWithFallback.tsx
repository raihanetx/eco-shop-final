'use client'

import React, { useState } from 'react'

interface ImageWithFallbackProps {
  src: string | null | undefined
  alt: string
  className?: string
  style?: React.CSSProperties
  fallbackSrc?: string
  onClick?: () => void
}

export function ImageWithFallback({
  src,
  alt,
  className,
  style,
  fallbackSrc = '/placeholder.svg',
  onClick,
}: ImageWithFallbackProps) {
  const [error, setError] = useState(false)
  const [loaded, setLoaded] = useState(false)

  // Check if src is valid
  const isValidSrc = src && (
    src.startsWith('http') ||
    src.startsWith('/') ||
    src.startsWith('data:image')
  )

  const imageSrc = (!isValidSrc || error) ? fallbackSrc : src

  return (
    <img
      src={imageSrc}
      alt={alt}
      className={className}
      style={style}
      onClick={onClick}
      onError={() => setError(true)}
      onLoad={() => setLoaded(true)}
      loading="lazy"
    />
  )
}

// Simple hook for fallback image URL
export function useImageFallback(src: string | null | undefined, fallback: string = '/placeholder.svg'): string {
  if (!src) return fallback
  
  // Valid sources
  if (src.startsWith('http://') || src.startsWith('https://')) return src
  if (src.startsWith('/')) return src
  if (src.startsWith('data:image')) return src
  
  // Invalid source (like old local paths)
  return fallback
}
