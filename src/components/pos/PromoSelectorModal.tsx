"use client"

import { useState, useMemo } from 'react'
import { Product, SelectedPromoProduct } from '@/lib/store/useCartStore'
import { Promotion } from '@/lib/supabase/promoActions'

interface PromoSelectorModalProps {
  isOpen: boolean
  onClose: () => void
  promo: Promotion | null
  products: Product[] // all available products from cart store
  onConfirm: (selected: SelectedPromoProduct[]) => void
}

export default function PromoSelectorModal({ isOpen, onClose, promo, products, onConfirm }: PromoSelectorModalProps) {
  const [selectedCounts, setSelectedCounts] = useState<Record<string, number>>({})

  // Reset when opened
  useMemo(() => {
    if (isOpen) {
      setSelectedCounts({})
    }
  }, [isOpen])

  if (!isOpen || !promo) return null

  // Hanya produk yang ada di daftar eligible
  const eligibleProducts = products.filter(p => promo.eligible_product_ids?.includes(p.id))
  
  const totalSelected = Object.values(selectedCounts).reduce((a, b) => a + b, 0)
  const isFulfilled = totalSelected === promo.required_quantity

  const handleAdd = (product: Product) => {
    if (totalSelected >= promo.required_quantity) return // udah penuh

    const currentQty = selectedCounts[product.id] || 0
    if (currentQty >= product.stock_quantity) {
      alert("Stok tidak mencukupi")
      return
    }

    setSelectedCounts(prev => ({
      ...prev,
      [product.id]: currentQty + 1
    }))
  }

  const handleReduce = (productId: string) => {
    const currentQty = selectedCounts[productId] || 0
    if (currentQty > 0) {
      setSelectedCounts(prev => ({
        ...prev,
        [productId]: currentQty - 1
      }))
    }
  }

  const handleConfirm = () => {
    if (!isFulfilled) return

    const result: SelectedPromoProduct[] = []
    Object.entries(selectedCounts).forEach(([id, qty]) => {
      if (qty > 0) {
        const prod = eligibleProducts.find(p => p.id === id)
        if (prod) {
          result.push({
            id: prod.id,
            name: prod.name,
            quantity: qty
          })
        }
      }
    })

    onConfirm(result)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-6 bg-gradient-to-br from-blue-600 to-blue-800 text-white flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-black tracking-tight">{promo.name}</h2>
            <p className="text-blue-100 font-medium mt-1">
              Pilih {promo.required_quantity} item. Terpilih: {totalSelected}/{promo.required_quantity}
            </p>
          </div>
          <button onClick={onClose} className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
          {eligibleProducts.length === 0 ? (
            <div className="text-center py-10 text-slate-400 font-medium">
              Tidak ada produk valid yang tersedia untuk promo ini.
            </div>
          ) : (
            eligibleProducts.map(product => {
              const qty = selectedCounts[product.id] || 0
              return (
                <div key={product.id} className={`flex justify-between items-center bg-white p-4 rounded-2xl border transition-all ${qty > 0 ? 'border-blue-500 shadow-md shadow-blue-500/10' : 'border-slate-200 shadow-sm'}`}>
                  <div className="flex-1 pr-4">
                    <h4 className="font-bold text-slate-800 leading-tight">{product.name}</h4>
                    <p className="text-xs font-semibold text-slate-400 mt-1">Stok: {product.stock_quantity}</p>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => handleReduce(product.id)}
                      disabled={qty === 0}
                      className="w-10 h-10 flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full font-bold transition disabled:opacity-50"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                    <span className="w-6 text-center font-black text-xl text-slate-800">{qty}</span>
                    <button 
                      onClick={() => handleAdd(product)}
                      disabled={totalSelected >= promo.required_quantity || qty >= product.stock_quantity}
                      className="w-10 h-10 flex items-center justify-center bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-full font-bold transition disabled:opacity-50"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>

        <div className="p-6 bg-white border-t border-slate-100">
          <button 
            onClick={handleConfirm}
            disabled={!isFulfilled}
            className="w-full py-4 rounded-xl font-black text-lg transition-all flex justify-center items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed"
          >
            {isFulfilled ? (
              <>
                <span>Tambah ke Keranjang</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </>
            ) : (
              <span>Pilih {promo.required_quantity - totalSelected} Item Lagi</span>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
