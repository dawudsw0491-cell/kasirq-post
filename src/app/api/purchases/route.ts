import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { productId, qtyToAdd } = body;

    if (!productId || !qtyToAdd || Number(qtyToAdd) <= 0) {
      return NextResponse.json(
        { success: false, error: "Produk dan jumlah stok tambahan harus valid" },
        { status: 400 }
      );
    }

    const updatedProduct = await prisma.product.update({
      where: { id: Number(productId) },
      data: {
        stock: {
          increment: Number(qtyToAdd),
        },
      },
    });

    return NextResponse.json({ success: true, data: updatedProduct });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}