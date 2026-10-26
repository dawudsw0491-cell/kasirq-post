import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET: Ambil semua data pelanggan dari Supabase
export async function GET() {
  try {
    const { data: customers, error } = await supabase
      .from("piutang")
      .select("customer_name")
      .order("customer_name", { ascending: true });

    if (error) {
      throw error;
    }

    // Mengambil nama pelanggan yang unik dari tabel piutang/transaksi
    const uniqueCustomers = Array.from(
      new Set((customers || []).map((c) => c.customer_name))
    ).map((name, index) => ({
      id: index + 1,
      name: name || "Umum",
    }));

    return NextResponse.json({ success: true, data: uniqueCustomers });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Gagal mengambil data pelanggan" },
      { status: 500 }
    );
  }
}

// POST: Tambah pelanggan baru (atau update catatan transaksi)
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, phone, address } = body;

    if (!name || name.trim() === "") {
      return NextResponse.json(
        { success: false, error: "Nama pelanggan wajib diisi" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: Date.now(),
        name: name.trim(),
        phone: phone || "-",
        address: address || "-",
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Gagal menyimpan data pelanggan" },
      { status: 500 }
    );
  }
}