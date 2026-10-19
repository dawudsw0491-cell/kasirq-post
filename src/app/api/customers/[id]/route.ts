
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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

    if (
      typeof body.name !== "string" ||
      body.name.trim().length === 0
    ) {
      return NextResponse.json(
        { error: "Nama pelanggan wajib diisi." },
        { status: 400 }
      );
    }

    if (
      (body.phone != null && typeof body.phone !== "string") ||
      (body.address != null && typeof body.address !== "string")
    ) {
      return NextResponse.json(
        { error: "Nomor telepon atau alamat tidak valid." },
        { status: 400 }
      );
    }

    const customer = await prisma.customer.update({
      where: { id },
      data: {
        name: body.name.trim(),
        phone: body.phone?.trim() || null,
        address: body.address?.trim() || null,
      },
    });

    return NextResponse.json({ customer });
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2025"
    ) {
      return NextResponse.json(
        { error: "Pelanggan tidak ditemukan." },
        { status: 404 }
      );
    }

    console.error("Gagal memperbarui pelanggan:", error);

    return NextResponse.json(
      { error: "Gagal memperbarui pelanggan." },
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

    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        _count: { select: { sales: true } },
      },
    });

    if (!customer) {
      return NextResponse.json(
        { error: "Pelanggan tidak ditemukan." },
        { status: 404 }
      );
    }

    if (customer._count.sales > 0) {
      return NextResponse.json(
        {
          error:
            "Pelanggan sudah memiliki transaksi. Data tidak dapat dihapus.",
        },
        { status: 409 }
      );
    }

    await prisma.customer.delete({ where: { id } });

    return NextResponse.json({
      message: "Pelanggan berhasil dihapus.",
    });
  } catch (error) {
    console.error("Gagal menghapus pelanggan:", error);

    return NextResponse.json(
      { error: "Gagal menghapus pelanggan." },
      { status: 500 }
    );
  }
}
