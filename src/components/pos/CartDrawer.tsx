"use client"

import { useCartStore } from '@/lib/store/useCartStore'
import { printReceipt } from '@/lib/printer/thermal'

import { submitTransaction } from '@/lib/supabase/transactionActions'

export default function CartDrawer() {
  const { items, updateQuantity, totalPrice, clearCart, orderType } = useCartStore()

  const formatRupiah = (number: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(number)
  }

  const handlePrint = async () => {
    if (items.length === 0) return
    try {
      // 1. Simpan ke database Supabase
      await submitTransaction(items, totalPrice(), 'cash', orderType)
      
      // 2. Cetak struk via Web Bluetooth
      await printReceipt(items, totalPrice(), orderType)
      
      alert("Transaksi & cetak struk berhasil!")
      clearCart()
    } catch (error: any) {
      if (error.message.includes('globally disabled')) {
        alert("Gagal mencetak: Web Bluetooth dinonaktifkan di browser Anda.\n\nJika Anda menggunakan Brave Browser, silakan aktifkan di brave://settings/privacy (cari Web Bluetooth) atau gunakan Google Chrome.")
      } else {
        alert(`Gagal mencetak: ${error.message}\n\nPastikan Anda menggunakan Google Chrome dan Bluetooth PC/HP Anda menyala.`)
      }
    }
  }

  return (
    <div className="flex flex-col h-full bg-white border-l border-slate-200 shadow-xl">
      <div className="p-4 border-b border-slate-200 bg-slate-50">
        <h2 className="text-xl font-bold text-slate-800">Keranjang ({items.length})</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400">
            <span className="text-4xl mb-2">🛒</span>
            <p>Keranjang masih kosong</p>
          </div>
        ) : (
          items.map((item) => {
            const currentPrice = orderType === 'offline' ? item.priceOffline : item.priceMerchant;
            return (
              <div key={item.id} className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border border-slate-100">
                <div className="flex-1 pr-2">
                  <h4 className="font-medium text-slate-800">{item.name}</h4>
                  <p className="text-sm text-blue-600 font-semibold">{formatRupiah(currentPrice)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    className="w-8 h-8 flex items-center justify-center bg-white border border-slate-200 rounded-md text-slate-600 active:bg-slate-100 font-bold"
                  >
                    -
                  </button>
                  <span className="font-semibold w-4 text-center">{item.quantity}</span>
                  <button 
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="w-8 h-8 flex items-center justify-center bg-white border border-slate-200 rounded-md text-slate-600 active:bg-slate-100 font-bold"
                  >
                    +
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>

      <div className="p-4 border-t border-slate-200 bg-slate-50">
        <div className="flex justify-between items-center mb-4">
          <span className="text-slate-500 font-medium">Total</span>
          <span className="text-2xl font-bold text-slate-800">{formatRupiah(totalPrice())}</span>
        </div>
        <button 
          onClick={handlePrint}
          disabled={items.length === 0}
          className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl active:scale-[0.98] transition-transform disabled:opacity-50 disabled:active:scale-100"
        >
          Proses Pembayaran & Cetak
        </button>
      </div>
    </div>
  )
}
