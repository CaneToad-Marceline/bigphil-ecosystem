"use client"

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'

interface Transaction {
  id: string
  total_amount: number
  payment_method: string
  status: string
  created_at: string
}

export default function DashboardPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])

  const fetchTransactions = async () => {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)
      
    if (!error && data) {
      setTransactions(data)
    }
  }

  useEffect(() => {
    // 1. Fetch data awal dari Supabase
    fetchTransactions()

    // 2. Berlangganan (Subscribe) ke perubahan realtime di tabel transactions
    const channel = supabase.channel('custom-insert-channel')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'transactions' },
        (payload) => {
          console.log('Transaksi baru diterima realtime:', payload)
          // Tambahkan data baru ke baris paling atas dari state
          setTransactions((prev) => [payload.new as Transaction, ...prev])
        }
      )
      .subscribe()

    // Cleanup subscription saat komponen di-unmount
    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

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
    <div className="p-6 md:p-10">
      <h2 className="text-3xl font-bold text-slate-800 mb-8">Ringkasan Penjualan</h2>
      
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-sm">
                <th className="p-4 font-semibold whitespace-nowrap">WAKTU</th>
                <th className="p-4 font-semibold whitespace-nowrap">ID TRANSAKSI</th>
                <th className="p-4 font-semibold whitespace-nowrap">METODE</th>
                <th className="p-4 font-semibold whitespace-nowrap">STATUS</th>
                <th className="p-4 font-semibold whitespace-nowrap text-right">TOTAL</th>
              </tr>
            </thead>
            <tbody>
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">
                    Belum ada transaksi. Coba lakukan checkout dari aplikasi POS.
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => (
                  <tr key={tx.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                    <td className="p-4 text-sm text-slate-600 whitespace-nowrap">
                      {formatWaktu(tx.created_at)}
                    </td>
                    <td className="p-4 text-xs font-mono text-slate-400">
                      {tx.id.split('-')[0]}...
                    </td>
                    <td className="p-4 text-sm uppercase font-bold text-slate-700">
                      {tx.payment_method}
                    </td>
                    <td className="p-4">
                      <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold">
                        {tx.status}
                      </span>
                    </td>
                    <td className="p-4 text-right font-bold text-slate-800 text-lg">
                      {formatRupiah(tx.total_amount)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
