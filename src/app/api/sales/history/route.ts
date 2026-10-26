import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  try {
    const { data: salesHistory, error } = await supabase
      .from("sales_history")
      .select("*")
      .order("date", { ascending: false });

    if (error) {
      throw error;
    }

    // Mapping data agar sesuai dengan struktur format frontend
    const sales = (salesHistory || []).map((sale) => {
      const itemsList = typeof sale.items === "string" ? JSON.parse(sale.items) : (sale.items || []);
      const totalAmt = Number(sale.total) || 0;

      return {
        id: sale.id,
        invoiceNo: sale.id,
        totalAmount: totalAmt,
        payAmount: Number(sale.pay) || 0,
        changeAmount: Number(sale.change) || 0,
        customerName: sale.customer_name || "Umum",
        paymentMethod: sale.payment_method || "Tunai",
        createdAt: sale.date,
        customer: { name: sale.customer_name || "Umum" },
        items: itemsList.map((item: any) => ({
          qty: item.quantity || item.qty || 1,
          price: Number(item.price) || 0,
          subtotal: (Number(item.quantity || item.qty || 1) * Number(item.price || 0)),
          product: { name: item.name || item.productName || "Barang" }
        }))
      };
    });

    const totalRevenue = sales.reduce((acc, sale) => acc + sale.totalAmount, 0);

    return NextResponse.json({
      success: true,
      data: sales,
      summary: {
        totalTransactions: sales.length,
        totalRevenue,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Gagal mengambil data riwayat penjualan" },
      { status: 500 }
    );
  }
}