import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const CANCELLED_STATUS = "CANCELLED";
const STOCK_OUT_TYPE = "OUT";

export async function GET(
  _request: Request,
  context: RouteContext
) {
  try {
    const { id } = await context.params;

    const purchase = await prisma.purchase.findUnique({
      where: { id },
      include: {
        supplier: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!purchase) {
      return NextResponse.json(
        { error: "Transaksi pembelian tidak ditemukan." },
        { status: 404 }
      );
    }

    return NextResponse.json({ purchase });
  } catch (error) {
    console.error("Gagal mengambil detail pembelian:", error);

    return NextResponse.json(
      { error: "Gagal mengambil detail pembelian." },
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

    const purchase = await prisma.$transaction(async (tx) => {
      const existing = await tx.purchase.findUnique({
        where: { id },
        include: { items: true },
      });

      if (!existing) {
        throw new Error("PURCHASE_NOT_FOUND");
      }

      if (existing.status === CANCELLED_STATUS) {
        throw new Error("PURCHASE_ALREADY_CANCELLED");
      }

      for (const item of existing.items) {
        const result = await tx.product.updateMany({
          where: {
            id: item.productId,
            stock: { gte: item.quantity },
          },
          data: {
            stock: { decrement: item.quantity },
          },
        });

        if (result.count === 0) {
          throw new Error("INSUFFICIENT_STOCK");
        }

        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            type: STOCK_OUT_TYPE,
            quantity: -item.quantity,
            note: `Pembatalan pembelian ${existing.invoiceNumber}`,
          },
        });
      }

      return tx.purchase.update({
        where: { id },
        data: { status: CANCELLED_STATUS },
        include: {
          supplier: true,
          items: {
            include: { product: true },
          },
        },
      });
    });

    return NextResponse.json({ purchase });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "PURCHASE_NOT_FOUND") {
        return NextResponse.json(
          { error: "Transaksi pembelian tidak ditemukan." },
          { status: 404 }
        );
      }

      if (error.message === "PURCHASE_ALREADY_CANCELLED") {
        return NextResponse.json(
          { error: "Transaksi pembelian sudah dibatalkan." },
          { status: 409 }
        );
      }

      if (error.message === "INSUFFICIENT_STOCK") {
        return NextResponse.json(
          {
            error:
              "Pembelian tidak dapat dibatalkan karena stok barang sudah tidak mencukupi.",
          },
          { status: 409 }
        );
      }
    }

    console.error("Gagal membatalkan pembelian:", error);

    return NextResponse.json(
      { error: "Gagal membatalkan transaksi pembelian." },
      { status: 500 }
    );
  }
}
