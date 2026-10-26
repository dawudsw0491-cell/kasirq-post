import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET: Ambil semua riwayat penjualan dari Supabase
export async function GET() {
  try {
    const { data: sales, error } = await supabase
      .from("sales_history")
      .select("*")
      .order("date", { ascending: false });

    if (error) {
      throw error;
    }

    // Mapping agar sesuai dengan format yang biasa dipakai frontend
    const formattedSales = (sales || []).map((sale) => ({
      id: sale.id,
      invoiceNo: sale.id,
      totalAmount: sale.total,
      payAmount: sale.pay,
      changeAmount: sale.change,
      customerName: sale.customer_name,
      paymentMethod: sale.payment_method,
      createdAt: sale.date,
      items: typeof sale.items === "string" ? JSON.parse(sale.items) : sale.items,
    }));

    return NextResponse.json({ success: true, data: formattedSales });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Gagal mengambil data penjualan" },
      { status: 500 }
    );
  }
}

// POST: Simpan transaksi kasir baru dan kurangi stok produk di Supabase
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { invoiceNo, totalAmount, payAmount, changeAmount, customerName, paymentMethod, items } = body;

    const parsedTotal = Number(totalAmount) || 0;
    const parsedPay = Number(payAmount) || 0;
    const parsedChange = Number(changeAmount) || 0;
    const trxId = invoiceNo || `INV-${Date.now()}`;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: "Item transaksi tidak boleh kosong" },
        { status: 400 }
      );
    }

    // 1. Simpan ke tabel sales_history
    const { error: saleError } = await supabase.from("sales_history").insert([
      {
        id: trxId,
        items: items,
        total: parsedTotal,
        payment_method: paymentMethod || "Tunai",
        customer_name: customerName || "Umum",
        pay: parsedPay,
        change: parsedChange,
      },
    ]);

    if (saleError) {
      throw saleError;
    }

    // 2. Jika metode pembayaran adalah Piutang, catat ke tabel piutang
    if (paymentMethod === "Piutang") {
      await supabase.from("piutang").insert([
        {
          id: `PTG-${Date.now()}`,
          trx_id: trxId,
          customer_name: customerName || "Umum",
          amount: parsedTotal,
          paid_amount: 0,
          remaining_amount: parsedTotal,
          status: "Belum Lunas",
        },
      ]);
    }

    // 3. Kurangi stok produk satu per satu berdasarkan item yang dibeli
    for (const item of items) {
      const itemQty = Number(item.quantity || item.qty) || 1;
      const productId = item.productId || item.id;

      if (productId) {
        // Ambil stok saat ini terlebih dahulu
        const { data: currentProd } = await supabase
          .from("products")
          .select("stock")
          .eq("id", productId)
          .single();

        if (currentProd) {
          const newStock = Math.max(0, (currentProd.stock || 0) - itemQty);
          await supabase
            .from("products")
            .update({ stock: newStock })
            .eq("id", productId);
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      data: { invoiceNo: trxId, totalAmount: parsedTotal } 
    });
  } catch (error: any) {
    console.error("API Sales Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Terjadi kesalahan pada server" },
      { status: 500 }
    );
  }
}