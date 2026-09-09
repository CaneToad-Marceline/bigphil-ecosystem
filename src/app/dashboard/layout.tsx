"use client"

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import React from 'react'
import { supabase } from '@/lib/supabase/client'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const handleComingSoon = (e: React.MouseEvent) => {
    e.preventDefault()
    alert("Fitur ini akan dibangun di fase selanjutnya!")
  }

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sticky Sidebar */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex-col hidden md:flex sticky top-0 h-screen shadow-xl">
        <div className="p-6 border-b border-slate-800">
          <h1 className="text-2xl font-black text-white tracking-tight">
            Bigphil <span className="text-blue-500">Admin</span>
          </h1>
        </div>
        
        <nav className="flex-1 py-6 overflow-y-auto">
          <ul className="space-y-2 px-4">
            <li>
              <Link href="/dashboard" className={`block px-4 py-3 rounded-lg font-medium transition ${pathname === '/dashboard' ? 'bg-blue-600 text-white' : 'hover:bg-slate-800 text-slate-300'}`}>
                Ringkasan Penjualan
              </Link>
            </li>
            <li>
              <Link href="/dashboard/katalog" className={`block px-4 py-3 rounded-lg font-medium transition ${pathname === '/dashboard/katalog' ? 'bg-blue-600 text-white' : 'hover:bg-slate-800 text-slate-300'}`}>
                Katalog Produk
              </Link>
            </li>
            <li>
              <Link href="/dashboard/chat" className={`block px-4 py-3 rounded-lg font-medium transition ${pathname === '/dashboard/chat' ? 'bg-blue-600 text-white' : 'hover:bg-slate-800 text-slate-300'}`}>
                Log AI Chat
              </Link>
            </li>
            <li>
              <Link href="/dashboard/promo" className={`block px-4 py-3 rounded-lg font-medium transition ${pathname === '/dashboard/promo' ? 'bg-blue-600 text-white' : 'hover:bg-slate-800 text-slate-300'}`}>
                Manajemen Promo
              </Link>
            </li>
          </ul>
        </nav>
        
        <div className="p-6 border-t border-slate-800 space-y-3">
          <Link href="/" className="block w-full text-center px-4 py-3 border border-slate-700 rounded-lg hover:bg-slate-800 hover:text-white transition font-medium">
            Kembali ke Kasir
          </Link>
          <button onClick={handleSignOut} className="w-full text-center px-4 py-3 border border-red-900/50 text-red-400 rounded-lg hover:bg-red-900/30 hover:text-red-300 transition font-medium">
            Keluar (Sign Out)
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
