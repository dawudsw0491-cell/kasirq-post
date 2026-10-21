import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { invoiceNo, totalAmount, payAmount, changeAmount, paymentMethod, items } = body;

    const parsedTotal = Number(totalAmount) || 0;
    const parsedPay = Number(payAmount) || 0;
    const parsedChange = Number(changeAmount) || 0;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: "Item transaksi tidak boleh kosong" },
        { status: 400 }
      );
    }

    const sale = await prisma.sale.create({
      data: {
        invoiceNo: invoiceNo || `INV-${Date.now()}`,
        totalAmount: parsedTotal,
        payAmount: parsedPay,
        changeAmount: parsedChange,
        paymentMethod: paymentMethod || "TUNAI",
        items: {
          create: items.map((item: any) => ({
            productId: item.productId,
            quantity: Number(item.quantity) || 1,
            price: Number(item.price) || 0,
            costPrice: Number(item.costPrice) || 0,
            subtotal: (Number(item.quantity) || 1) * (Number(item.price) || 0),
          })),
        },
      },
      include: {
        items: true,
      },
    });

    for (const item of items) {
      await prisma.product.update({
        where: { id: item.productId },
        data: {
          stock: {
            decrement: Number(item.quantity) || 1,
          },
        },
      });
    }

    return NextResponse.json({ success: true, data: sale });
  } catch (error: any) {
    console.error("API Sales Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Terjadi kesalahan pada server" },
      { status: 500 }
    );
  }
}