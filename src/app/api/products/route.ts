import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      orderBy: { createdAt: "desc" },
      include: { category: true },
    });

    return NextResponse.json(products);
  } catch {
    return NextResponse.json(
      { error: "Gagal mengambil data produk." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (
      typeof body.sku !== "string" ||
      !body.sku.trim() ||
      typeof body.name !== "string" ||
      !body.name.trim() ||
      body.purchasePrice == null ||
      body.sellingPrice == null
    ) {
      return NextResponse.json(
        { error: "SKU, nama, harga beli, dan harga jual wajib diisi." },
        { status: 400 }
      );
    }

    const purchasePrice = Number(body.purchasePrice);
    const sellingPrice = Number(body.sellingPrice);
    const stock = body.stock === undefined ? 0 : Number(body.stock);
    const minStock = body.minStock === undefined ? 0 : Number(body.minStock);

    if (
      !Number.isFinite(purchasePrice) ||
      !Number.isFinite(sellingPrice) ||
      !Number.isInteger(stock) ||
      !Number.isInteger(minStock) ||
      purchasePrice < 0 ||
      sellingPrice < 0 ||
      stock < 0 ||
      minStock < 0
    ) {
      return NextResponse.json(
        { error: "Harga dan stok harus berupa angka yang valid." },
        { status: 400 }
      );
    }

    const product = await prisma.product.create({
      data: {
        sku: body.sku.trim(),
        name: body.name.trim(),
        barcode: body.barcode || null,
        description: body.description || null,
        purchasePrice,
        sellingPrice,
        stock,
        minStock,
        categoryId: body.categoryId || null,
      },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error("Gagal membuat produk:", error);

    return NextResponse.json(
      { error: "Gagal membuat produk. Periksa SKU dan koneksi database." },
      { status: 500 }
    );
  }
}