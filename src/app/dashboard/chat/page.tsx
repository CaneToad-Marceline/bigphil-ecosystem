"use client"

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'

interface ChatLog {
  id: string
  phone_number: string
  message: string
  is_bot_response: boolean
  created_at: string
}

export default function ChatLogsPage() {
  const [logs, setLogs] = useState<ChatLog[]>([])

  const fetchLogs = async () => {
    const { data, error } = await supabase
      .from('chat_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100)
      
    if (!error && data) {
      setLogs(data)
    }
  }

  useEffect(() => {
    // 1. Fetch data awal dari Supabase
    fetchLogs()

    // 2. Berlangganan (Subscribe) ke perubahan realtime di tabel chat_logs
    const channel = supabase.channel('chat-logs-channel')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_logs' },
        (payload) => {
          console.log('Log chat baru diterima realtime:', payload)
          setLogs((prev) => [payload.new as ChatLog, ...prev])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const formatWaktu = (isoString: string) => {
    return new Date(isoString).toLocaleString('id-ID', {
      dateStyle: 'medium',
      timeStyle: 'short'
    })
  }

  return (
    <div className="p-6 md:p-10">
      <h2 className="text-3xl font-bold text-slate-800 mb-8">Log AI Chat (WhatsApp)</h2>
      
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-sm">
                <th className="p-4 font-semibold whitespace-nowrap w-48">WAKTU</th>
                <th className="p-4 font-semibold whitespace-nowrap w-48">NOMOR PENGIRIM</th>
                <th className="p-4 font-semibold whitespace-nowrap w-32">PENGIRIM</th>
                <th className="p-4 font-semibold">PESAN</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-slate-500">
                    Belum ada log chat WhatsApp.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                    <td className="p-4 text-sm text-slate-600 whitespace-nowrap align-top">
                      {formatWaktu(log.created_at)}
                    </td>
                    <td className="p-4 text-sm font-mono text-slate-700 font-medium align-top">
                      {log.phone_number}
                    </td>
                    <td className="p-4 align-top">
                      {log.is_bot_response ? (
                        <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold flex items-center w-max gap-1">
                          🤖 AI
                        </span>
                      ) : (
                        <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold flex items-center w-max gap-1">
                          👤 Customer
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-sm text-slate-800 align-top">
                      {/* Menggunakan pre-wrap agar baris baru dari WA terbaca */}
                      <div className="whitespace-pre-wrap">{log.message}</div>
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
