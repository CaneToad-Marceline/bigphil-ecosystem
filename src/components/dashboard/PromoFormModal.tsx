"use client"

import { useState, useEffect } from 'react'
import { Promotion } from '@/lib/supabase/promoActions'
import { getProducts } from '@/lib/supabase/productActions'
import { Product } from '@/lib/store/useCartStore'

interface PromoFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (promo: Omit<Promotion, 'id' | 'created_at'>) => void
  initialData?: Promotion | null
}

export default function PromoFormModal({ isOpen, onClose, onSave, initialData }: PromoFormModalProps) {
  const [name, setName] = useState('')
  const [priceOffline, setPriceOffline] = useState<number | ''>('')
  const [priceMerchant, setPriceMerchant] = useState<number | ''>('')
  const [requiredQuantity, setRequiredQuantity] = useState<number | ''>('')
  const [eligibleProductIds, setEligibleProductIds] = useState<string[]>([])
  const [isActive, setIsActive] = useState(true)

  const [allProducts, setAllProducts] = useState<Product[]>([])

  useEffect(() => {
    if (isOpen) {
      getProducts().then(data => {
        if (data) {
          // Hanya ambil produk yang aktif sebagai pilihan
          setAllProducts(data.filter(p => p.is_active).map(p => ({
            id: p.id,
            name: p.name + (p.description ? ` (${p.description})` : ''),
            priceOffline: p.price,
            priceMerchant: p.price_merchant || p.price,
            costPrice: p.cost_price || 0,
            stock_quantity: p.stock_quantity,
          })))
        }
      })
    }
  }, [isOpen])

  useEffect(() => {
    if (initialData) {
      setName(initialData.name)
      setPriceOffline(initialData.price_offline)
      setPriceMerchant(initialData.price_merchant)
      setRequiredQuantity(initialData.required_quantity)
      setEligibleProductIds(initialData.eligible_product_ids || [])
      setIsActive(initialData.is_active)
    } else {
      setName('')
      setPriceOffline('')
      setPriceMerchant('')
      setRequiredQuantity(2)
      setEligibleProductIds([])
      setIsActive(true)
    }
  }, [initialData, isOpen])

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({
      name,
      price_offline: Number(priceOffline),
      price_merchant: Number(priceMerchant),
      required_quantity: Number(requiredQuantity),
      eligible_product_ids: eligibleProductIds,
      is_active: isActive
    })
  }

  const toggleProduct = (productId: string) => {
    setEligibleProductIds(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white/95 backdrop-blur-sm z-10">
          <h2 className="text-xl font-bold text-slate-800">
            {initialData ? 'Edit Promo' : 'Buat Promo Baru'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Nama Promo</label>
            <input 
              type="text" 
              required 
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Cth: Promo 2 Jar Kecil"
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Harga Offline</label>
              <input 
                type="number" 
                required 
                min="0"
                value={priceOffline}
                onChange={(e) => setPriceOffline(e.target.value ? Number(e.target.value) : '')}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Harga Online (Ojol)</label>
              <input 
                type="number" 
                required 
                min="0"
                value={priceMerchant}
                onChange={(e) => setPriceMerchant(e.target.value ? Number(e.target.value) : '')}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Jumlah Item Harus Dipilih</label>
            <input 
              type="number" 
              required 
              min="1"
              value={requiredQuantity}
              onChange={(e) => setRequiredQuantity(e.target.value ? Number(e.target.value) : '')}
              placeholder="Cth: 2"
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Produk Yang Memenuhi Syarat</label>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 max-h-64 overflow-y-auto space-y-2">
              {allProducts.map(product => (
                <label key={product.id} className="flex items-center gap-3 p-2 hover:bg-slate-100 rounded-md cursor-pointer transition">
                  <input 
                    type="checkbox" 
                    checked={eligibleProductIds.includes(product.id)}
                    onChange={() => toggleProduct(product.id)}
                    className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-slate-700">{product.name}</span>
                </label>
              ))}
              {allProducts.length === 0 && (
                <p className="text-sm text-slate-500 text-center py-4">Memuat produk...</p>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1">Centang produk apa saja yang boleh dipilih oleh kasir dalam promo ini.</p>
          </div>

          <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-100">
            <input 
              type="checkbox" 
              id="isActive"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
            />
            <label htmlFor="isActive" className="text-sm font-semibold text-slate-700 cursor-pointer">Promo Aktif</label>
          </div>

          <div className="pt-4 flex gap-3">
            <button 
              type="button" 
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition"
            >
              Batal
            </button>
            <button 
              type="submit" 
              disabled={eligibleProductIds.length === 0}
              className="flex-1 px-4 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition disabled:opacity-50"
            >
              Simpan Promo
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
