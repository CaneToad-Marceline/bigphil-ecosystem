const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log("URL:", supabaseUrl);
console.log("Key:", supabaseKey ? supabaseKey.substring(0, 10) + "..." : "missing");

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  console.log("Mencoba insert ke tabel transactions...");
  const { data, error } = await supabase
    .from('transactions')
    .insert([{
      total_amount: 10000,
      payment_method: 'cash',
      status: 'completed'
    }])
    .select('id')
    .single();

  if (error) {
    console.error("ERROR DETAIL:");
    console.error(JSON.stringify(error, null, 2));
    console.error("Error Object:", error);
  } else {
    console.log("BERHASIL! ID Transaksi:", data.id);
  }
}

testConnection();
