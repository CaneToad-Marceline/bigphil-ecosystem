import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })
dotenv.config({ path: '.env' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

const supabase = createClient(supabaseUrl, supabaseKey)

async function run() {
  const products = [
    {
      name: "Cookies",
      description: "The OG",
      price: 25000,
      price_merchant: 25000,
      cost_price: 0,
      stock_quantity: 50,
      is_active: true
    },
    {
      name: "Cookies",
      description: "Going NUTS",
      price: 25000,
      price_merchant: 25000,
      cost_price: 0,
      stock_quantity: 50,
      is_active: true
    },
    {
      name: "Cookies",
      description: "Matcha Mood",
      price: 25000,
      price_merchant: 25000,
      cost_price: 0,
      stock_quantity: 50,
      is_active: true
    },
    {
      name: "Cookies",
      description: "Dark AF",
      price: 25000,
      price_merchant: 25000,
      cost_price: 0,
      stock_quantity: 50,
      is_active: true
    }
  ]

  const { data, error } = await supabase.from('products').insert(products).select()
  if (error) console.error(error)
  else console.log("Successfully inserted:", data)
}

run()
