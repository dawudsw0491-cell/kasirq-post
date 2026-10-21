import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { items, totalAmount, payAmount, changeAmount, customerId } = body;

    if (!items || items.length === 0) {
      return NextResponse.json({ success: false, error: "Keranjang belanja kosong" }, { status: 400 });
    }

    const invoiceNo = `INV-${Date.now()}`;

    // Jalankan transaksi: Simpan Penjualan & Kurangi Stok Barang
    const sale = await prisma.$transaction(async (tx) => {
      const newSale = await tx.sale.create({
        data: {
          invoiceNo,
          totalAmount: Number(totalAmount),
          payAmount: Number(payAmount),
          changeAmount: Number(changeAmount),
          customerId: customerId ? Number(customerId) : null,
          items: {
            create: items.map((item: any) => ({
              productId: Number(item.id),
              qty: Number(item.qty),
              price: Number(item.price),
              subtotal: Number(item.price * item.qty),
            })),
          },
        },
        include: {
          items: {
            include: { product: true },
          },
          customer: true,
        },
      });

      // Update stok produk
      for (const item of items) {
        await tx.product.update({
          where: { id: Number(item.id) },
          data: {
            stock: {
              decrement: Number(item.qty),
            },
          },
        });
      }

      return newSale;
    });

    return NextResponse.json({ success: true, data: sale }, { status: 201 });
  } catch (error: any) {
    console.error("Error Transaksi:", error);
    return NextResponse.json({ success: false, error: error.message || "Gagal memproses transaksi" }, { status: 500 });
  }
}