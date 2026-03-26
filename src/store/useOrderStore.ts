import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Order } from '@/types'

interface OrderState {
  orders: Order[]
  addOrder: (order: Order) => void
  clearOrders: () => void
}

export const useOrderStore = create<OrderState>()(
  persist(
    (set) => ({
      orders: [],

      addOrder: (order: Order) => {
        set((state) => ({
          orders: [order, ...state.orders]
        }))
      },

      clearOrders: () => {
        set({ orders: [] })
      }
    }),
    {
      name: 'ecomart-orders',
    }
  )
)
