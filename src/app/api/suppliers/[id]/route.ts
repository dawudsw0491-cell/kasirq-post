import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(
  request: Request,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    const body = await request.json();

    if (
      body.name !== undefined &&
      (typeof body.name !== "string" || body.name.trim().length === 0)
    ) {
      return NextResponse.json(
        { error: "Nama supplier tidak boleh kosong." },
        { status: 400 }
      );
    }

    if (
      (body.phone !== undefined &&
        body.phone !== null &&
        typeof body.phone !== "string") ||
      (body.address !== undefined &&
        body.address !== null &&
        typeof body.address !== "string")
    ) {
      return NextResponse.json(
        { error: "Nomor telepon atau alamat tidak valid." },
        { status: 400 }
      );
    }

    const supplier = await prisma.supplier.update({
      where: { id },
      data: {
        ...(body.name !== undefined && { name: body.name.trim() }),
        ...(body.phone !== undefined && {
          phone: body.phone?.trim() || null,
        }),
        ...(body.address !== undefined && {
          address: body.address?.trim() || null,
        }),
      },
    });

    return NextResponse.json({ supplier });
  } catch (error) {
    console.error("Gagal memperbarui supplier:", error);

    return NextResponse.json(
      { error: "Gagal memperbarui supplier. Pastikan data supplier tersedia." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  context: RouteContext
) {
  try {
    const { id } = await context.params;

    const supplier = await prisma.supplier.findUnique({
      where: { id },
      include: {
        _count: {
          select: { purchases: true },
        },
      },
    });

    if (!supplier) {
      return NextResponse.json(
        { error: "Supplier tidak ditemukan." },
        { status: 404 }
      );
    }

    if (supplier._count.purchases > 0) {
      return NextResponse.json(
        {
          error:
            "Supplier tidak bisa dihapus karena sudah memiliki transaksi pembelian.",
        },
        { status: 409 }
      );
    }

    await prisma.supplier.delete({
      where: { id },
    });

    return NextResponse.json({
      message: "Supplier berhasil dihapus.",
    });
  } catch (error) {
    console.error("Gagal menghapus supplier:", error);

    return NextResponse.json(
      { error: "Gagal menghapus supplier." },
      { status: 500 }
    );
  }
}
