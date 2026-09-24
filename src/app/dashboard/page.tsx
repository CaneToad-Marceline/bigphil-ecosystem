"use client"

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import StatCard from '@/components/dashboard/StatCard'
import HeroSkuChart from '@/components/dashboard/HeroSkuChart'
import { getSummaryMetrics, getHeroSKU, TimeFilter, SummaryMetrics, HeroSKU } from '@/lib/supabase/analytics'
import { cancelTransaction, getTransactionDetails } from '@/lib/supabase/transactionActions'

interface Transaction {
  id: string
  total_amount: number
  shipping_fee?: number
  addon_fee?: number
  payment_method: string
  order_type?: string
  status: string
  created_at: string
}

interface TransactionItem {
  id: string
  quantity: number
  price_at_time: number
  product_id?: string
  promo_id?: string
  products?: { name: string; description: string }
  promotions?: { name: string }
}

export default function DashboardPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [filter, setFilter] = useState<TimeFilter>('daily')
  const [customDate, setCustomDate] = useState({ start: '', end: '' })
  const [metrics, setMetrics] = useState<SummaryMetrics>({ totalRevenue: 0, totalTransactions: 0, netProfit: 0 })
  const [heroSKUs, setHeroSKUs] = useState<HeroSKU[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedTxDetails, setSelectedTxDetails] = useState<{ transaction: Transaction; items: TransactionItem[] } | null>(null)
  const [isLoadingDetails, setIsLoadingDetails] = useState(false)

  const fetchTransactions = async () => {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20) // Kurangi limit untuk performa karena ada tabel lain
      
    if (!error && data) {
      setTransactions(data)
    }
  }

  const loadAnalytics = async () => {
    if (filter === 'custom' && (!customDate.start || !customDate.end)) {
      return // Jangan load jika custom date belum dipilih keduanya
    }
    
    setIsLoading(true)
    let range = undefined
    if (filter === 'custom') {
      range = { start: new Date(customDate.start), end: new Date(customDate.end) }
    }

    const [summary, heroes] = await Promise.all([
      getSummaryMetrics(filter, range),
      getHeroSKU(filter, 12, range) // Mengambil hingga 12 varian (6 rasa x 2 ukuran)
    ])
    setMetrics(summary)
    setHeroSKUs(heroes)
    setIsLoading(false)
  }

  useEffect(() => {
    fetchTransactions()
  }, [])

  useEffect(() => {
    loadAnalytics()
  }, [filter, customDate.start, customDate.end])

  useEffect(() => {
    // Berlangganan ke perubahan realtime di tabel transactions
    const channel = supabase.channel('custom-insert-channel')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'transactions' },
        (payload) => {
          console.log('Transaksi baru diterima realtime:', payload)
          setTransactions((prev) => [payload.new as Transaction, ...prev].slice(0, 20))
          
          // Refresh analytics saat ada transaksi baru yang completed
          if (payload.new.status === 'completed') {
            loadAnalytics()
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'transactions' },
        (payload) => {
          console.log('Transaksi diupdate realtime:', payload)
          // Update status transaksi di state tabel
          setTransactions((prev) => 
            prev.map(tx => tx.id === payload.new.id ? payload.new as Transaction : tx)
          )
          loadAnalytics()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [filter, customDate.start, customDate.end])

  const handleCancel = async (e: React.MouseEvent, txId: string) => {
    e.stopPropagation() // Prevent row click
    if (window.confirm('Apakah Anda yakin ingin membatalkan transaksi ini? Stok barang akan dikembalikan ke database.')) {
      try {
        await cancelTransaction(txId)
        alert('Transaksi berhasil dibatalkan.')
        // Pembaruan data tabel dan chart akan ditangani oleh event listener UPDATE Realtime di atas.
      } catch (error) {
        console.error(error)
        alert('Terjadi kesalahan saat membatalkan transaksi. Silakan periksa koneksi atau log konsol.')
      }
    }
  }

  const handleRowClick = async (txId: string) => {
    setIsModalOpen(true)
    setIsLoadingDetails(true)
    setSelectedTxDetails(null)
    try {
      const details = await getTransactionDetails(txId)
      setSelectedTxDetails({ transaction: details, items: details.items })
    } catch (error) {
      console.error("Gagal mengambil detail transaksi:", error)
      alert("Gagal memuat detail transaksi.")
      setIsModalOpen(false)
    } finally {
      setIsLoadingDetails(false)
    }
  }

  const formatRupiah = (number: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(number)
  }

  const formatWaktu = (isoString: string) => {
    return new Date(isoString).toLocaleString('id-ID', {
      dateStyle: 'medium',
      timeStyle: 'short'
    })
  }

  return (
    <div className="p-6 md:p-10 space-y-8">
      {/* Header & Filter */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-3xl font-bold text-slate-800">Ringkasan Penjualan</h2>
        
        <div className="flex flex-wrap items-center gap-3">
          {filter === 'custom' && (
            <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-4 duration-300">
              <input 
                type="date" 
                value={customDate.start} 
                onChange={e => setCustomDate({...customDate, start: e.target.value})}
                className="bg-white border border-slate-300 text-slate-800 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2 font-medium shadow-sm"
              />
              <span className="text-slate-500 font-medium">s/d</span>
              <input 
                type="date" 
                value={customDate.end} 
                onChange={e => setCustomDate({...customDate, end: e.target.value})}
                className="bg-white border border-slate-300 text-slate-800 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2 font-medium shadow-sm"
              />
            </div>
          )}
          <select 
            value={filter}
            onChange={(e) => setFilter(e.target.value as TimeFilter)}
            className="bg-white border border-slate-300 text-slate-800 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 font-medium shadow-sm cursor-pointer"
          >
            <option value="daily">Hari Ini</option>
            <option value="weekly">Minggu Ini</option>
            <option value="monthly">Bulan Ini</option>
            <option value="custom">Kustom</option>
          </select>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          title="Total Pendapatan" 
          value={isLoading ? '...' : formatRupiah(metrics.totalRevenue)}
          subtitle={`Periode: ${filter === 'daily' ? 'Hari Ini' : filter === 'weekly' ? 'Minggu Ini' : filter === 'monthly' ? 'Bulan Ini' : `${customDate.start || '?'} s/d ${customDate.end || '?'}`}`}
          colorClass="bg-blue-50 border-blue-100"
          icon={<span className="text-xl">💰</span>}
        />
        <StatCard 
          title="Pemasukan Bersih (Laba)" 
          value={isLoading ? '...' : formatRupiah(metrics.netProfit)}
          subtitle={`Periode: ${filter === 'daily' ? 'Hari Ini' : filter === 'weekly' ? 'Minggu Ini' : filter === 'monthly' ? 'Bulan Ini' : `${customDate.start || '?'} s/d ${customDate.end || '?'}`}`}
          colorClass="bg-purple-50 border-purple-100"
          icon={<span className="text-xl">📈</span>}
        />
        <StatCard 
          title="Jumlah Transaksi" 
          value={isLoading ? '...' : metrics.totalTransactions}
          subtitle={`Periode: ${filter === 'daily' ? 'Hari Ini' : filter === 'weekly' ? 'Minggu Ini' : filter === 'monthly' ? 'Bulan Ini' : `${customDate.start || '?'} s/d ${customDate.end || '?'}`}`}
          colorClass="bg-emerald-50 border-emerald-100"
          icon={<span className="text-xl">🧾</span>}
        />
      </div>

      {/* Grafik Hero SKU */}
      <div>
        <h3 className="text-xl font-bold text-slate-800 mb-4">📈 Grafik Hero SKU (Unit Terjual)</h3>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          {isLoading ? (
            <div className="h-[400px] flex items-center justify-center text-slate-500">Memuat grafik...</div>
          ) : heroSKUs.length === 0 ? (
            <div className="h-[400px] flex items-center justify-center text-slate-500">Belum ada data penjualan pada periode ini.</div>
          ) : (
            <HeroSkuChart data={heroSKUs} />
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Leaderboard Hero SKU */}
        <div>
          <h3 className="text-xl font-bold text-slate-800 mb-4">🏆 Leaderboard Produk (Hero SKU)</h3>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-amber-50 border-b border-amber-200 text-amber-800 text-sm">
                    <th className="p-4 font-semibold whitespace-nowrap">PRODUK</th>
                    <th className="p-4 font-semibold whitespace-nowrap">UKURAN</th>
                    <th className="p-4 font-semibold whitespace-nowrap text-center">TERJUAL</th>
                    <th className="p-4 font-semibold whitespace-nowrap text-right">PENDAPATAN</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr><td colSpan={4} className="p-8 text-center text-slate-500">Memuat data...</td></tr>
                  ) : heroSKUs.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-slate-500">
                        Belum ada data penjualan pada periode ini.
                      </td>
                    </tr>
                  ) : (
                    heroSKUs.map((sku, index) => (
                      <tr key={sku.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                        <td className="p-4 font-medium text-slate-700 flex items-center gap-2">
                          {index === 0 && <span title="Top 1">🥇</span>}
                          {index === 1 && <span title="Top 2">🥈</span>}
                          {index === 2 && <span title="Top 3">🥉</span>}
                          {sku.name}
                        </td>
                        <td className="p-4 text-sm text-slate-600">
                          <span className="bg-slate-100 px-2 py-1 rounded text-xs font-semibold">{sku.size}</span>
                        </td>
                        <td className="p-4 text-center font-bold text-blue-600 text-lg">
                          {sku.unitsSold}
                        </td>
                        <td className="p-4 text-right font-bold text-emerald-600">
                          {formatRupiah(sku.totalRevenue)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Riwayat Transaksi */}
        <div>
          <h3 className="text-xl font-bold text-slate-800 mb-4">Riwayat Transaksi Terbaru</h3>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-sm">
                    <th className="p-4 font-semibold whitespace-nowrap">WAKTU</th>
                    <th className="p-4 font-semibold whitespace-nowrap">STATUS</th>
                    <th className="p-4 font-semibold whitespace-nowrap text-right">TOTAL</th>
                    <th className="p-4 font-semibold whitespace-nowrap text-center">AKSI</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-slate-500">
                        Belum ada transaksi.
                      </td>
                    </tr>
                  ) : (
                    transactions.map((tx) => (
                      <tr 
                        key={tx.id} 
                        onClick={() => handleRowClick(tx.id)}
                        className="border-b border-slate-100 hover:bg-blue-50 transition cursor-pointer"
                      >
                        <td className="p-4 text-sm text-slate-600 whitespace-nowrap">
                          {formatWaktu(tx.created_at)}
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded text-xs font-bold ${tx.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {tx.status}
                          </span>
                        </td>
                        <td className="p-4 text-right font-bold text-slate-800">
                          {formatRupiah(tx.total_amount)}
                        </td>
                        <td className="p-4 text-center">
                          {tx.status === 'completed' ? (
                            <button 
                              onClick={(e) => handleCancel(e, tx.id)}
                              className="text-xs font-semibold text-white bg-red-500 hover:bg-red-600 px-3 py-1.5 rounded transition active:scale-95"
                            >
                              Batalkan
                            </button>
                          ) : (
                            <span className="text-xs font-semibold text-slate-400">-</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Detail Transaksi */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setIsModalOpen(false)}>
          <div 
            className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-lg font-bold text-slate-800">Detail Transaksi</h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 hover:bg-slate-200 p-2 rounded-full transition"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 max-h-[70vh] overflow-y-auto">
              {isLoadingDetails ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                  <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                  Memuat detail...
                </div>
              ) : selectedTxDetails ? (
                <div className="space-y-6">
                  {/* Info Transaksi */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl">
                    <div>
                      <p className="text-xs text-slate-500 font-medium mb-1">Tanggal & Waktu</p>
                      <p className="text-sm font-semibold text-slate-800">{formatWaktu(selectedTxDetails.transaction.created_at)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 font-medium mb-1">Tipe Order</p>
                      <p className="text-sm font-semibold text-slate-800 capitalize">{selectedTxDetails.transaction.order_type || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 font-medium mb-1">Pembayaran</p>
                      <p className="text-sm font-semibold text-slate-800 uppercase">{selectedTxDetails.transaction.payment_method}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 font-medium mb-1">Status</p>
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${selectedTxDetails.transaction.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {selectedTxDetails.transaction.status}
                      </span>
                    </div>
                  </div>

                  {/* Daftar Item */}
                  <div>
                    <h4 className="text-sm font-bold text-slate-800 mb-3 border-b pb-2">Item Pembelian</h4>
                    <div className="space-y-3">
                      {selectedTxDetails.items.map((item, idx) => (
                        <div key={item.id} className="flex justify-between items-center bg-white border border-slate-100 p-3 rounded-lg shadow-sm">
                          <div>
                            <p className="font-semibold text-slate-800 text-sm">
                              {item.product_id ? item.products?.name : item.promotions?.name}
                            </p>
                            {item.product_id && item.products?.description && (
                              <p className="text-xs text-slate-500">{item.products.description}</p>
                            )}
                            <p className="text-xs font-medium text-blue-600 mt-1">
                              {item.quantity} x {formatRupiah(item.price_at_time)}
                            </p>
                          </div>
                          <p className="font-bold text-slate-800">
                            {formatRupiah(item.quantity * item.price_at_time)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Ringkasan Biaya */}
                  <div className="border-t pt-4 space-y-2">
                    <div className="flex justify-between text-sm text-slate-600">
                      <span>Subtotal Item</span>
                      <span>
                        {formatRupiah(
                          selectedTxDetails.items.reduce((acc, curr) => acc + (curr.quantity * curr.price_at_time), 0)
                        )}
                      </span>
                    </div>
                    {(selectedTxDetails.transaction.shipping_fee || 0) > 0 && (
                      <div className="flex justify-between text-sm text-slate-600">
                        <span>Ongkos Kirim</span>
                        <span>{formatRupiah(selectedTxDetails.transaction.shipping_fee || 0)}</span>
                      </div>
                    )}
                    {(selectedTxDetails.transaction.addon_fee || 0) > 0 && (
                      <div className="flex justify-between text-sm text-slate-600">
                        <span>Biaya Tambahan</span>
                        <span>{formatRupiah(selectedTxDetails.transaction.addon_fee || 0)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-lg font-bold text-slate-900 pt-2 border-t">
                      <span>Total Keseluruhan</span>
                      <span>{formatRupiah(selectedTxDetails.transaction.total_amount)}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center text-red-500">
                  Data tidak ditemukan.
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-between items-center">
              {selectedTxDetails && selectedTxDetails.transaction.status === 'completed' ? (
                <button 
                  onClick={(e) => {
                    handleCancel(e, selectedTxDetails.transaction.id)
                    setIsModalOpen(false)
                  }}
                  className="px-4 py-2 bg-red-100 text-red-700 font-semibold rounded-lg hover:bg-red-200 transition text-sm flex items-center gap-2"
                >
                  <span className="text-lg">⚠</span> Batalkan Transaksi
                </button>
              ) : (
                <div></div> // empty div to keep spacing if button is absent
              )}
              <button 
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 bg-slate-800 text-white font-semibold rounded-lg hover:bg-slate-900 transition text-sm"
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
