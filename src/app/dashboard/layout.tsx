import Link from 'next/link'
import React from 'react'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
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
              <Link href="/dashboard" className="block px-4 py-3 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition">
                Ringkasan Penjualan
              </Link>
            </li>
            <li>
              <Link href="#" className="block px-4 py-3 rounded-lg hover:bg-slate-800 transition font-medium">
                Katalog Produk
              </Link>
            </li>
            <li>
              <Link href="#" className="block px-4 py-3 rounded-lg hover:bg-slate-800 transition font-medium">
                Log AI Chat
              </Link>
            </li>
          </ul>
        </nav>
        
        <div className="p-6 border-t border-slate-800">
          <Link href="/" className="block w-full text-center px-4 py-3 border border-slate-700 rounded-lg hover:bg-slate-800 hover:text-white transition font-medium">
            Kembali ke Kasir
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
