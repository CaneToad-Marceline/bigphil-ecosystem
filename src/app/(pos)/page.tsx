"use client"

import { useEffect, useState } from 'react'
import ProductCard from '@/components/pos/ProductCard'
import CartDrawer from '@/components/pos/CartDrawer'
import { Product, useCartStore, SelectedPromoProduct } from '@/lib/store/useCartStore'
import { getProducts } from '@/lib/supabase/productActions'
import { getPromotions, Promotion } from '@/lib/supabase/promoActions'
import PromoSelectorModal from '@/components/pos/PromoSelectorModal'
import Link from 'next/link'

export default function POSPage() {
  const { addItem, addPromo, items, orderType, setOrderType, products, setProducts } = useCartStore()
  const [menuOpen, setMenuOpen] = useState(false)
  const [promos, setPromos] = useState<Promotion[]>([])
  const [selectedPromo, setSelectedPromo] = useState<Promotion | null>(null)

  useEffect(() => {
    const loadData = async () => {
      try {
        // Selalu ambil promo terbaru
        const promosData = await getPromotions()
        if (promosData) {
          setPromos(promosData.filter(p => p.is_active))
        }

        // Ambil produk hanya jika belum ada di store
        if (useCartStore.getState().products.length === 0) {
          const productsData = await getProducts()
          if (productsData) {
            const mappedProducts: Product[] = productsData
              .filter(p => p.is_active)
              .map(p => ({
                id: p.id,
                name: p.name + (p.description ? ` (${p.description})` : ''),
                priceOffline: p.price,
                priceMerchant: p.price_merchant || p.price,
                costPrice: p.cost_price || 0,
                stock_quantity: p.stock_quantity,
                image_url: p.image_url
              }))
            setProducts(mappedProducts)
          }
        }
      } catch (error) {
        console.error("Gagal memuat data:", error)
      }
    }

    loadData()
  }, [setProducts])

  const handlePromoConfirm = (selectedProducts: SelectedPromoProduct[]) => {
    if (!selectedPromo) return
    
    addPromo({
      id: selectedPromo.id,
      isPromo: true,
      name: selectedPromo.name,
      priceOffline: selectedPromo.price_offline,
      priceMerchant: selectedPromo.price_merchant,
      costPrice: 0, // modal promo sementara 0 atau dihitung ulang
      stock_quantity: 999, // qty bergantung pada sub-item
      quantity: 1,
      selectedProducts
    })
    
    setSelectedPromo(null)
  }

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(num)
  }

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden">
      {/* Kiri: Area Utama (Grid Produk) */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        
        {/* Header & Tab Switcher */}
        <div className="p-4 bg-white border-b border-slate-200 shadow-sm z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center justify-between sm:justify-start gap-4">
            
            {/* Hamburger Menu (Transisi ke Dashboard) */}
            <div className="relative">
              <button 
                onClick={() => setMenuOpen(!menuOpen)}
                className="p-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 transition"
                title="Buka Menu"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)}></div>
                  <div className="absolute top-12 left-0 w-56 bg-white border border-slate-200 shadow-xl rounded-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="px-4 py-3 bg-slate-50 border-b border-slate-100">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Navigasi Kasir</span>
                    </div>
                    <Link href="/dashboard" className="block px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-700 border-b border-slate-100 transition">
                      Ringkasan Penjualan
                    </Link>
                    <Link href="/dashboard/katalog" className="block px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition">
                      Katalog Produk
                    </Link>
                  </div>
                </>
              )}
            </div>

            <h1 className="text-2xl font-black text-slate-800 tracking-tight">
              Bigphil <span className="text-blue-600">POS</span>
            </h1>
            <div className="text-sm font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full hidden sm:block">
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
        
        {/* Daftar Promo & Grid Produk */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-6 pb-20 md:pb-6">
          
          {promos.length > 0 && (
            <div className="mb-8 border-b border-slate-200 pb-6">
              <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <span className="bg-orange-100 text-orange-600 px-2 py-1 rounded-md text-xs uppercase tracking-wider">Spesial</span>
                Daftar Promo Diskon
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {promos.map(promo => (
                  <button
                    key={promo.id}
                    onClick={() => setSelectedPromo(promo)}
                    className="flex flex-col text-left bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 hover:border-blue-400 p-4 rounded-2xl shadow-sm hover:shadow-md transition-all group"
                  >
                    <h3 className="font-bold text-blue-900 group-hover:text-blue-700 transition">{promo.name}</h3>
                    <p className="text-sm text-blue-700/70 mt-1 mb-3 flex-1">{promo.required_quantity} Varian Bebas Pilih</p>
                    <div className="flex justify-between items-end w-full">
                      <span className="text-xs font-semibold bg-blue-200/50 text-blue-800 px-2 py-1 rounded-md">
                        {orderType === 'offline' ? 'Offline' : 'Online'}
                      </span>
                      <span className="font-black text-blue-700 text-lg">
                        {formatRupiah(orderType === 'offline' ? promo.price_offline : promo.price_merchant)}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <h2 className="text-lg font-bold text-slate-800 mb-4">Katalog Produk</h2>
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

      <PromoSelectorModal 
        isOpen={!!selectedPromo}
        onClose={() => setSelectedPromo(null)}
        promo={selectedPromo}
        products={products}
        onConfirm={handlePromoConfirm}
      />
    </div>
  )
}
