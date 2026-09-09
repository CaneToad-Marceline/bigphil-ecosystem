"use client"

import { useEffect, useState } from 'react'
import { getProducts, addProduct, updateProduct, toggleProductStatus, ProductInput } from '@/lib/supabase/productActions'

export default function KatalogPage() {
  const [products, setProducts] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  
  const [formData, setFormData] = useState<ProductInput>({
    name: '',
    description: '',
    price: 0,
    price_merchant: 0,
    cost_price: 0,
    stock_quantity: 0,
    is_active: true
  })

  const loadProducts = async () => {
    setIsLoading(true)
    try {
      const data = await getProducts()
      setProducts(data || [])
    } catch (error) {
      console.error(error)
    }
    setIsLoading(false)
  }

  useEffect(() => {
    loadProducts()
  }, [])

  const handleOpenModal = (product?: any) => {
    if (product) {
      setEditingId(product.id)
      setFormData({
        name: product.name,
        description: product.description || '',
        price: product.price,
        price_merchant: product.price_merchant || 0,
        cost_price: product.cost_price || 0,
        stock_quantity: product.stock_quantity,
        is_active: product.is_active
      })
    } else {
      setEditingId(null)
      setFormData({
        name: '',
        description: '',
        price: 0,
        price_merchant: 0,
        cost_price: 0,
        stock_quantity: 0,
        is_active: true
      })
    }
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingId(null)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as HTMLInputElement
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingId) {
        await updateProduct(editingId, formData)
        alert('Produk berhasil diperbarui!')
      } else {
        await addProduct(formData)
        alert('Produk berhasil ditambahkan!')
      }
      handleCloseModal()
      loadProducts()
    } catch (error) {
      alert('Terjadi kesalahan saat menyimpan produk.')
    }
  }

  const handleToggle = async (id: string, currentStatus: boolean) => {
    if (window.confirm(`Yakin ingin ${currentStatus ? 'menonaktifkan' : 'mengaktifkan'} produk ini?`)) {
      try {
        await toggleProductStatus(id, currentStatus)
        loadProducts()
      } catch (error) {
        alert('Gagal mengubah status produk.')
      }
    }
  }

  const formatRupiah = (number: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(number || 0)
  }

  return (
    <div className="p-6 md:p-10 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Katalog Produk</h2>
          <p className="text-slate-500 mt-1">Kelola data produk, harga dasar, dan status ketersediaan.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-5 rounded-lg shadow-sm transition"
        >
          + Tambah Produk
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-sm">
                <th className="p-4 font-semibold">NAMA PRODUK</th>
                <th className="p-4 font-semibold">DESKRIPSI</th>
                <th className="p-4 font-semibold text-right">HARGA (OFFLINE)</th>
                <th className="p-4 font-semibold text-right">HARGA (MERCHANT)</th>
                <th className="p-4 font-semibold text-right">MODAL (COST)</th>
                <th className="p-4 font-semibold text-center">STOK</th>
                <th className="p-4 font-semibold text-center">STATUS</th>
                <th className="p-4 font-semibold text-center">AKSI</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={8} className="p-8 text-center text-slate-500">Memuat data...</td></tr>
              ) : products.length === 0 ? (
                <tr><td colSpan={8} className="p-8 text-center text-slate-500">Belum ada produk. Klik Tambah Produk untuk memulai.</td></tr>
              ) : (
                products.map((p) => (
                  <tr key={p.id} className={`border-b border-slate-100 hover:bg-slate-50 transition ${!p.is_active && 'opacity-60 bg-slate-50'}`}>
                    <td className="p-4 font-semibold text-slate-800">{p.name}</td>
                    <td className="p-4 text-sm text-slate-500">{p.description || '-'}</td>
                    <td className="p-4 text-right font-medium text-slate-700">{formatRupiah(p.price)}</td>
                    <td className="p-4 text-right font-medium text-slate-700">{formatRupiah(p.price_merchant)}</td>
                    <td className="p-4 text-right font-medium text-rose-600">{formatRupiah(p.cost_price)}</td>
                    <td className="p-4 text-center">
                      <span className={`font-bold px-2 py-1 rounded text-sm ${p.stock_quantity > 10 ? 'bg-green-100 text-green-700' : p.stock_quantity > 0 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                        {p.stock_quantity}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <button 
                        onClick={() => handleToggle(p.id, p.is_active)}
                        className={`text-xs font-bold px-3 py-1.5 rounded-full transition ${p.is_active ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'}`}
                      >
                        {p.is_active ? 'Aktif' : 'Nonaktif'}
                      </button>
                    </td>
                    <td className="p-4 text-center">
                      <button 
                        onClick={() => handleOpenModal(p)}
                        className="text-blue-600 hover:text-blue-800 font-semibold text-sm underline px-2"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-800">{editingId ? 'Edit Produk' : 'Tambah Produk Baru'}</h3>
              <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600 text-xl font-bold">&times;</button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Nama Produk</label>
                  <input required type="text" name="name" value={formData.name} onChange={handleChange} className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition" placeholder="Contoh: Ostekake Original (Small)" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Deskripsi / Detail Ukuran</label>
                  <input type="text" name="description" value={formData.description} onChange={handleChange} className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition" placeholder="Opsional" />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Harga Jual Offline (Rp)</label>
                  <input required type="number" name="price" value={formData.price} onChange={handleChange} min="0" className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Harga Jual Merchant/Ojol (Rp)</label>
                  <input required type="number" name="price_merchant" value={formData.price_merchant} onChange={handleChange} min="0" className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition" />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1 text-rose-600">Modal / Cost Price (Rp)</label>
                  <input required type="number" name="cost_price" value={formData.cost_price} onChange={handleChange} min="0" className="w-full border border-rose-300 rounded-lg p-2.5 focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none transition bg-rose-50/50" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Stok Awal</label>
                  <input required type="number" name="stock_quantity" value={formData.stock_quantity} onChange={handleChange} min="0" className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition" />
                </div>
              </div>
              
              <div className="mt-8 flex justify-end gap-3">
                <button type="button" onClick={handleCloseModal} className="px-5 py-2.5 rounded-lg font-medium text-slate-600 hover:bg-slate-100 transition">
                  Batal
                </button>
                <button type="submit" className="px-5 py-2.5 rounded-lg font-medium text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition">
                  Simpan Produk
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
