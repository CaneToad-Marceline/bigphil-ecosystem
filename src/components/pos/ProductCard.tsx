"use client"

import { Product } from '@/lib/store/useCartStore'

interface ProductCardProps {
  product: Product
  onAdd: (product: Product) => void
}

export default function ProductCard({ product, onAdd }: ProductCardProps) {
  const formatRupiah = (number: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(number)
  }

  return (
    <div 
      onClick={() => onAdd(product)}
      className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 cursor-pointer hover:shadow-md transition-shadow active:scale-95 flex flex-col h-full"
    >
      <div className="aspect-square bg-slate-100 rounded-lg mb-3 flex items-center justify-center overflow-hidden">
        {product.image_url ? (
          <img src={product.image_url} alt={product.name} className="object-cover w-full h-full" />
        ) : (
          <span className="text-4xl">🍰</span>
        )}
      </div>
      <div className="mt-auto">
        <h3 className="font-semibold text-slate-800 line-clamp-2">{product.name}</h3>
        <p className="text-lg font-bold text-blue-600 mt-1">{formatRupiah(product.price)}</p>
        <div className="mt-2 text-xs font-medium text-slate-500 bg-slate-100 w-fit px-2 py-1 rounded-full">
          Sisa: {product.stock}
        </div>
      </div>
    </div>
  )
}
