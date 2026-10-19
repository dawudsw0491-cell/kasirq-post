
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { StockMovementType } from "@prisma/client";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(
  _request: Request,
  { params }: RouteContext
) {
  try {
    const { id } = await params;

    const product = await prisma.product.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!product) {
      return NextResponse.json(
        { error: "Produk tidak ditemukan." },
        { status: 404 }
      );
    }

    const movements = await prisma.stockMovement.findMany({
      where: { productId: id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ movements });
  } catch (error) {
    console.error("Gagal mengambil riwayat stok:", error);

    return NextResponse.json(
      { error: "Gagal mengambil riwayat stok." },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: RouteContext
) {
  try {
    const { id } = await params;
    const body = await request.json();

    if (
      typeof body.type !== "string" ||
      !["IN", "OUT", "ADJUSTMENT"].includes(body.type)
    ) {
      return NextResponse.json(
        { error: "Jenis pergerakan stok tidak valid." },
        { status: 400 }
      );
    }

    const isAdjustment = body.type === "ADJUSTMENT";
    const amount = Number(
      isAdjustment ? body.targetStock : body.quantity
    );

    if (
      !Number.isSafeInteger(amount) ||
      amount < 0 ||
      (!isAdjustment && amount === 0)
    ) {
      return NextResponse.json(
        { error: "Jumlah atau target stok tidak valid." },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({
        where: { id },
      });

      if (!product) {
        return { error: "NOT_FOUND" as const };
      }

      const delta =
        body.type === "IN"
          ? amount
          : body.type === "OUT"
            ? -amount
            : amount - product.stock;

      if (product.stock + delta < 0) {
        return { error: "INSUFFICIENT_STOCK" as const };
      }

      if (delta === 0) {
        return { error: "NO_CHANGE" as const };
      }

      const updatedProduct = await tx.product.update({
        where: { id },
        data: { stock: { increment: delta } },
      });

      const movement = await tx.stockMovement.create({
        data: {
          productId: id,
          type: body.type as StockMovementType,
          quantity: delta,
          note:
            typeof body.note === "string"
              ? body.note.trim() || null
              : null,
        },
      });

      return { product: updatedProduct, movement };
    });

    if ("error" in result) {
      switch (result.error) {
        case "NOT_FOUND":
          return NextResponse.json(
            { error: "Produk tidak ditemukan." },
            { status: 404 }
          );

        case "INSUFFICIENT_STOCK":
          return NextResponse.json(
            { error: "Stok tidak mencukupi." },
            { status: 400 }
          );

        case "NO_CHANGE":
          return NextResponse.json(
            { error: "Stok tidak mengalami perubahan." },
            { status: 400 }
          );
      }
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Gagal memperbarui stok:", error);

    return NextResponse.json(
      { error: "Gagal memperbarui stok barang." },
      { status: 500 }
    );
  }
}
