import { supabase } from './client'

export interface Promotion {
  id: string
  name: string
  price_offline: number
  price_merchant: number
  required_quantity: number
  eligible_product_ids: string[]
  is_active: boolean
  created_at: string
}

export async function getPromotions() {
  try {
    const { data, error } = await supabase
      .from('promotions')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data as Promotion[]
  } catch (error: any) {
    console.error("Error fetching promotions:", error.message)
    return []
  }
}

export async function createPromotion(promo: Omit<Promotion, 'id' | 'created_at'>) {
  try {
    const { data, error } = await supabase
      .from('promotions')
      .insert([promo])
      .select()
      .single()

    if (error) throw error
    return data as Promotion
  } catch (error: any) {
    console.error("Error creating promotion:", error.message)
    throw error
  }
}

export async function updatePromotion(id: string, promo: Partial<Omit<Promotion, 'id' | 'created_at'>>) {
  try {
    const { data, error } = await supabase
      .from('promotions')
      .update(promo)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as Promotion
  } catch (error: any) {
    console.error("Error updating promotion:", error.message)
    throw error
  }
}

export async function deletePromotion(id: string) {
  try {
    const { error } = await supabase
      .from('promotions')
      .delete()
      .eq('id', id)

    if (error) throw error
    return true
  } catch (error: any) {
    console.error("Error deleting promotion:", error.message)
    throw error
  }
}
