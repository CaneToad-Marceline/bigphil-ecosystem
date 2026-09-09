import { supabase } from './client'
import { startOfDay, startOfWeek, startOfMonth, endOfDay, formatISO } from 'date-fns'
import { toZonedTime } from 'date-fns-tz'

const TIMEZONE = 'Asia/Jakarta' // WIB

export type TimeFilter = 'daily' | 'weekly' | 'monthly' | 'custom'

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
export const getSummaryMetrics = async (filter: TimeFilter, customRange?: { start: Date, end: Date }): Promise<SummaryMetrics> => {
  let query = supabase
    .from('transaction_items')
    .select(`
      quantity,
      price_at_time,
      transaction_id,
      products ( cost_price ),
      transactions!inner ( status, created_at )
    `)
    .eq('transactions.status', 'completed')

  if (filter === 'custom' && customRange) {
    query = query
      .gte('transactions.created_at', formatISO(startOfDay(customRange.start)))
      .lte('transactions.created_at', formatISO(endOfDay(customRange.end)))
  } else if (filter !== 'custom') {
    const startDate = getStartDateByFilter(filter)
    query = query.gte('transactions.created_at', formatISO(startDate))
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching summary metrics:', error)
    return { totalRevenue: 0, totalTransactions: 0, netProfit: 0 }
  }

  let totalRevenue = 0
  let netProfit = 0
  const txIds = new Set<string>()

  data.forEach((item: any) => {
    const qty = Number(item.quantity)
    const price = Number(item.price_at_time)
    // Ambil cost_price secara dinamis dari tabel products
    const cost = item.products ? Number(item.products.cost_price || 0) : 0
    
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
export const getHeroSKU = async (filter: TimeFilter, limit: number = 10, customRange?: { start: Date, end: Date }): Promise<HeroSKU[]> => {
  let query = supabase
    .from('transaction_items')
    .select(`
      quantity,
      price_at_time,
      products ( id, name ),
      transactions!inner ( status, created_at )
    `)
    .eq('transactions.status', 'completed')

  if (filter === 'custom' && customRange) {
    query = query
      .gte('transactions.created_at', formatISO(startOfDay(customRange.start)))
      .lte('transactions.created_at', formatISO(endOfDay(customRange.end)))
  } else if (filter !== 'custom') {
    const startDate = getStartDateByFilter(filter)
    query = query.gte('transactions.created_at', formatISO(startDate))
  }

  const { data, error } = await query

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
    const subtotal = Number(item.price_at_time) * quantity
    
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
