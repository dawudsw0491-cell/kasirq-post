import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET: Ambil semua daftar barang dari Supabase
export async function GET() {
  try {
    const { data: products, error } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    // Mapping data agar sesuai dengan format nama variabel frontend Anda
    const formattedData = (products || []).map((item) => ({
      id: item.id,
      sku: item.sku_code,
      name: item.name,
      price: item.retail_price,
      costPrice: item.wholesale_price,
      stock: item.stock,
      createdAt: item.created_at,
    }));

    return NextResponse.json({ success: true, data: formattedData });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Gagal mengambil data" },
      { status: 500 }
    );
  }
}

// POST: Tambah barang baru ke Supabase
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
      .from("products")
      .insert([
        {
          sku_code: finalSku,
          name: name.trim(),
          retail_price: parseFloat(price),
          wholesale_price: costPrice ? parseFloat(costPrice) : 0,
          stock: stock ? parseInt(stock, 10) : 0,
          is_active: true,
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

// DELETE: Hapus barang berdasarkan ID dari Supabase
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
      .from("products")
      .delete()
      .eq("id", id);

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