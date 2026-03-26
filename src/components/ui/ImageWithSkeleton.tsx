'use client'

import React, { useState } from 'react'
import Image from 'next/image'

interface ImageWithSkeletonProps {
  src: string
  alt: string
  width?: number | string
  height?: number | string
  className?: string
  fill?: boolean
  sizes?: string
  priority?: boolean
  onClick?: () => void
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down'
}

// Skeleton loading animation component
const Skeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div 
    className={`animate-pulse bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%] ${className}`}
    style={{
      animation: 'shimmer 1.5s infinite linear'
    }}
  >
    <style jsx>{`
      @keyframes shimmer {
        0% { background-position: 200% 0; }
        100% { background-position: -200% 0; }
      }
    `}</style>
  </div>
)

export const ImageWithSkeleton: React.FC<ImageWithSkeletonProps> = ({
  src,
  alt,
  width,
  height,
  className = '',
  fill = false,
  sizes,
  priority = false,
  onClick,
  objectFit = 'cover'
}) => {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  // If no src or error, show placeholder
  if (!src || hasError) {
    return (
      <div 
        className={`relative ${className}`}
        style={{ 
          width: fill ? '100%' : width, 
          height: fill ? '100%' : height 
        }}
      >
        <Skeleton className="absolute inset-0 w-full h-full" />
      </div>
    )
  }

  return (
    <div className={`relative ${className}`} onClick={onClick}>
      {/* Skeleton while loading */}
      {isLoading && (
        <Skeleton className="absolute inset-0 w-full h-full z-10" />
      )}
      
      {/* Actual image */}
      <Image
        src={src}
        alt={alt}
        width={fill ? undefined : (typeof width === 'number' ? width : undefined)}
        height={fill ? undefined : (typeof height === 'number' ? height : undefined)}
        fill={fill}
        sizes={sizes}
        priority={priority}
        className={`transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
        style={{ objectFit }}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false)
          setHasError(true)
        }}
      />
    </div>
  )
}

// Simple skeleton for any loading state
export const ImageSkeleton: React.FC<{ 
  className?: string
  width?: number | string
  height?: number | string 
}> = ({ className = '', width, height }) => (
  <div 
    className={`relative overflow-hidden ${className}`}
    style={{ width, height }}
  >
    <Skeleton className="absolute inset-0 w-full h-full" />
  </div>
)

export default ImageWithSkeleton
