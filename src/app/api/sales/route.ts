import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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

    // Buat nomor invoice unik
    const invoiceNo = `INV-${Date.now()}`;

    // Jalankan Transaksi Prisma (Kurangi stok & simpan transaksi)
    const sale = await prisma.$transaction(async (tx) => {
      // 1. Catat Transaksi Penjualan Utama
      const newSale = await tx.sale.create({
        data: {
          invoiceNo,
          totalAmount: parseFloat(totalAmount) || 0,
          payAmount: parseFloat(payAmount) || 0,
          changeAmount: parseFloat(changeAmount) || 0,
          // Menyimpan metode pembayaran jika field ada di schema, atau fleksibel
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

      // 2. Potong Stok Inventaris Barang
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
    console.error("API Sales Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Gagal memproses transaksi." },
      { status: 500 }
    );
  }
}