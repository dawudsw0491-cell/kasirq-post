import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// PUT: Update Produk
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id);
    const body = await req.json();
    const { sku, name, price, stock } = body;

    const updated = await prisma.product.update({
      where: { id },
      data: {
        sku,
        name,
        price: parseFloat(price) || 0,
        stock: parseInt(stock) || 0,
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE: Hapus Produk
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id);
    await prisma.product.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}