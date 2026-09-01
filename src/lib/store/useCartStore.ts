import { create } from 'zustand'

export interface Product {
  id: string
  name: string
  priceOffline: number
  priceMerchant: number
  stock: number
  image_url?: string
}

export interface CartItem extends Product {
  quantity: number
}

export type OrderType = 'offline' | 'merchant'

interface CartStore {
  items: CartItem[]
  orderType: OrderType
  setOrderType: (type: OrderType) => void
  addItem: (product: Product) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  totalPrice: () => number
}

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],
  orderType: 'offline',
  setOrderType: (type) => set({ orderType: type }),
  addItem: (product) => {
    set((state) => {
      const existingItem = state.items.find((item) => item.id === product.id)
      if (existingItem) {
        return {
          items: state.items.map((item) =>
            item.id === product.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          ),
        }
      }
      return { items: [...state.items, { ...product, quantity: 1 }] }
    })
  },
  removeItem: (productId) => {
    set((state) => ({
      items: state.items.filter((item) => item.id !== productId),
    }))
  },
  updateQuantity: (productId, quantity) => {
    set((state) => {
      if (quantity <= 0) {
        return {
          items: state.items.filter((item) => item.id !== productId),
        }
      }
      return {
        items: state.items.map((item) =>
          item.id === productId ? { ...item, quantity } : item
        ),
      }
    })
  },
  clearCart: () => set({ items: [] }),
  totalPrice: () => {
    const { items, orderType } = get()
    return items.reduce((total, item) => {
      const price = orderType === 'offline' ? item.priceOffline : item.priceMerchant
      return total + (price * item.quantity)
    }, 0)
  },
}))
