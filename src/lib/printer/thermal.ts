import { CartItem, OrderType } from '../store/useCartStore'

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

export async function connectPrinter(): Promise<any> {
  const nav = navigator as any;
  if (typeof nav === 'undefined' || !nav.bluetooth) {
    throw new Error("Web Bluetooth API tidak didukung di perangkat/browser ini.")
  }

  const PRINTER_SERVICE_UUID = '000018f0-0000-1000-8000-00805f9b34fb'
  const PRINTER_CHARACTERISTIC_UUID = '00002af1-0000-1000-8000-00805f9b34fb'

  const device = await nav.bluetooth.requestDevice({
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

export async function printReceipt(cartItems: CartItem[], itemsTotal: number, orderType: OrderType, shippingFee: number = 0, addonFee: number = 0) {
  try {
    const characteristic = await connectPrinter()

    let receipt = ""
    receipt += INIT
    receipt += ALIGN_CENTER
    receipt += BOLD_ON + "BIGPHIL OSTEKAKE" + BOLD_OFF + LF
    receipt += "Nusa Loka Park BSD, Plaza Cordoba, Jl. Mekar Jaya Blok H08, Banten" + LF
    receipt += "WA: 081524321194" + LF
    receipt += "--------------------------------" + LF
    receipt += ALIGN_LEFT

    cartItems.forEach(item => {
      receipt += item.name + LF

      const currentPrice = orderType === 'offline' ? item.priceOffline : item.priceMerchant
      const lineStr = `  ${item.quantity} x ${currentPrice}`
      const subtotalStr = (item.quantity * currentPrice).toString()

      const spacesLength = 32 - lineStr.length - subtotalStr.length
      const spaces = spacesLength > 0 ? " ".repeat(spacesLength) : " "

      receipt += lineStr + spaces + subtotalStr + LF
    })

    receipt += "--------------------------------" + LF

    if (shippingFee > 0) {
      const shipStr = "Ongkos Kirim"
      const shipAmt = shippingFee.toString()
      const spacesLength = 32 - shipStr.length - shipAmt.length
      const spaces = spacesLength > 0 ? " ".repeat(spacesLength) : " "
      receipt += shipStr + spaces + shipAmt + LF
    }

    if (addonFee > 0) {
      const addonStr = "Add-on"
      const addonAmt = addonFee.toString()
      const spacesLength = 32 - addonStr.length - addonAmt.length
      const spaces = spacesLength > 0 ? " ".repeat(spacesLength) : " "
      receipt += addonStr + spaces + addonAmt + LF
    }

    if (shippingFee > 0 || addonFee > 0) {
      receipt += "--------------------------------" + LF
    }


    const totalStr = "TOTAL"
    const totalAmount = (itemsTotal + shippingFee + addonFee).toString()
    const totalSpacesLength = 32 - totalStr.length - totalAmount.length
    const totalSpaces = totalSpacesLength > 0 ? " ".repeat(totalSpacesLength) : " "

    receipt += BOLD_ON + totalStr + totalSpaces + totalAmount + BOLD_OFF + LF

    receipt += ALIGN_CENTER
    receipt += "--------------------------------" + LF
    receipt += "Terima kasih atas" + LF
    receipt += "kunjungan Anda!" + LF
    receipt += LF + LF + LF
    receipt += PAPER_CUT

    const encoder = new TextEncoder()
    const data = encoder.encode(receipt)

    await characteristic.writeValue(data)

  } catch (error) {
    console.error("Print Error:", error)
    throw error
  }
}
