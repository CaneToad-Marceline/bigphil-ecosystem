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
        order_type: orderType,
        status: 'completed'
      }])
      .select('id')
      .single()

    if (txError) throw txError
    if (!transaction) throw new Error("Gagal membuat transaksi baru")

    // 2. Siapkan data untuk transaction_items
    const itemsData: any[] = []
    
    cartItems.forEach((item) => {
      const unitPrice = orderType === 'offline' ? item.priceOffline : item.priceMerchant;
      
      if (item.isPromo && item.selectedProducts) {
        // Insert baris header promo (product_id = null, promo_id terisi)
        itemsData.push({
          transaction_id: transaction.id,
          product_id: null,
          promo_id: item.id,
          quantity: item.quantity,
          price_at_time: unitPrice
        })
        
        // Insert baris sub-item produk di dalam promo (harga 0 karena sudah dibayar di header promo)
        item.selectedProducts.forEach(sp => {
          itemsData.push({
            transaction_id: transaction.id,
            product_id: sp.id,
            promo_id: item.id,
            quantity: sp.quantity * item.quantity, // jumlah produk per promo * jumlah paket promo
            price_at_time: 0
          })
        })
      } else {
        // Insert produk reguler
        itemsData.push({
          transaction_id: transaction.id,
          product_id: item.id,
          promo_id: null,
          quantity: item.quantity,
          price_at_time: unitPrice
        })
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
    // 0. Pastikan transaksi belum dibatalkan (untuk mencegah double cancel)
    const { data: currentTx, error: checkError } = await supabase
      .from('transactions')
      .select('status')
      .eq('id', transactionId)
      .single()

    if (checkError) throw checkError
    if (currentTx.status === 'cancelled') {
      throw new Error("Transaksi sudah pernah dibatalkan sebelumnya.")
    }

    // 1. Update status transactions menjadi cancelled dan set total = 0
    const { error: txError } = await supabase
      .from('transactions')
      .update({ status: 'cancelled', total_amount: 0 })
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
            .select('stock_quantity')
            .eq('id', item.product_id)
            .single()

          if (!pError && product) {
            // Update dengan stok yang direstorasi
            await supabase
              .from('products')
              .update({ stock_quantity: product.stock_quantity + item.quantity })
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
