import { CartItem } from '../store/useCartStore'

// Helper untuk ESC/POS commands
const ESC = "\x1B"
const GS = "\x1D"
const INIT = ESC + "@"
const ALIGN_CENTER = ESC + "a\x01"
const ALIGN_LEFT = ESC + "a\x00"
const BOLD_ON = ESC + "E\x01"
const BOLD_OFF = ESC + "E\x00"
const PAPER_CUT = GS + "V\x41\x00" // Partial cut
const LF = "\n"

export async function connectPrinter(): Promise<BluetoothRemoteGATTCharacteristic> {
  // Pastikan berjalan di client-side dan browser mendukung Web Bluetooth API
  if (typeof navigator === 'undefined' || !navigator.bluetooth) {
    throw new Error("Web Bluetooth API tidak didukung di perangkat/browser ini.")
  }

  // UUID 000018f0... adalah UUID service umum untuk banyak printer thermal Bluetooth China
  // Jika gagal, bisa dicoba ditambahkan UUID alternatif, contoh: 'e7810a71-73ae-499d-8c15-faa9aef0c3f2'
  const PRINTER_SERVICE_UUID = '000018f0-0000-1000-8000-00805f9b34fb'
  const PRINTER_CHARACTERISTIC_UUID = '00002af1-0000-1000-8000-00805f9b34fb'

  const device = await navigator.bluetooth.requestDevice({
    filters: [{ services: [PRINTER_SERVICE_UUID] }],
    optionalServices: [PRINTER_SERVICE_UUID]
  })

  const server = await device.gatt?.connect()
  const service = await server?.getPrimaryService(PRINTER_SERVICE_UUID)
  const characteristic = await service?.getCharacteristic(PRINTER_CHARACTERISTIC_UUID)

  if (!characteristic) {
    throw new Error("Gagal mendapatkan characteristic printer untuk menulis data.")
  }

  return characteristic
}

export async function printReceipt(cartItems: CartItem[], total: number) {
  try {
    const characteristic = await connectPrinter()
    
    // Rakit string ESC/POS untuk receipt
    let receipt = ""
    receipt += INIT
    receipt += ALIGN_CENTER
    receipt += BOLD_ON + "BIGPHIL OSTEKAKE" + BOLD_OFF + LF
    receipt += "Jl. Contoh Alamat No.123" + LF
    receipt += "Telp: 081234567890" + LF
    receipt += "--------------------------------" + LF
    receipt += ALIGN_LEFT
    
    cartItems.forEach(item => {
      // Baris nama barang
      receipt += item.name + LF
      
      // Baris perhitungan (qty x harga = subtotal)
      const lineStr = `  ${item.quantity} x ${item.price}`
      const subtotalStr = (item.quantity * item.price).toString()
      
      // Kalkulasi spasi agar subtotal rata kanan
      // Asumsi printer 58mm = max 32 karakter per baris
      const spacesLength = 32 - lineStr.length - subtotalStr.length
      const spaces = spacesLength > 0 ? " ".repeat(spacesLength) : " "
      
      receipt += lineStr + spaces + subtotalStr + LF
    })
    
    receipt += "--------------------------------" + LF
    
    const totalStr = "TOTAL"
    const totalAmount = total.toString()
    const totalSpacesLength = 32 - totalStr.length - totalAmount.length
    const totalSpaces = totalSpacesLength > 0 ? " ".repeat(totalSpacesLength) : " "
    
    receipt += BOLD_ON + totalStr + totalSpaces + totalAmount + BOLD_OFF + LF
    
    receipt += ALIGN_CENTER
    receipt += "--------------------------------" + LF
    receipt += "Terima kasih atas" + LF
    receipt += "kunjungan Anda!" + LF
    receipt += LF + LF + LF // Feed kertas
    receipt += PAPER_CUT // Potong kertas

    // Encode string menjadi Uint8Array
    const encoder = new TextEncoder()
    const data = encoder.encode(receipt)

    // Tulis ke perangkat bluetooth
    // Note: Untuk payload yang sangat besar (>512 bytes), mungkin perlu di-chunk
    await characteristic.writeValue(data)

  } catch (error) {
    console.error("Print Error:", error)
    throw error
  }
}
