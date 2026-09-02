import { supabase } from './client'
import { startOfDay, startOfWeek, startOfMonth, formatISO } from 'date-fns'
import { toZonedTime } from 'date-fns-tz'

const TIMEZONE = 'Asia/Jakarta' // WIB

export type TimeFilter = 'daily' | 'weekly' | 'monthly'

export interface SummaryMetrics {
  totalRevenue: number
  totalTransactions: number
  netProfit: number
}

export interface HeroSKU {
  id: string
  name: string
  size: string
  unitsSold: number
  totalRevenue: number
}

/**
 * Mendapatkan batasan waktu awal berdasarkan filter (dalam zona waktu WIB)
 */
const getStartDateByFilter = (filter: TimeFilter): Date => {
  const now = new Date()
  const zonedNow = toZonedTime(now, TIMEZONE)

  switch (filter) {
    case 'daily':
      return startOfDay(zonedNow)
    case 'weekly':
      // Menggunakan startOfWeek dengan minggu dimulai pada hari Senin (weekStartsOn: 1)
      return startOfWeek(zonedNow, { weekStartsOn: 1 })
    case 'monthly':
      return startOfMonth(zonedNow)
    default:
      return startOfDay(zonedNow)
  }
}

/**
 * Menghitung Total Pendapatan dan Jumlah Transaksi
 */
export const getSummaryMetrics = async (filter: TimeFilter): Promise<SummaryMetrics> => {
  const startDate = getStartDateByFilter(filter)
  const isoStartDate = formatISO(startDate) // Supabase menggunakan format ISO (UTC)

  const { data, error } = await supabase
    .from('transaction_items')
    .select(`
      quantity,
      unit_price,
      cost_price_at_time,
      transaction_id,
      transactions!inner ( status, created_at )
    `)
    .gte('transactions.created_at', isoStartDate)
    .eq('transactions.status', 'completed')

  if (error) {
    console.error('Error fetching summary metrics:', error)
    return { totalRevenue: 0, totalTransactions: 0, netProfit: 0 }
  }

  let totalRevenue = 0
  let netProfit = 0
  const txIds = new Set<string>()

  data.forEach((item: any) => {
    const qty = Number(item.quantity)
    const price = Number(item.unit_price)
    const cost = Number(item.cost_price_at_time || 0)
    
    totalRevenue += price * qty
    netProfit += (price - cost) * qty
    txIds.add(item.transaction_id)
  })

  return { 
    totalRevenue, 
    totalTransactions: txIds.size, 
    netProfit 
  }
}

/**
 * Mengekstrak ukuran dari nama produk
 */
const extractSize = (name: string): string => {
  const lowerName = name.toLowerCase()
  if (lowerName.includes('150') || lowerName.includes('small')) {
    return 'Small 150ml'
  }
  if (lowerName.includes('300') || lowerName.includes('big')) {
    return 'Big 300ml'
  }
  return '-'
}

/**
 * Mengambil data Hero SKU (Leaderboard Produk Terlaris)
 */
export const getHeroSKU = async (filter: TimeFilter, limit: number = 10): Promise<HeroSKU[]> => {
  const startDate = getStartDateByFilter(filter)
  const isoStartDate = formatISO(startDate)

  // Join table transaction_items dengan products dan transactions
  const { data, error } = await supabase
    .from('transaction_items')
    .select(`
      quantity,
      subtotal,
      products ( id, name ),
      transactions!inner ( status, created_at )
    `)
    .gte('transactions.created_at', isoStartDate)
    .eq('transactions.status', 'completed')

  if (error) {
    console.error('Error fetching hero SKU:', error)
    return []
  }

  // Agregasi di sisi klien (JS)
  const skuMap: Record<string, HeroSKU> = {}

  data.forEach((item: any) => {
    const product = item.products
    if (!product) return

    const productId = product.id
    const quantity = Number(item.quantity)
    const subtotal = Number(item.subtotal)
    
    if (!skuMap[productId]) {
      skuMap[productId] = {
        id: productId,
        name: product.name,
        size: extractSize(product.name),
        unitsSold: 0,
        totalRevenue: 0
      }
    }

    skuMap[productId].unitsSold += quantity
    skuMap[productId].totalRevenue += subtotal
  })

  // Ubah ke array dan urutkan berdasarkan unit terjual (descending)
  const sortedSKUs = Object.values(skuMap).sort((a, b) => b.unitsSold - a.unitsSold)

  return sortedSKUs.slice(0, limit)
}
