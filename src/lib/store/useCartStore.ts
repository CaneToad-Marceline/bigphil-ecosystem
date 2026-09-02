import { create } from 'zustand'

export interface Product {
  id: string
  name: string
  priceOffline: number
  priceMerchant: number
  costPrice: number
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
  products: Product[]
  setProducts: (products: Product[]) => void
  setOrderType: (type: OrderType) => void
  addItem: (product: Product) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  reduceStockAfterCheckout: () => void
  clearCart: () => void
  totalPrice: () => number
}

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],
  orderType: 'offline',
  products: [],
  setProducts: (products) => set({ products }),
  setOrderType: (type) => set({ orderType: type }),
  addItem: (product) => {
    set((state) => {
      const existingItem = state.items.find((item) => item.id === product.id)
      if (existingItem) {
        // Jangan tambah melebihi stok yang ada
        if (existingItem.quantity >= product.stock) return state;
        
        return {
          items: state.items.map((item) =>
            item.id === product.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          ),
        }
      }
      if (product.stock <= 0) return state;
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
      const product = state.products.find(p => p.id === productId)
      if (product && quantity > product.stock) {
        return state; // Batasi maksimal sejumlah stok
      }
      
      return {
        items: state.items.map((item) =>
          item.id === productId ? { ...item, quantity } : item
        ),
      }
    })
  },
  reduceStockAfterCheckout: () => {
    const { items, products } = get()
    const updatedProducts = products.map(product => {
      const cartItem = items.find(item => item.id === product.id)
      if (cartItem) {
        return { ...product, stock: Math.max(0, product.stock - cartItem.quantity) }
      }
      return product
    })
    set({ products: updatedProducts })
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
