"use client"

import { useEffect, useState } from 'react'
import ProductCard from '@/components/pos/ProductCard'
import CartDrawer from '@/components/pos/CartDrawer'
import { Product, useCartStore } from '@/lib/store/useCartStore'

// Mock Data Harga Offline & Merchant
const DUMMY_PRODUCTS: Product[] = [
  // Small Size
  { id: 's1', name: 'Ostekake Original (Small)', priceOffline: 29000, priceMerchant: 44850, stock: 10 },
  { id: 's2', name: 'Ostekake Strawberry (Small)', priceOffline: 34500, priceMerchant: 44850, stock: 5 },
  { id: 's3', name: 'Ostekake Oreo (Small)', priceOffline: 34500, priceMerchant: 44850, stock: 8 },
  { id: 's4', name: 'Ostekake Lotus Biscoff (Small)', priceOffline: 39000, priceMerchant: 50700, stock: 12 },
  { id: 's5', name: 'Ostekake Ferrero Rocher (Small)', priceOffline: 39000, priceMerchant: 50700, stock: 10 },
  { id: 's6', name: 'Ostekake Blueberry (Small)', priceOffline: 34500, priceMerchant: 44850, stock: 7 },
  // Large Size
  { id: 'l1', name: 'Ostekake Original (Large)', priceOffline: 54500, priceMerchant: 76700, stock: 15 },
  { id: 'l2', name: 'Ostekake Strawberry (Large)', priceOffline: 59000, priceMerchant: 76700, stock: 10 },
  { id: 'l3', name: 'Ostekake Oreo (Large)', priceOffline: 59000, priceMerchant: 76700, stock: 10 },
  { id: 'l4', name: 'Ostekake Lotus Biscoff (Large)', priceOffline: 65000, priceMerchant: 84500, stock: 8 },
  { id: 'l5', name: 'Ostekake Ferrero Rocher (Large)', priceOffline: 65000, priceMerchant: 84500, stock: 6 },
  { id: 'l6', name: 'Ostekake Blueberry (Large)', priceOffline: 59000, priceMerchant: 76700, stock: 9 },
]

export default function POSPage() {
  const { addItem, items, orderType, setOrderType, products, setProducts } = useCartStore()

  useEffect(() => {
    // Simulasi delay fetch data
    if (useCartStore.getState().products.length === 0) {
      setProducts(DUMMY_PRODUCTS)
    }
  }, [])

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden">
      {/* Kiri: Area Utama (Grid Produk) */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        
        {/* Header & Tab Switcher */}
        <div className="p-4 bg-white border-b border-slate-200 shadow-sm z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center justify-between sm:justify-start gap-4">
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">
              Bigphil <span className="text-blue-600">POS</span>
            </h1>
            <div className="text-sm font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
              Kasir: Admin
            </div>
          </div>
          
          {/* Tab Switcher Tipe Pesanan */}
          <div className="flex bg-slate-100 p-1 rounded-lg self-start sm:self-auto w-full sm:w-auto">
            <button 
              onClick={() => setOrderType('offline')}
              className={`flex-1 sm:flex-none px-6 py-2 rounded-md font-semibold text-sm transition-all ${
                orderType === 'offline' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Offline (Reguler)
            </button>
            <button 
              onClick={() => setOrderType('merchant')}
              className={`flex-1 sm:flex-none px-6 py-2 rounded-md font-semibold text-sm transition-all ${
                orderType === 'merchant' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Merchant (Online)
            </button>
          </div>
        </div>
        
        {/* Grid Produk */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-6 pb-20 md:pb-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} onAdd={addItem} />
            ))}
          </div>
        </div>
      </div>

      {/* Kanan: Keranjang (Drawer pada Desktop & Tablet) */}
      <div className="hidden md:block w-[350px] lg:w-[400px] h-full z-20">
        <CartDrawer />
      </div>

      {/* Bottom Sheet Sederhana (Untuk Mobile) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-slate-200 flex items-center justify-between px-4 pb-2 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-30">
        <div className="font-semibold text-slate-800">Keranjang Belanja</div>
        <div className="flex items-center gap-3">
          <span className="font-bold text-blue-600">
            {items.length} item
          </span>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold text-sm">
            Buka
          </button>
        </div>
      </div>
    </div>
  )
}
