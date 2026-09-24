"use client"

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import React, { useState } from 'react'
import { supabase } from '@/lib/supabase/client'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const navLinks = [
    { name: 'Ringkasan Penjualan', path: '/dashboard' },
    { name: 'Katalog Produk', path: '/dashboard/katalog' },
    { name: 'Manajemen Promo', path: '/dashboard/promo' },
  ]

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      
      {/* Mobile Header (Hanya tampil di layar kecil) */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-40 bg-slate-900 shadow-md flex justify-between items-center px-4 py-3">
        <h1 className="text-xl font-black text-white tracking-tight">
          Bigphil <span className="text-blue-500">Admin</span>
        </h1>
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="text-slate-300 hover:text-white p-2 rounded-md focus:outline-none"
        >
          {isMobileMenuOpen ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </header>

      {/* Overlay untuk mobile saat menu terbuka */}
      {isMobileMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar - Desktop (Tetap) & Mobile (Slide-in) */}
      <aside 
        className={`fixed md:static inset-y-0 left-0 z-50 w-64 bg-slate-900 text-slate-300 flex flex-col h-screen shadow-xl transition-transform duration-300 ease-in-out ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="p-6 border-b border-slate-800 hidden md:block">
          <h1 className="text-2xl font-black text-white tracking-tight">
            Bigphil <span className="text-blue-500">Admin</span>
          </h1>
        </div>
        
        {/* Tambahan header sidebar khusus mobile untuk menutup menu */}
        <div className="p-4 border-b border-slate-800 flex justify-between items-center md:hidden">
          <h1 className="text-xl font-black text-white tracking-tight">Menu</h1>
          <button 
            onClick={() => setIsMobileMenuOpen(false)}
            className="text-slate-400 hover:text-white"
          >
            ✕
          </button>
        </div>
        
        <nav className="flex-1 py-6 overflow-y-auto">
          <ul className="space-y-2 px-4">
            {navLinks.map((link) => (
              <li key={link.path}>
                <Link 
                  href={link.path} 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`block px-4 py-3 rounded-lg font-medium transition ${pathname === link.path ? 'bg-blue-600 text-white shadow-md' : 'hover:bg-slate-800 text-slate-300'}`}
                >
                  {link.name}
                </Link>
              </li>
            ))}
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
      <main className="flex-1 overflow-y-auto w-full pt-[60px] md:pt-0">
        {children}
      </main>
    </div>
  )
}
