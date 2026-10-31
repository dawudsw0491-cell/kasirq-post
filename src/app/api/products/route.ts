import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET: Ambil semua daftar barang dari Supabase (tabel tw_products)
export async function GET() {
  try {
    const { data: products, error } = await supabase
      .from("tw_products")
      .select("*")
      .order("updated_at", { ascending: false });

    if (error) {
      throw error;
    }

    // Mapping data agar sesuai dengan format frontend Anda
    const formattedData = (products || []).map((item) => ({
      id: item.skuCode, // Menggunakan skuCode sebagai id unik
      sku: item.skuCode,
      name: item.name,
      price: item.retailPrice,
      costPrice: item.buyPrice, // Memetakan buyPrice ke costPrice frontend
      stock: item.stock,
      createdAt: item.updated_at,
    }));

    return NextResponse.json({ success: true, data: formattedData });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Gagal mengambil data" },
      { status: 500 }
    );
  }
}

// POST: Tambah barang baru ke Supabase (tabel tw_products)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, sku, price, costPrice, stock } = body;

    if (!name || name.trim() === "") {
      return NextResponse.json(
        { success: false, error: "Nama barang tidak boleh kosong" },
        { status: 400 }
      );
    }

    if (price === undefined || price === "" || isNaN(Number(price))) {
      return NextResponse.json(
        { success: false, error: "Harga jual harus berupa angka valid" },
        { status: 400 }
      );
    }

    const finalSku = sku && sku.trim() !== "" ? sku.trim() : `SKU-${Date.now()}`;

    const { data: newProduct, error } = await supabase
      .from("tw_products")
      .insert([
        {
          skuCode: finalSku,
          name: name.trim(),
          retailPrice: parseFloat(price),
          buyPrice: costPrice ? parseFloat(costPrice) : 0, // Menyimpan ke kolom buyPrice
          stock: stock ? parseFloat(stock) : 0,
          isActive: true,
          status: "active",
        },
      ])
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true, data: newProduct }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Gagal menyimpan ke database" },
      { status: 500 }
    );
  }
}

// DELETE: Hapus barang berdasarkan skuCode dari Supabase
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "ID barang wajib disertakan" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("tw_products")
      .delete()
      .eq("skuCode", id);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true, message: "Barang berhasil dihapus" });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Gagal menghapus barang" },
      { status: 500 }
    );
  }
}
