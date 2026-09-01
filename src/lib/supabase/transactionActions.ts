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
        subtotal: unitPrice * item.quantity
      }
    })

    // 3. Insert ke transaction_items
    const { error: itemsError } = await supabase
      .from('transaction_items')
      .insert(itemsData)

    if (itemsError) throw itemsError

    return transaction.id
  } catch (error) {
    console.error("Error submitting transaction:", error)
    throw error
  }
}
