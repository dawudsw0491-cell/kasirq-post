import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as { prisma: PrismaClient };
export const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// GET: Ambil semua daftar barang
export async function GET() {
  try {
    const products = await prisma.product.findMany({
      include: {
        category: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    return NextResponse.json({ success: true, data: products });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Gagal mengambil data" },
      { status: 500 }
    );
  }
}

// POST: Tambah barang baru
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

    const newProduct = await prisma.product.create({
      data: {
        name: name.trim(),
        sku: finalSku,
        price: parseFloat(price),
        costPrice: costPrice ? parseFloat(costPrice) : 0,
        stock: stock ? parseInt(stock, 10) : 0,
      },
    });

    return NextResponse.json({ success: true, data: newProduct }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Gagal menyimpan ke database" },
      { status: 500 }
    );
  }
}

// DELETE: Hapus barang berdasarkan ID
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

    await prisma.product.delete({
      where: { id: Number(id) },
    });

    return NextResponse.json({ success: true, message: "Barang berhasil dihapus" });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Gagal menghapus barang" },
      { status: 500 }
    );
  }
}