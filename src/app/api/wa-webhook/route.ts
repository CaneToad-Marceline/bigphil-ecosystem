import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'
import { GoogleGenerativeAI } from '@google/generative-ai'

// Inisialisasi Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  
  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  if (mode === 'subscribe' && token === process.env.WA_WEBHOOK_VERIFY_TOKEN) {
    console.log('WEBHOOK_VERIFIED')
    return new NextResponse(challenge, { status: 200 })
  } else {
    return new NextResponse('Forbidden', { status: 403 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Verifikasi format payload WhatsApp
    if (body.object !== 'whatsapp_business_account') {
      return new NextResponse('Not a WhatsApp Webhook', { status: 404 })
    }

    const entry = body.entry?.[0]
    const changes = entry?.changes?.[0]
    const value = changes?.value
    const message = value?.messages?.[0]

    // Jika tidak ada pesan teks (misal status update), abaikan
    if (!message || message.type !== 'text') {
      return new NextResponse('EVENT_RECEIVED', { status: 200 })
    }

    const customerPhone = message.from
    const customerText = message.text.body

    console.log(`[WA Webhook] Pesan dari ${customerPhone}: ${customerText}`)

    // 1. Tarik Data Konteks (Produk) dari Supabase
    const { data: products, error: productError } = await supabase
      .from('products')
      .select('name, price, stock')

    if (productError) {
      console.error('Error fetching products:', productError)
      return new NextResponse('Internal Server Error', { status: 500 })
    }

    // 2. Format konteks produk untuk Gemini
    const productContext = products?.map(p => 
      `- ${p.name}: Rp${p.price.toLocaleString('id-ID')} (Sisa Stok: ${p.stock})`
    ).join('\n') || 'Saat ini tidak ada data menu.'

    // 3. Prompting Gemini
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
    
    const systemPrompt = `Anda adalah asisten virtual yang ramah dan sopan untuk "Bigphil Ostekake". 
Tugas Anda adalah melayani pelanggan yang bertanya via WhatsApp.
Gunakan bahasa Indonesia yang santai, sopan, dan jelas.

Berikut adalah ketersediaan menu dan harga saat ini (REAL-TIME):
${productContext}

PENTING:
- Jika stok produk 0, beri tahu pelanggan dengan sopan bahwa produk tersebut sedang habis.
- Jangan mengarang menu atau harga yang tidak ada dalam daftar di atas.
- Jawab dengan singkat dan jelas, jangan terlalu panjang.`

    const result = await model.generateContent([
      systemPrompt,
      `Pelanggan: ${customerText}`
    ])
    
    const aiResponse = result.response.text()

    // 4. Kirim Balasan ke WhatsApp API
    const phoneNumberId = process.env.WA_PHONE_NUMBER_ID
    const waToken = process.env.WA_ACCESS_TOKEN
    
    if (phoneNumberId && waToken) {
      const waResponse = await fetch(`https://graph.facebook.com/v17.0/${phoneNumberId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${waToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: customerPhone,
          type: 'text',
          text: {
            body: aiResponse
          }
        })
      })

      if (!waResponse.ok) {
        console.error('Error sending WhatsApp message:', await waResponse.text())
      }
    } else {
      console.warn('WA_PHONE_NUMBER_ID atau WA_ACCESS_TOKEN belum dikonfigurasi. Pesan balasan dilewati.')
    }

    // 5. Logging ke Supabase
    const { error: logError } = await supabase
      .from('chat_logs')
      .insert([
        { phone_number: customerPhone, message: customerText, is_bot_response: false },
        { phone_number: customerPhone, message: aiResponse, is_bot_response: true }
      ])

    if (logError) {
      console.error('Error inserting chat logs:', logError)
    }

    // WA mewajibkan respon 200 OK dengan cepat
    return new NextResponse('EVENT_RECEIVED', { status: 200 })

  } catch (error) {
    console.error('Webhook error:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
