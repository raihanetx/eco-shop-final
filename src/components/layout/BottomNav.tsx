'use client'

import { useRouter, usePathname } from 'next/navigation'
import { ViewType } from '@/types'

interface BottomNavProps {
  view: ViewType
  setView: (v: ViewType) => void
}

export default function BottomNav({ view, setView }: BottomNavProps) {
  const router = useRouter()
  const pathname = usePathname()
  
  // Determine active state based on pathname
  const isActive = (path: string) => {
    if (path === '/' && pathname === '/') return true
    if (path !== '/' && pathname.startsWith(path)) return true
    return false
  }
  
  const handleNav = (path: string) => {
    router.push(path)
  }
  
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-[0_-1px_4px_rgba(0,0,0,0.08)] h-[60px] flex justify-around items-center md:hidden z-[200]">
      <button 
        onClick={() => handleNav('/')} 
        className={`flex flex-col items-center justify-center flex-1 h-full cursor-pointer transition-colors ${isActive('/') ? 'text-[#16a34a]' : 'text-gray-500 hover:text-[#16a34a]'}`}
      >
        <i className="ri-home-4-line text-[22px] mb-[1px] leading-none"></i>
        <span className="text-[10px] font-medium leading-none mt-1">Home</span>
      </button>
      
      <button 
        onClick={() => handleNav('/offers')} 
        className={`flex flex-col items-center justify-center flex-1 h-full cursor-pointer transition-colors ${isActive('/offers') ? 'text-[#16a34a]' : 'text-gray-500 hover:text-[#16a34a]'}`}
      >
        <i className="ri-gift-line text-[22px] mb-[1px] leading-none"></i>
        <span className="text-[10px] font-medium leading-none mt-1">Offers</span>
      </button>
      
      <button 
        onClick={() => handleNav('/history')} 
        className={`flex flex-col items-center justify-center flex-1 h-full cursor-pointer transition-colors ${isActive('/history') ? 'text-[#16a34a]' : 'text-gray-500 hover:text-[#16a34a]'}`}
      >
        <i className="ri-file-list-3-line text-[22px] mb-[1px] leading-none"></i>
        <span className="text-[10px] font-medium leading-none mt-1">Orders</span>
      </button>
      
      <button 
        onClick={() => handleNav('/profile')} 
        className={`flex flex-col items-center justify-center flex-1 h-full cursor-pointer transition-colors ${isActive('/profile') ? 'text-[#16a34a]' : 'text-gray-500 hover:text-[#16a34a]'}`}
      >
        <i className="ri-user-line text-[22px] mb-[1px] leading-none"></i>
        <span className="text-[10px] font-medium leading-none mt-1">Profile</span>
      </button>
    </div>
  )
}
