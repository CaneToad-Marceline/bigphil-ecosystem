const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  console.log("Mencoba insert ke tabel transactions...");
  const { data: tx, error: txError } = await supabase
    .from('transactions')
    .insert([{
      total_amount: 10000,
      payment_method: 'cash',
      status: 'completed'
    }])
    .select('id')
    .single();

  if (txError) {
    console.error("TX ERROR:", JSON.stringify(txError, null, 2));
    return;
  }
  
  console.log("Berhasil insert TX:", tx.id);
  console.log("Mencoba insert ke tabel transaction_items...");
  
  const { data: items, error: itemsError } = await supabase
    .from('transaction_items')
    .insert([{
      transaction_id: tx.id,
      quantity: 1,
      unit_price: 10000,
      subtotal: 10000
    }]);

  if (itemsError) {
    console.error("ITEMS ERROR DETAIL:");
    console.error(JSON.stringify(itemsError, null, 2));
    console.error("ITEMS ERROR:", itemsError);
  } else {
    console.log("BERHASIL INSERT ITEMS!");
  }
}

testConnection();
