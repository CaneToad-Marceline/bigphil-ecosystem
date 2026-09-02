"use client"

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import StatCard from '@/components/dashboard/StatCard'
import HeroSkuChart from '@/components/dashboard/HeroSkuChart'
import { getSummaryMetrics, getHeroSKU, TimeFilter, SummaryMetrics, HeroSKU } from '@/lib/supabase/analytics'
import { cancelTransaction } from '@/lib/supabase/transactionActions'

interface Transaction {
  id: string
  total_amount: number
  payment_method: string
  status: string
  created_at: string
}

export default function DashboardPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [filter, setFilter] = useState<TimeFilter>('daily')
  const [metrics, setMetrics] = useState<SummaryMetrics>({ totalRevenue: 0, totalTransactions: 0 })
  const [heroSKUs, setHeroSKUs] = useState<HeroSKU[]>([])
  const [isLoading, setIsLoading] = useState(true)

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
    setIsLoading(true)
    const [summary, heroes] = await Promise.all([
      getSummaryMetrics(filter),
      getHeroSKU(filter, 12) // Mengambil hingga 12 varian (6 rasa x 2 ukuran)
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
  }, [filter])

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
  }, [filter]) // Tambahkan filter ke dependensi agar loadAnalytics menggunakan filter terbaru

  const handleCancel = async (txId: string) => {
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
        
        <select 
          value={filter}
          onChange={(e) => setFilter(e.target.value as TimeFilter)}
          className="bg-white border border-slate-300 text-slate-800 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 font-medium shadow-sm cursor-pointer"
        >
          <option value="daily">Hari Ini</option>
          <option value="weekly">Minggu Ini</option>
          <option value="monthly">Bulan Ini</option>
        </select>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <StatCard 
          title="Total Pendapatan" 
          value={isLoading ? '...' : formatRupiah(metrics.totalRevenue)}
          subtitle={`Periode: ${filter === 'daily' ? 'Hari Ini' : filter === 'weekly' ? 'Minggu Ini' : 'Bulan Ini'}`}
          colorClass="bg-blue-50 border-blue-100"
          icon={<span className="text-xl">💰</span>}
        />
        <StatCard 
          title="Jumlah Transaksi" 
          value={isLoading ? '...' : metrics.totalTransactions}
          subtitle={`Periode: ${filter === 'daily' ? 'Hari Ini' : filter === 'weekly' ? 'Minggu Ini' : 'Bulan Ini'}`}
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
                      <tr key={tx.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
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
                              onClick={() => handleCancel(tx.id)}
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
    </div>
  )
}
