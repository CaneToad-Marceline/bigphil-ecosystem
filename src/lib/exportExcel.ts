import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { supabase } from '@/lib/supabase/client';
import { TimeFilter, SummaryMetrics, HeroSKU } from './supabase/analytics';
import { startOfDay, startOfWeek, startOfMonth, endOfDay, formatISO } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

const TIMEZONE = 'Asia/Jakarta';

const getStartDateByFilter = (filter: TimeFilter): Date => {
  const now = new Date();
  const zonedNow = toZonedTime(now, TIMEZONE);

  switch (filter) {
    case 'daily':
      return startOfDay(zonedNow);
    case 'weekly':
      return startOfWeek(zonedNow, { weekStartsOn: 1 });
    case 'monthly':
      return startOfMonth(zonedNow);
    default:
      return startOfDay(zonedNow);
  }
};

export const exportDashboardToExcel = async (
  filter: TimeFilter,
  customRange: { start: string; end: string },
  metrics: SummaryMetrics,
  heroSKUs: HeroSKU[]
) => {
  try {
    // 1. Ambil semua transaksi pada rentang waktu yang dipilih
    let query = supabase
      .from('transactions')
      .select(`
        id, created_at, status, total_amount, payment_method, order_type, shipping_fee, addon_fee
      `)
      .order('created_at', { ascending: false });

    if (filter === 'custom' && customRange.start && customRange.end) {
      query = query
        .gte('created_at', formatISO(startOfDay(new Date(customRange.start))))
        .lte('created_at', formatISO(endOfDay(new Date(customRange.end))));
    } else if (filter !== 'custom') {
      const startDate = getStartDateByFilter(filter);
      query = query.gte('created_at', formatISO(startDate));
    }

    const { data: transactionsData, error: txError } = await query;

    if (txError) throw txError;

    // 2. Ambil detail item dari transaksi yang berhasil
    const completedTxIds = transactionsData?.filter(tx => tx.status === 'completed').map(tx => tx.id) || [];
    let itemsData: any[] = [];
    
    if (completedTxIds.length > 0) {
      const { data, error: itemsError } = await supabase
        .from('transaction_items')
        .select(`
          id, transaction_id, quantity, price_at_time, promo_id, product_id,
          products ( name ), promotions ( name )
        `)
        .in('transaction_id', completedTxIds);
        
      if (itemsError) throw itemsError;
      itemsData = data || [];
    }

    const wb = XLSX.utils.book_new();

    const periodText = filter === 'custom' ? `${customRange.start} s/d ${customRange.end}` : filter;

    // Sheet 1: Ringkasan
    const summaryData = [
      ['Periode Filter', periodText],
      ['Total Pendapatan', metrics.totalRevenue],
      ['Total Laba Bersih', metrics.netProfit],
      ['Jumlah Transaksi Selesai', metrics.totalTransactions],
    ];
    const wsSummary = XLSX.utils.aoa_to_sheet([
      [`LAPORAN RINGKASAN PENJUALAN - PERIODE: ${periodText.toUpperCase()}`],
      [],
      ['Parameter', 'Nilai'],
      ...summaryData
    ]);
    // Lebarkan kolom
    wsSummary['!cols'] = [{ wch: 25 }, { wch: 30 }];
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Ringkasan');

    // Sheet 2: Data Transaksi
    const txSheetData = transactionsData?.map(tx => ({
      'ID Transaksi': tx.id,
      'Tanggal & Waktu': format(new Date(tx.created_at), 'yyyy-MM-dd HH:mm:ss'),
      'Status': tx.status,
      'Tipe Pesanan': tx.order_type || '-',
      'Metode Pembayaran': tx.payment_method,
      'Ongkos Kirim': tx.shipping_fee || 0,
      'Biaya Tambahan': tx.addon_fee || 0,
      'Total Keseluruhan': tx.total_amount
    })) || [];
    const wsTx = XLSX.utils.aoa_to_sheet([
      [`DAFTAR TRANSAKSI - PERIODE: ${periodText.toUpperCase()}`],
      []
    ]);
    XLSX.utils.sheet_add_json(wsTx, txSheetData, { origin: 'A3' });
    wsTx['!cols'] = [{ wch: 36 }, { wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 18 }, { wch: 15 }, { wch: 15 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(wb, wsTx, 'Daftar Transaksi');

    // Sheet 3: Detail Item
    const itemsSheetData = itemsData.map(item => {
      let itemName = 'Item tidak diketahui';
      
      if (item.product_id && item.promo_id) {
        // Ini adalah produk di dalam paket promo
        itemName = `  - ${item.products?.name} (Isi Paket)`;
      } else if (item.promo_id && !item.product_id) {
        // Ini adalah header paket promo
        itemName = `[Promo] ${item.promotions?.name}`;
      } else if (item.product_id) {
        // Ini adalah produk satuan biasa
        itemName = item.products?.name || itemName;
      }

      const tx = transactionsData?.find(t => t.id === item.transaction_id);

      return {
        'ID Transaksi': item.transaction_id,
        'Tanggal': tx?.created_at ? format(new Date(tx.created_at), 'yyyy-MM-dd') : '-',
        'Waktu': tx?.created_at ? format(new Date(tx.created_at), 'HH:mm:ss') : '-',
        'Nama Item': itemName,
        'Harga Satuan': item.price_at_time,
        'Jumlah': item.quantity,
        'Subtotal': item.price_at_time * item.quantity
      };
    });
    const wsItems = XLSX.utils.aoa_to_sheet([
      [`DETAIL ITEM PEMBELIAN - PERIODE: ${periodText.toUpperCase()}`],
      []
    ]);
    XLSX.utils.sheet_add_json(wsItems, itemsSheetData, { origin: 'A3' });
    wsItems['!cols'] = [{ wch: 36 }, { wch: 15 }, { wch: 10 }, { wch: 40 }, { wch: 15 }, { wch: 10 }, { wch: 15 }];
    XLSX.utils.book_append_sheet(wb, wsItems, 'Detail Item Pembelian');

    // Sheet 4: Leaderboard Produk (Hero SKUs)
    const heroSheetData = heroSKUs.map(sku => ({
      'Nama Produk': sku.name,
      'Varian': sku.variant,
      'Unit Terjual': sku.unitsSold,
      'Total Pendapatan': sku.totalRevenue
    }));
    const wsHero = XLSX.utils.aoa_to_sheet([
      [`LEADERBOARD PRODUK - PERIODE: ${periodText.toUpperCase()}`],
      []
    ]);
    XLSX.utils.sheet_add_json(wsHero, heroSheetData, { origin: 'A3' });
    wsHero['!cols'] = [{ wch: 30 }, { wch: 15 }, { wch: 15 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(wb, wsHero, 'Produk Terlaris');

    // Generate dan download Excel
    const fileName = `Laporan_Penjualan_${filter}_${format(new Date(), 'yyyyMMdd_HHmmss')}.xlsx`;
    XLSX.writeFile(wb, fileName);
    
    return { success: true };
  } catch (error) {
    console.error('Export Error:', error);
    return { success: false, error };
  }
};
