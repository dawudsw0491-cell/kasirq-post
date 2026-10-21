import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const CANCELLED_STATUS = "CANCELLED";
const STOCK_IN_TYPE = "IN";

export async function GET(
  _request: Request,
  context: RouteContext
) {
  try {
    const { id } = await context.params;

    const sale = await prisma.sale.findUnique({
      where: { id },
      include: {
        customer: true,
        items: { include: { product: true } },
      },
    });

    if (!sale) {
      return NextResponse.json(
        { error: "Transaksi penjualan tidak ditemukan." },
        { status: 404 }
      );
    }

    return NextResponse.json({ sale });
  } catch (error) {
    console.error("Gagal mengambil detail penjualan:", error);

    return NextResponse.json(
      { error: "Gagal mengambil detail penjualan." },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    const body = await request.json();

    if (body.status !== CANCELLED_STATUS) {
      return NextResponse.json(
        { error: "Status yang diizinkan hanya CANCELLED." },
        { status: 400 }
      );
    }

    const sale = await prisma.$transaction(async (tx) => {
      const existing = await tx.sale.findUnique({
        where: { id },
        include: { items: true },
      });

      if (!existing) {
        throw new Error("SALE_NOT_FOUND");
      }

      if (existing.status === CANCELLED_STATUS) {
        throw new Error("SALE_ALREADY_CANCELLED");
      }

      for (const item of existing.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });

        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            type: STOCK_IN_TYPE,
            quantity: item.quantity,
            note: `Pembatalan penjualan ${existing.invoiceNumber}`,
          },
        });
      }

      return tx.sale.update({
        where: { id },
        data: { status: CANCELLED_STATUS },
        include: {
          customer: true,
          items: { include: { product: true } },
        },
      });
    });

    return NextResponse.json({ sale });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "SALE_NOT_FOUND") {
        return NextResponse.json(
          { error: "Transaksi penjualan tidak ditemukan." },
          { status: 404 }
        );
      }

      if (error.message === "SALE_ALREADY_CANCELLED") {
        return NextResponse.json(
          { error: "Transaksi ini sudah dibatalkan." },
          { status: 409 }
        );
      }
    }

    console.error("Gagal membatalkan penjualan:", error);

    return NextResponse.json(
      { error: "Gagal membatalkan transaksi penjualan." },
      { status: 500 }
    );
  }
}
