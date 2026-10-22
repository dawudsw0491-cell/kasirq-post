import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const sales = await prisma.sale.findMany({
      include: {
        items: {
          include: {
            product: true, // Pastikan relasi product disertakan agar tidak undefined
          },
        },
        customer: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    return NextResponse.json({ success: true, data: sales });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { invoiceNo, totalAmount, payAmount, changeAmount, customerId, items } = body;

    const parsedTotal = Number(totalAmount) || 0;
    const parsedPay = Number(payAmount) || 0;
    const parsedChange = Number(changeAmount) || 0;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: "Item transaksi tidak boleh kosong" },
        { status: 400 }
      );
    }

    const sale = await prisma.$transaction(async (tx) => {
      const newSale = await tx.sale.create({
        data: {
          invoiceNo: invoiceNo || `INV-${Date.now()}`,
          totalAmount: parsedTotal,
          payAmount: parsedPay,
          changeAmount: parsedChange,
          customerId: customerId ? Number(customerId) : null,
          items: {
            create: items.map((item: any) => {
              const itemQty = Number(item.quantity || item.qty) || 1;
              const itemPrice = Number(item.price) || 0;
              return {
                productId: Number(item.productId),
                qty: itemQty,
                price: itemPrice,
                subtotal: itemQty * itemPrice,
              };
            }),
          },
        },
        include: {
          items: true,
        },
      });

      for (const item of items) {
        const itemQty = Number(item.quantity || item.qty) || 1;
        await tx.product.update({
          where: { id: Number(item.productId) },
          data: {
            stock: {
              decrement: itemQty,
            },
          },
        });
      }

      return newSale;
    });

    return NextResponse.json({ success: true, data: sale });
  } catch (error: any) {
    console.error("API Sales Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Terjadi kesalahan pada server" },
      { status: 500 }
    );
  }
}