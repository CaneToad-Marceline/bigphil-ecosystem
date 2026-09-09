"use client"

import { useEffect, useState } from 'react'
import { getPromotions, createPromotion, updatePromotion, deletePromotion, Promotion } from '@/lib/supabase/promoActions'
import PromoFormModal from '@/components/dashboard/PromoFormModal'

export default function PromoPage() {
  const [promotions, setPromotions] = useState<Promotion[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingPromo, setEditingPromo] = useState<Promotion | null>(null)

  const loadData = async () => {
    setIsLoading(true)
    const data = await getPromotions()
    setPromotions(data)
    setIsLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleSave = async (promoData: Omit<Promotion, 'id' | 'created_at'>) => {
    try {
      if (editingPromo) {
        await updatePromotion(editingPromo.id, promoData)
      } else {
        await createPromotion(promoData)
      }
      setIsModalOpen(false)
      loadData()
    } catch (error) {
      alert("Gagal menyimpan promo")
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus promo ini?")) {
      try {
        await deletePromotion(id)
        loadData()
      } catch (error) {
        alert("Gagal menghapus promo")
      }
    }
  }

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(num)
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Manajemen Promo</h1>
          <p className="text-slate-500 mt-2">Buat paket promo diskon untuk mempermudah kasir.</p>
        </div>
        <button 
          onClick={() => {
            setEditingPromo(null)
            setIsModalOpen(true)
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold transition flex items-center gap-2 shadow-lg shadow-blue-600/20"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          Buat Promo
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : promotions.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-slate-200 border-dashed">
          <p className="text-slate-500 mb-4">Belum ada promo yang dibuat.</p>
          <button 
            onClick={() => {
              setEditingPromo(null)
              setIsModalOpen(true)
            }}
            className="text-blue-600 font-bold hover:underline"
          >
            Buat Promo Pertama
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {promotions.map((promo) => (
            <div key={promo.id} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-slate-800 leading-tight">{promo.name}</h3>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${promo.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                  {promo.is_active ? 'Aktif' : 'Nonaktif'}
                </span>
              </div>
              
              <div className="space-y-3 mb-6 flex-1">
                <div className="flex justify-between items-center pb-2 border-b border-slate-50">
                  <span className="text-sm text-slate-500">Harga Offline</span>
                  <span className="font-bold text-blue-600">{formatRupiah(promo.price_offline)}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-slate-50">
                  <span className="text-sm text-slate-500">Harga Online (Ojol)</span>
                  <span className="font-bold text-orange-500">{formatRupiah(promo.price_merchant)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-500">Syarat Pilihan</span>
                  <span className="font-semibold text-slate-700">{promo.required_quantity} Item</span>
                </div>
                <div className="pt-2">
                  <p className="text-xs text-slate-400">Berlaku untuk {promo.eligible_product_ids?.length || 0} varian produk terpilih.</p>
                </div>
              </div>

              <div className="flex gap-2 pt-4 border-t border-slate-100">
                <button 
                  onClick={() => {
                    setEditingPromo(promo)
                    setIsModalOpen(true)
                  }}
                  className="flex-1 py-2 text-sm font-bold text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-lg transition"
                >
                  Edit
                </button>
                <button 
                  onClick={() => handleDelete(promo.id)}
                  className="flex-1 py-2 text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition"
                >
                  Hapus
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <PromoFormModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        initialData={editingPromo}
      />
    </div>
  )
}
