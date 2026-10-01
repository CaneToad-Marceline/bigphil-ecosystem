"use client"

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { format } from 'date-fns'

interface Transaction {
  id: string
  created_at: string
  status: string
  total_amount: number
  payment_method: string
  order_type: string
  shipping_fee?: number
  addon_fee?: number
}

interface TransactionItem {
  id: string
  quantity: number
  price_at_time: number
  products?: { name: string }
  promotions?: { name: string }
  promo_id: string | null
  product_id: string | null
}

export default function RiwayatTransaksiPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [startDate, setStartDate] = useState<string>(
    format(new Date(), 'yyyy-MM-dd')
  )
  const [endDate, setEndDate] = useState<string>(
    format(new Date(), 'yyyy-MM-dd')
  )

  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null)
  const [txItems, setTxItems] = useState<TransactionItem[]>([])
  const [isModalLoading, setIsModalLoading] = useState(false)

  const loadTransactions = async () => {
    setIsLoading(true)
    try {
      let query = supabase
        .from('transactions')
        .select('*')
        .gte('created_at', `${startDate}T00:00:00`)
        .lte('created_at', `${endDate}T23:59:59`)
        .order('created_at', { ascending: false })
      
      const { data, error } = await query
      if (error) throw error
      setTransactions(data || [])
    } catch (err) {
      console.error('Failed to load transactions', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadTransactions()
  }, [])

  const handleSearch = () => {
    loadTransactions()
  }

  const openTxDetails = async (tx: Transaction) => {
    setSelectedTx(tx)
    setIsModalLoading(true)
    try {
      const { data, error } = await supabase
        .from('transaction_items')
        .select(`
          id, quantity, price_at_time, promo_id, product_id,
          products ( name ), promotions ( name )
        `)
        .eq('transaction_id', tx.id)
      
      if (error) throw error
      setTxItems((data as any) || [])
    } catch (err) {
      console.error('Failed to load tx items', err)
    } finally {
      setIsModalLoading(false)
    }
  }

  const closeDetails = () => {
    setSelectedTx(null)
    setTxItems([])
  }

  const formatRupiah = (val: number) => 
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val)

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Riwayat Transaksi</h2>
          <p className="text-slate-500">Melihat detail transaksi yang telah dilakukan</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 items-end">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Mulai Tanggal</label>
            <input 
              type="date" 
              className="border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Sampai Tanggal</label>
            <input 
              type="date" 
              className="border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
            />
          </div>
          <button 
            onClick={handleSearch}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition whitespace-nowrap"
          >
            Cari
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-sm font-medium text-slate-600">
                <th className="p-4">Waktu</th>
                <th className="p-4">ID Transaksi</th>
                <th className="p-4">Tipe & Metode</th>
                <th className="p-4">Total</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {isLoading ? (
                <tr><td colSpan={6} className="p-8 text-center text-slate-500">Memuat data...</td></tr>
              ) : transactions.length === 0 ? (
                <tr><td colSpan={6} className="p-8 text-center text-slate-500">Tidak ada transaksi di rentang tanggal ini.</td></tr>
              ) : (
                transactions.map((tx) => (
                  <tr key={tx.id} className="border-b border-slate-100 hover:bg-slate-50 transition cursor-pointer" onClick={() => openTxDetails(tx)}>
                    <td className="p-4 whitespace-nowrap">{format(new Date(tx.created_at), 'dd/MM/yyyy HH:mm')}</td>
                    <td className="p-4 font-mono text-xs">{tx.id.substring(0,8)}...</td>
                    <td className="p-4">
                      <div className="font-medium text-slate-800">{tx.order_type || '-'}</div>
                      <div className="text-xs text-slate-500">{tx.payment_method}</div>
                    </td>
                    <td className="p-4 font-medium text-slate-800">{formatRupiah(tx.total_amount)}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        tx.status === 'completed' ? 'bg-green-100 text-green-700' :
                        tx.status === 'pending' ? 'bg-orange-100 text-orange-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {tx.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">Detail</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Detail */}
      {selectedTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm" onClick={closeDetails}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <div className="p-4 md:p-6 border-b border-slate-100 flex justify-between items-start">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Detail Transaksi</h3>
                <p className="text-sm font-mono text-slate-500 mt-1">ID: {selectedTx.id}</p>
                <div className="mt-2 text-sm text-slate-600">
                  {format(new Date(selectedTx.created_at), 'dd MMMM yyyy HH:mm')} • {selectedTx.order_type || '-'} • {selectedTx.payment_method}
                </div>
              </div>
              <button onClick={closeDetails} className="text-slate-400 hover:text-slate-600 p-2 text-xl leading-none">✕</button>
            </div>
            
            <div className="p-4 md:p-6 overflow-y-auto flex-1 bg-slate-50">
              {isModalLoading ? (
                <div className="text-center py-8 text-slate-500">Memuat detail item...</div>
              ) : (
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm text-slate-700 mb-2">Item Pembelian</h4>
                  {txItems.map(item => {
                    let itemName = 'Unknown'
                    if (item.product_id && item.promo_id) itemName = `  - ${item.products?.name} (Isi Paket)`
                    else if (item.promo_id && !item.product_id) itemName = `[Promo] ${item.promotions?.name}`
                    else if (item.product_id) itemName = item.products?.name || itemName

                    return (
                      <div key={item.id} className="bg-white p-3 rounded-lg border border-slate-200 flex justify-between items-center shadow-sm">
                        <div>
                          <div className="font-medium text-slate-800">{itemName}</div>
                          <div className="text-sm text-slate-500">
                            {item.quantity} x {formatRupiah(item.price_at_time)}
                          </div>
                        </div>
                        <div className="font-semibold text-slate-800">
                          {formatRupiah(item.quantity * item.price_at_time)}
                        </div>
                      </div>
                    )
                  })}
                  
                  <div className="pt-4 mt-4 border-t border-slate-200 space-y-2">
                    {selectedTx.shipping_fee ? (
                      <div className="flex justify-between items-center text-sm text-slate-600">
                        <span>Ongkos Kirim</span>
                        <span>{formatRupiah(selectedTx.shipping_fee)}</span>
                      </div>
                    ) : null}
                    {selectedTx.addon_fee ? (
                      <div className="flex justify-between items-center text-sm text-slate-600">
                        <span>Biaya Tambahan</span>
                        <span>{formatRupiah(selectedTx.addon_fee)}</span>
                      </div>
                    ) : null}
                    <div className="flex justify-between items-center text-lg font-bold text-slate-800 pt-2 border-t border-slate-200 border-dashed">
                      <span>Total Keseluruhan</span>
                      <span>{formatRupiah(selectedTx.total_amount)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="p-4 border-t border-slate-100 flex justify-end">
              <button 
                onClick={closeDetails}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
