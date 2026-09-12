import { create } from 'zustand'

export interface Product {
  id: string
  name: string
  priceOffline: number
  priceMerchant: number
  costPrice: number
  stock_quantity: number
  image_url?: string
}

export interface SelectedPromoProduct {
  id: string;
  name: string;
  quantity: number;
}

export interface CartItem extends Omit<Product, 'id'> {
  cartItemId: string; // unique local ID for cart row
  id: string; // product id OR promo id
  quantity: number;
  isPromo?: boolean;
  selectedProducts?: SelectedPromoProduct[];
}

export type OrderType = 'offline' | 'merchant'

interface CartStore {
  items: CartItem[]
  orderType: OrderType
  products: Product[]
  setProducts: (products: Product[]) => void
  setOrderType: (type: OrderType) => void
  addItem: (product: Product) => void
  addPromo: (promoItem: Omit<CartItem, 'cartItemId'>) => void
  removeItem: (cartItemId: string) => void
  updateQuantity: (cartItemId: string, quantity: number) => void
  reduceStockAfterCheckout: () => void
  clearCart: () => void
  totalPrice: () => number
}

export const useCartStore = create<CartStore>()((set, get) => ({
  items: [],
  orderType: 'offline',
  products: [],
  setProducts: (products) => set({ products }),
  setOrderType: (type) => set({ orderType: type }),
  addItem: (product: Product) => {
    set((state) => {
      // Untuk produk biasa, kita bisa merge berdasarkan id
      const existingItemIndex = state.items.findIndex((item) => item.id === product.id && !item.isPromo)
      if (existingItemIndex >= 0) {
        const existingItem = state.items[existingItemIndex]
        if (existingItem.quantity >= product.stock_quantity) return state;
        
        const newItems = [...state.items]
        newItems[existingItemIndex] = { ...existingItem, quantity: existingItem.quantity + 1 }
        return { items: newItems }
      }
      
      if (product.stock_quantity <= 0) return state;
      return { 
        items: [...state.items, { 
          ...product, 
          cartItemId: Math.random().toString(36).substring(7), // generate random id
          quantity: 1 
        }] 
      }
    })
  },
  addPromo: (promoItem) => {
    set((state) => ({
      items: [...state.items, {
        ...promoItem,
        cartItemId: Math.random().toString(36).substring(7)
      }]
    }))
  },
  removeItem: (cartItemId) => {
    set((state) => ({
      items: state.items.filter((item) => item.cartItemId !== cartItemId),
    }))
  },
  updateQuantity: (cartItemId, quantity) => {
    set((state) => {
      if (quantity <= 0) {
        return {
          items: state.items.filter((item) => item.cartItemId !== cartItemId),
        }
      }
      
      const itemToUpdate = state.items.find(i => i.cartItemId === cartItemId)
      if (!itemToUpdate) return state;

      if (!itemToUpdate.isPromo) {
        // Cek stok untuk produk biasa
        if (quantity > itemToUpdate.stock_quantity) {
          return state; 
        }
      }
      
      return {
        items: state.items.map((item) =>
          item.cartItemId === cartItemId ? { ...item, quantity } : item
        ),
      }
    })
  },
  reduceStockAfterCheckout: () => {
    const { items, products } = get()
    let updatedProducts = [...products]

    items.forEach(cartItem => {
      if (cartItem.isPromo && cartItem.selectedProducts) {
        // Kurangi stok untuk setiap produk di dalam promo
        cartItem.selectedProducts.forEach(sp => {
          const productIndex = updatedProducts.findIndex(p => p.id === sp.id)
          if (productIndex >= 0) {
            updatedProducts[productIndex] = {
              ...updatedProducts[productIndex],
              stock_quantity: Math.max(0, updatedProducts[productIndex].stock_quantity - (sp.quantity * cartItem.quantity))
            }
          }
        })
      } else {
        // Kurangi stok untuk produk biasa
        const productIndex = updatedProducts.findIndex(p => p.id === cartItem.id)
        if (productIndex >= 0) {
          updatedProducts[productIndex] = {
            ...updatedProducts[productIndex],
            stock_quantity: Math.max(0, updatedProducts[productIndex].stock_quantity - cartItem.quantity)
          }
        }
      }
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
