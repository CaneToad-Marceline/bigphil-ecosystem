import { supabase } from './client'

export interface ProductInput {
  name: string
  description?: string
  price: number
  price_merchant?: number
  cost_price: number
  stock_quantity: number
  is_active?: boolean
}

export async function getProducts() {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching products:', error)
    throw error
  }
  return data
}

export async function addProduct(product: ProductInput) {
  const { data, error } = await supabase
    .from('products')
    .insert([{
      name: product.name,
      description: product.description,
      price: product.price,
      price_merchant: product.price_merchant,
      cost_price: product.cost_price,
      stock_quantity: product.stock_quantity,
      is_active: product.is_active ?? true
    }])
    .select()
    .single()

  if (error) {
    console.error('Error adding product:', error)
    throw error
  }
  return data
}

export async function updateProduct(id: string, product: Partial<ProductInput>) {
  const { data, error } = await supabase
    .from('products')
    .update(product)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating product:', error)
    throw error
  }
  return data
}

export async function toggleProductStatus(id: string, currentStatus: boolean) {
  const { data, error } = await supabase
    .from('products')
    .update({ is_active: !currentStatus })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error toggling product status:', error)
    throw error
  }
  return data
}
