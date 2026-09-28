import React from 'react'
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'
import { HeroSKU } from '@/lib/supabase/analytics'

interface SalesPieChartProps {
  data: HeroSKU[]
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16', '#64748b', '#d946ef']

export default function SalesPieChart({ data }: SalesPieChartProps) {
  // Hanya ambil data yang memiliki totalRevenue > 0 untuk pie chart pendapatan
  const chartData = data
    .filter(item => item.totalRevenue > 0)
    .map(item => ({
      name: item.variant === 'Paket Promo' ? `[Promo] ${item.name}` : item.name,
      value: item.totalRevenue
    }))

  const formatRupiah = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(value)
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-slate-100 shadow-lg rounded-xl text-sm font-medium">
          <p className="text-slate-800 mb-1">{payload[0].name}</p>
          <p className="text-emerald-600 font-bold">{formatRupiah(payload[0].value)}</p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="w-full h-[400px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="45%"
            labelLine={false}
            outerRadius={120}
            innerRadius={60}
            fill="#8884d8"
            dataKey="value"
            paddingAngle={2}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="rgba(255,255,255,0.5)" strokeWidth={2} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            verticalAlign="bottom" 
            iconType="circle"
            wrapperStyle={{ fontSize: '11px', paddingTop: '20px' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
