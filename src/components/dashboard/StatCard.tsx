import React from 'react'

interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon?: React.ReactNode
  colorClass?: string
}

export default function StatCard({ title, value, subtitle, icon, colorClass = 'bg-white' }: StatCardProps) {
  return (
    <div className={`p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between ${colorClass}`}>
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-slate-500 font-medium text-sm">{title}</h3>
        {icon && <div className="text-slate-400">{icon}</div>}
      </div>
      <div>
        <div className="text-3xl font-black text-slate-800 mb-1">{value}</div>
        {subtitle && <p className="text-xs text-slate-400 font-medium">{subtitle}</p>}
      </div>
    </div>
  )
}
