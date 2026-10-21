import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET: Mengambil seluruh riwayat penjualan
export async function GET() {
  try {
    const sales = await prisma.sale.findMany({
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ success: true, data: sales });
  } catch (error: any) {
    console.error("API Sales GET Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Gagal mengambil data penjualan." },
      { status: 500 }
    );
  }
}

// POST: Membuat transaksi penjualan baru
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { items, totalAmount, payAmount, changeAmount, paymentMethod } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: "Keranjang belanja kosong." },
        { status: 400 }
      );
    }

    const invoiceNo = `INV-${Date.now()}`;

    const sale = await prisma.$transaction(async (tx) => {
      // 1. Simpan Transaksi Penjualan Utama
      const newSale = await tx.sale.create({
        data: {
          invoiceNo,
          totalAmount: parseFloat(totalAmount) || 0,
          payAmount: parseFloat(payAmount) || 0,
          changeAmount: parseFloat(changeAmount) || 0,
          items: {
            create: items.map((item: any) => ({
              productId: item.id,
              qty: item.qty,
              price: item.price,
              subtotal: item.price * item.qty,
            })),
          },
        },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      });

      // 2. Kurangi Stok Produk Terjual
      for (const item of items) {
        await tx.product.update({
          where: { id: item.id },
          data: {
            stock: {
              decrement: item.qty,
            },
          },
        });
      }

      return newSale;
    });

    return NextResponse.json({
      success: true,
      data: {
        ...sale,
        paymentMethod: paymentMethod || "Tunai",
      },
    });
  } catch (error: any) {
    console.error("API Sales POST Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Gagal memproses transaksi." },
      { status: 500 }
    );
  }
}