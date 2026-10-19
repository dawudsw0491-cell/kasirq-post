
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(
  request: Request,
  { params }: RouteContext
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const data: Prisma.ProductUpdateInput = {};

    if (body.sku !== undefined) {
      if (typeof body.sku !== "string" || !body.sku.trim()) {
        return NextResponse.json(
          { error: "SKU tidak boleh kosong." },
          { status: 400 }
        );
      }
      data.sku = body.sku.trim();
    }

    if (body.name !== undefined) {
      if (typeof body.name !== "string" || !body.name.trim()) {
        return NextResponse.json(
          { error: "Nama produk tidak boleh kosong." },
          { status: 400 }
        );
      }
      data.name = body.name.trim();
    }

    for (const field of [
      "purchasePrice",
      "sellingPrice",
      "stock",
      "minStock",
    ] as const) {
      if (body[field] === undefined) continue;

      const value = Number(body[field]);
      const isStock = field === "stock" || field === "minStock";

      if (
        !Number.isFinite(value) ||
        value < 0 ||
        (isStock && !Number.isInteger(value))
      ) {
        return NextResponse.json(
          { error: `Nilai ${field} tidak valid.` },
          { status: 400 }
        );
      }

      data[field] = value;
    }

    if (body.barcode !== undefined) {
      data.barcode = body.barcode || null;
    }

    if (body.description !== undefined) {
      data.description = body.description || null;
    }

    if (body.isActive !== undefined) {
      if (typeof body.isActive !== "boolean") {
        return NextResponse.json(
          { error: "Status produk tidak valid." },
          { status: 400 }
        );
      }
      data.isActive = body.isActive;
    }

    if (body.categoryId !== undefined) {
      data.category = body.categoryId
        ? { connect: { id: body.categoryId } }
        : { disconnect: true };
    }

    const product = await prisma.product.update({
      where: { id },
      data,
    });

    return NextResponse.json(product);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return NextResponse.json(
        { error: "Produk tidak ditemukan." },
        { status: 404 }
      );
    }

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "SKU atau barcode sudah digunakan." },
        { status: 409 }
      );
    }

    console.error("Gagal mengubah produk:", error);
    return NextResponse.json(
      { error: "Gagal mengubah produk." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: RouteContext
) {
  try {
    const { id } = await params;

    await prisma.product.delete({
      where: { id },
    });

    return NextResponse.json({
      message: "Produk berhasil dihapus.",
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return NextResponse.json(
        { error: "Produk tidak ditemukan." },
        { status: 404 }
      );
    }

    console.error("Gagal menghapus produk:", error);
    return NextResponse.json(
      {
        error:
          "Produk gagal dihapus. Produk yang sudah digunakan dalam transaksi mungkin tidak bisa dihapus.",
      },
      { status: 500 }
    );
  }
}
