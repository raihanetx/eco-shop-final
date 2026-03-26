// Delta Sync - Intelligent Push System
// Server sends ONLY what changed, Client applies directly - NO refetching needed!

import { create } from 'zustand'

// ============================================
// DELTA EVENT TYPES - Server sends actual data
// ============================================

export type DeltaEvent =
  // Product events - send full product data
  | { type: 'PRODUCT_CREATED'; product: any }
  | { type: 'PRODUCT_UPDATED'; product: any }
  | { type: 'PRODUCT_DELETED'; productId: number }
  
  // Category events
  | { type: 'CATEGORY_CREATED'; category: any }
  | { type: 'CATEGORY_UPDATED'; category: any }
  | { type: 'CATEGORY_DELETED'; categoryId: string }
  
  // Stock events - send only stock data
  | { type: 'STOCK_CHANGED'; productId: number; variantId?: number; stock: number }
  
  // Order events
  | { type: 'ORDER_CREATED'; order: any }
  | { type: 'ORDER_STATUS_CHANGED'; orderId: string; status: string; courierStatus?: string }
  | { type: 'ORDER_UPDATED'; order: any }
  
  // Review events
  | { type: 'REVIEW_CREATED'; productId: number; review: any }
  
  // Settings events
  | { type: 'SETTINGS_CHANGED'; changes: Record<string, any> }
  
  // Coupon events
  | { type: 'COUPON_CREATED'; coupon: any }
  | { type: 'COUPON_UPDATED'; coupon: any }
  | { type: 'COUPON_DELETED'; couponId: string }

// ============================================
// DELTA SYNC STORE - Apply changes directly
// ============================================

interface DeltaSyncState {
  // Connection status
  isConnected: boolean
  lastSyncTime: number | null
  
  // Delta counters (for UI notification)
  pendingUpdates: {
    products: number
    orders: number
    stock: number
    reviews: number
  }
  
  // Actions
  applyDelta: (event: DeltaEvent) => void
  clearPending: (type: keyof DeltaSyncState['pendingUpdates']) => void
}

// Global state for delta sync
export const useDeltaSyncStore = create<DeltaSyncState>((set, get) => ({
  isConnected: false,
  lastSyncTime: null,
  pendingUpdates: {
    products: 0,
    orders: 0,
    stock: 0,
    reviews: 0,
  },
  
  applyDelta: (event: DeltaEvent) => {
    set(state => ({
      lastSyncTime: Date.now(),
      pendingUpdates: {
        ...state.pendingUpdates,
        // Increment counters based on event type
        products: state.pendingUpdates.products + (event.type.startsWith('PRODUCT') ? 1 : 0),
        orders: state.pendingUpdates.orders + (event.type.startsWith('ORDER') ? 1 : 0),
        stock: state.pendingUpdates.stock + (event.type === 'STOCK_CHANGED' ? 1 : 0),
        reviews: state.pendingUpdates.reviews + (event.type.startsWith('REVIEW') ? 1 : 0),
      }
    }))
    
    // Log the delta
    console.log('[DeltaSync] Applied:', event.type)
  },
  
  clearPending: (type) => {
    set(state => ({
      pendingUpdates: {
        ...state.pendingUpdates,
        [type]: 0
      }
    }))
  },
}))

// ============================================
// SSE CONNECTION FOR DELTA SYNC
// ============================================

class DeltaSyncConnection {
  private eventSource: EventSource | null = null
  private listeners: Map<string, Set<(data: DeltaEvent) => void>> = new Map()
  private reconnectAttempts = 0
  private maxReconnectAttempts = 10
  private reconnectDelay = 1000
  
  connect() {
    if (this.eventSource) return
    
    try {
      this.eventSource = new EventSource('/api/delta-sync')
      
      this.eventSource.onopen = () => {
        console.log('[DeltaSync] Connected - Server will push changes automatically')
        useDeltaSyncStore.getState().isConnected = true
        this.reconnectAttempts = 0
      }
      
      this.eventSource.onmessage = (event) => {
        try {
          const delta = JSON.parse(event.data) as DeltaEvent
          
          // Apply delta to global state
          useDeltaSyncStore.getState().applyDelta(delta)
          
          // Notify all listeners
          const listeners = this.listeners.get(delta.type)
          if (listeners) {
            listeners.forEach(cb => cb(delta))
          }
          
          // Also notify wildcard listeners
          const allListeners = this.listeners.get('*')
          if (allListeners) {
            allListeners.forEach(cb => cb(delta))
          }
        } catch (e) {
          // Ignore parse errors
        }
      }
      
      this.eventSource.onerror = () => {
        console.log('[DeltaSync] Disconnected, reconnecting...')
        useDeltaSyncStore.getState().isConnected = false
        this.reconnect()
      }
    } catch (error) {
      this.reconnect()
    }
  }
  
  private reconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) return
    
    this.reconnectAttempts++
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1)
    
    setTimeout(() => {
      this.disconnect()
      this.connect()
    }, delay)
  }
  
  disconnect() {
    this.eventSource?.close()
    this.eventSource = null
    useDeltaSyncStore.getState().isConnected = false
  }
  
  subscribe(eventType: string | '*', callback: (data: DeltaEvent) => void): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set())
    }
    this.listeners.get(eventType)!.add(callback)
    
    if (!this.eventSource) this.connect()
    
    return () => {
      this.listeners.get(eventType)?.delete(callback)
    }
  }
}

export const deltaSyncConnection = new DeltaSyncConnection()

// ============================================
// HOOKS FOR COMPONENTS
// ============================================

import { useEffect, useRef, useCallback, useState } from 'react'

/**
 * Hook to receive delta updates for a specific entity type
 * NO POLLING - Server pushes only when something changes!
 * 
 * Usage:
 * useDeltaSyncEvent('PRODUCT_UPDATED', (delta) => {
 *   // delta.product contains the updated product
 *   updateLocalProduct(delta.product)
 * })
 */
export function useDeltaSyncEvent(
  eventType: string | '*',
  onDelta: (delta: DeltaEvent) => void
) {
  const callbackRef = useRef(onDelta)
  callbackRef.current = onDelta
  
  useEffect(() => {
    return deltaSyncConnection.subscribe(eventType, (delta) => {
      callbackRef.current(delta)
    })
  }, [eventType])
}

// Alias for backwards compatibility
export const useDeltaSync = useDeltaSyncEvent

/**
 * Hook to keep a list in sync with server deltas
 * Automatically applies CREATE/UPDATE/DELETE events
 * 
 * Usage:
 * const products = useDeltaSyncList<Product>('PRODUCT', initialProducts)
 */
export function useDeltaSyncList<T extends { id: string | number }>(
  entityType: string,
  initialData: T[]
): T[] {
  const [data, setData] = useState<T[]>(initialData)
  
  // Subscribe to all events for this entity type
  useDeltaSync('*', (delta) => {
    if (!delta.type.startsWith(entityType)) return
    
    if (delta.type === `${entityType}_CREATED`) {
      const newItem = (delta as any)[entityType.toLowerCase()]
      if (newItem) {
        setData(prev => [...prev, newItem])
      }
    } else if (delta.type === `${entityType}_UPDATED`) {
      const updatedItem = (delta as any)[entityType.toLowerCase()]
      if (updatedItem) {
        setData(prev => prev.map(item => 
          item.id === updatedItem.id ? updatedItem : item
        ))
      }
    } else if (delta.type === `${entityType}_DELETED`) {
      const deletedId = (delta as any)[`${entityType.toLowerCase()}Id`]
      if (deletedId !== undefined) {
        setData(prev => prev.filter(item => item.id !== deletedId))
      }
    }
  })
  
  return data
}

/**
 * Hook to keep a single entity in sync
 * 
 * Usage:
 * const product = useDeltaSyncEntity<Product>('PRODUCT', productId, initialProduct)
 */
export function useDeltaSyncEntity<T extends { id: string | number }>(
  entityType: string,
  entityId: string | number,
  initialData: T
): T {
  const [data, setData] = useState<T>(initialData)
  
  useDeltaSync(`${entityType}_UPDATED`, (delta) => {
    const updated = (delta as any)[entityType.toLowerCase()]
    if (updated && updated.id === entityId) {
      setData(updated)
    }
  })
  
  return data
}

/**
 * Hook for real-time stock updates
 * 
 * Usage:
 * const { stock, hasChanged } = useDeltaStock(productId, initialStock)
 */
export function useDeltaStock(productId: number, initialStock: number) {
  const [stock, setStock] = useState(initialStock)
  const [hasChanged, setHasChanged] = useState(false)
  const [lastChanged, setLastChanged] = useState<Date | null>(null)
  
  useDeltaSync('STOCK_CHANGED', (delta) => {
    if (delta.type === 'STOCK_CHANGED' && delta.productId === productId) {
      setStock(delta.stock)
      setHasChanged(true)
      setLastChanged(new Date())
      
      // Reset hasChanged after animation
      setTimeout(() => setHasChanged(false), 2000)
    }
  })
  
  return { stock, hasChanged, lastChanged }
}

/**
 * Hook for real-time order updates
 * 
 * Usage:
 * const { orders, newCount, clearNewCount } = useDeltaOrders(initialOrders)
 */
export function useDeltaOrders(initialOrders: any[]) {
  const [orders, setOrders] = useState<any[]>(initialOrders)
  const [newCount, setNewCount] = useState(0)
  
  useDeltaSync('*', (delta) => {
    if (delta.type === 'ORDER_CREATED') {
      setOrders(prev => [delta.order, ...prev])
      setNewCount(c => c + 1)
    } else if (delta.type === 'ORDER_STATUS_CHANGED') {
      setOrders(prev => prev.map(o => 
        o.id === delta.orderId 
          ? { ...o, status: delta.status, ...(delta.courierStatus && { courierStatus: delta.courierStatus }) }
          : o
      ))
    } else if (delta.type === 'ORDER_UPDATED') {
      setOrders(prev => prev.map(o => 
        o.id === delta.order.id ? delta.order : o
      ))
    }
  })
  
  const clearNewCount = useCallback(() => setNewCount(0), [])
  
  return { orders, newCount, clearNewCount }
}

/**
 * Hook for settings updates
 * 
 * Usage:
 * const settings = useDeltaSettings(initialSettings)
 */
export function useDeltaSettings<T extends Record<string, any>>(initialSettings: T): T {
  const [settings, setSettings] = useState<T>(initialSettings)
  
  useDeltaSync('*', (delta) => {
    // Type guard for settings changes
    if (delta.type === 'SETTINGS_CHANGED') {
      // Apply only the changed fields
      setSettings(prev => ({ ...prev, ...delta.changes }))
    }
  })
  
  return settings
}
