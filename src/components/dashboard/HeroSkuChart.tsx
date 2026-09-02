import React from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts'
import { HeroSKU } from '@/lib/supabase/analytics'

interface HeroSkuChartProps {
  data: HeroSKU[]
}

export default function HeroSkuChart({ data }: HeroSkuChartProps) {
  // Format data untuk mempermudah render label sumbu Y (menggabungkan nama dan ukuran)
  const chartData = data.map(item => ({
    ...item,
    displayName: `${item.name} (${item.size.split(' ')[0]})`, // Misal: Ostekake (Small)
  }))

  return (
    <div className="w-full h-[400px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{
            top: 20,
            right: 30,
            left: 50,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
          <XAxis type="number" hide />
          <YAxis 
            dataKey="displayName" 
            type="category" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#475569', fontSize: 12, fontWeight: 500 }}
          />
          <Tooltip 
            cursor={{ fill: '#f1f5f9' }}
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
          />
          <Legend iconType="circle" />
          <Bar 
            dataKey="unitsSold" 
            name="Unit Terjual" 
            fill="#3b82f6" 
            radius={[0, 4, 4, 0]} 
            barSize={20}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
