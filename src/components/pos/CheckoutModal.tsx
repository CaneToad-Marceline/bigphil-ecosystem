"use client"

import { useState } from 'react'

interface CheckoutModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (shippingFee: number, addonFee: number, paymentMethod: string) => void
  itemsTotal: number
}

export default function CheckoutModal({ isOpen, onClose, onConfirm, itemsTotal }: CheckoutModalProps) {
  const [shippingFee, setShippingFee] = useState<number | ''>('')
  const [addonFee, setAddonFee] = useState<number | ''>('')
  const [paymentMethod, setPaymentMethod] = useState<string>('cash')

  if (!isOpen) return null

  const parsedShipping = Number(shippingFee) || 0
  const parsedAddon = Number(addonFee) || 0
  const finalTotal = itemsTotal + parsedShipping + parsedAddon

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(num)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onConfirm(parsedShipping, parsedAddon, paymentMethod)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-800">Konfirmasi Pembayaran</h2>
          <button onClick={onClose} className="p-2 bg-slate-200 hover:bg-slate-300 rounded-full transition text-slate-500 hover:text-slate-700">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
            <div className="flex justify-between items-center text-slate-600 mb-1">
              <span className="font-medium">Total Item</span>
              <span className="font-bold">{formatRupiah(itemsTotal)}</span>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Ongkos Kirim</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">Rp</span>
                <input 
                  type="number" 
                  min="0"
                  value={shippingFee}
                  onChange={(e) => setShippingFee(e.target.value ? Number(e.target.value) : '')}
                  placeholder="0"
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none font-semibold text-slate-800"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Biaya Tambahan (Add-on)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">Rp</span>
                <input 
                  type="number" 
                  min="0"
                  value={addonFee}
                  onChange={(e) => setAddonFee(e.target.value ? Number(e.target.value) : '')}
                  placeholder="0"
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none font-semibold text-slate-800"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Metode Pembayaran</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('cash')}
                  className={`py-3 rounded-xl font-bold border transition ${paymentMethod === 'cash' ? 'bg-blue-50 border-blue-600 text-blue-700' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                >
                  Tunai
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('qris')}
                  className={`py-3 rounded-xl font-bold border transition ${paymentMethod === 'qris' ? 'bg-blue-50 border-blue-600 text-blue-700' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                >
                  QRIS
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('transfer')}
                  className={`py-3 rounded-xl font-bold border transition ${paymentMethod === 'transfer' ? 'bg-blue-50 border-blue-600 text-blue-700' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                >
                  Transfer
                </button>
              </div>
            </div>
          </div>
          
          <div className="pt-4 mt-4 border-t border-slate-200 border-dashed">
            <div className="flex justify-between items-center mb-6">
              <span className="text-slate-600 font-bold">TOTAL AKHIR</span>
              <span className="text-3xl font-black text-blue-600">{formatRupiah(finalTotal)}</span>
            </div>
            <button 
              type="submit"
              className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl active:scale-[0.98] transition-transform shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 text-lg"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Konfirmasi & Cetak
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
