import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { invoiceNo, totalAmount, payAmount, changeAmount, paymentMethod, items } = body;

    const sale = await prisma.sale.create({
      data: {
        invoiceNo: invoiceNo || `INV-${Date.now()}`,
        totalAmount: Number(totalAmount) || 0,
        payAmount: Number(payAmount) || Number(totalAmount) || 0,
        changeAmount: Number(changeAmount) || 0,
        paymentMethod: paymentMethod || "TUNAI",
        items: {
          create: items.map((item: any) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
            costPrice: item.costPrice || 0,
            subtotal: item.quantity * item.price,
          })),
        },
      },
      include: {
        items: true,
      },
    });

    // Update stok barang otomatis
    for (const item of items) {
      await prisma.product.update({
        where: { id: item.productId },
        data: {
          stock: {
            decrement: item.quantity,
          },
        },
      });
    }

    return NextResponse.json({ success: true, data: sale });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}