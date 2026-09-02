import { supabase } from './client'
import { CartItem, OrderType } from '../store/useCartStore'

export async function submitTransaction(
  cartItems: CartItem[], 
  totalAmount: number, 
  paymentMethod: string = 'cash',
  orderType: OrderType = 'offline'
) {
  try {
    // 1. Insert ke tabel transactions
    const { data: transaction, error: txError } = await supabase
      .from('transactions')
      .insert([{
        total_amount: totalAmount,
        payment_method: paymentMethod,
        status: 'completed'
      }])
      .select('id')
      .single()

    if (txError) throw txError
    if (!transaction) throw new Error("Gagal membuat transaksi baru")

    // 2. Siapkan data untuk transaction_items
    const itemsData = cartItems.map((item) => {
      const unitPrice = orderType === 'offline' ? item.priceOffline : item.priceMerchant;
      
      // Catatan: Karena mock data kita menggunakan ID seperti 's1' (bukan UUID),
      // kita biarkan product_id null sementara sampai tabel products di-fetch asli.
      return {
        transaction_id: transaction.id,
        quantity: item.quantity,
        unit_price: unitPrice,
        cost_price_at_time: item.costPrice || 0,
        subtotal: unitPrice * item.quantity
      }
    })

    // 3. Insert ke transaction_items
    const { error: itemsError } = await supabase
      .from('transaction_items')
      .insert(itemsData)

    if (itemsError) throw itemsError

    return transaction.id
  } catch (error: any) {
    console.error("Error submitting transaction DETAIL:", {
      message: error?.message,
      details: error?.details,
      hint: error?.hint,
      code: error?.code,
      fullError: JSON.stringify(error)
    })
    throw error
  }
}

export async function cancelTransaction(transactionId: string) {
  try {
    // 1. Update status transactions menjadi cancelled
    const { error: txError } = await supabase
      .from('transactions')
      .update({ status: 'cancelled' })
      .eq('id', transactionId)

    if (txError) throw txError

    // 2. Tarik data transaction_items untuk restorasi stok
    const { data: items, error: fetchError } = await supabase
      .from('transaction_items')
      .select('product_id, quantity')
      .eq('transaction_id', transactionId)

    if (fetchError) throw fetchError

    // 3. Looping update stok pada tabel products (fallback jika product_id tidak null)
    if (items && items.length > 0) {
      for (const item of items) {
        if (item.product_id) {
          // Ambil stok saat ini
          const { data: product, error: pError } = await supabase
            .from('products')
            .select('stock')
            .eq('id', item.product_id)
            .single()

          if (!pError && product) {
            // Update dengan stok yang direstorasi
            await supabase
              .from('products')
              .update({ stock: product.stock + item.quantity })
              .eq('id', item.product_id)
          }
        }
      }
    }

    return true
  } catch (error: any) {
    console.error("Error cancelling transaction DETAIL:", {
      message: error?.message,
      fullError: JSON.stringify(error)
    })
    throw error
  }
}
