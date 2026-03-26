'use client'

import Image from 'next/image'
import { useState, useMemo } from 'react'
import { cn } from '@/lib/utils'

interface OptimizedImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  fill?: boolean
  className?: string
  containerClassName?: string
  priority?: boolean
  sizes?: string
  quality?: number
  fallback?: string
  onLoad?: () => void
}

// Blur placeholder - a tiny base64 encoded gray placeholder
const shimmer = (w: number, h: number) => `
<svg width="${w}" height="${h}" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <defs>
    <linearGradient id="g">
      <stop stop-color="#f3f4f6" offset="0%" />
      <stop stop-color="#e5e7eb" offset="50%" />
      <stop stop-color="#f3f4f6" offset="100%" />
    </linearGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="#f3f4f6" />
  <rect id="r" width="${w}" height="${h}" fill="url(#g)" />
  <animate xlink:href="#r" attributeName="x" from="-${w}" to="${w}" dur="1s" repeatCount="indefinite"  />
</svg>`

const toBase64 = (str: string) =>
  typeof window === 'undefined'
    ? Buffer.from(str).toString('base64')
    : window.btoa(str)

const blurPlaceholder = (w: number = 200, h: number = 200) =>
  `data:image/svg+xml;base64,${toBase64(shimmer(w, h))}`

// Default fallback image
const DEFAULT_FALLBACK = 'data:image/svg+xml;base64,' + toBase64(`
<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
  <rect width="200" height="200" fill="#f3f4f6"/>
  <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#9ca3af" font-family="system-ui" font-size="14">No Image</text>
</svg>
`)

export function OptimizedImage({
  src,
  alt,
  width = 200,
  height = 200,
  fill = false,
  className,
  containerClassName,
  priority = false,
  sizes,
  quality = 80,
  fallback = DEFAULT_FALLBACK,
  onLoad,
}: OptimizedImageProps) {
  const [error, setError] = useState(false)
  const [loaded, setLoaded] = useState(false)

  // Memoize the blur placeholder
  const placeholder = useMemo(() => blurPlaceholder(width, height), [width, height])

  // Validate and normalize URL
  const imageSrc = useMemo(() => {
    if (!src || error) return fallback
    
    // Already a valid URL
    if (src.startsWith('http') || src.startsWith('data:') || src.startsWith('/')) {
      return src
    }
    
    // Assume it's a relative path
    return `/${src}`
  }, [src, error, fallback])

  const handleLoad = () => {
    setLoaded(true)
    onLoad?.()
  }

  const handleError = () => {
    setError(true)
  }

  // Container styles
  const containerStyles = cn(
    'relative overflow-hidden bg-gray-100',
    !loaded && 'animate-pulse',
    containerClassName
  )

  // Image styles with fade-in effect
  const imageStyles = cn(
    'transition-opacity duration-300',
    loaded ? 'opacity-100' : 'opacity-0',
    className
  )

  if (fill) {
    return (
      <div className={containerStyles}>
        <Image
          src={imageSrc}
          alt={alt}
          fill
          sizes={sizes || '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw'}
          className={imageStyles}
          placeholder="blur"
          blurDataURL={placeholder}
          priority={priority}
          quality={quality}
          onLoad={handleLoad}
          onError={handleError}
        />
      </div>
    )
  }

  return (
    <div className={containerStyles}>
      <Image
        src={imageSrc}
        alt={alt}
        width={width}
        height={height}
        sizes={sizes}
        className={imageStyles}
        placeholder="blur"
        blurDataURL={placeholder}
        priority={priority}
        quality={quality}
        onLoad={handleLoad}
        onError={handleError}
      />
    </div>
  )
}

// Preset configurations for common use cases
export const ImagePresets = {
  productCard: {
    width: 200,
    height: 200,
    sizes: '(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 200px',
    quality: 85,
  },
  heroBanner: {
    width: 1920,
    height: 600,
    quality: 90,
    priority: true,
  },
  thumbnail: {
    width: 80,
    height: 80,
    quality: 70,
  },
  categoryIcon: {
    width: 64,
    height: 64,
    quality: 80,
  },
}
