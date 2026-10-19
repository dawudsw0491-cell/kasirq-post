import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    return NextResponse.json(categories);
  } catch (error) {
    console.error("Gagal mengambil kategori:", error);

    return NextResponse.json(
      { error: "Gagal mengambil data kategori." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (typeof body.name !== "string" || !body.name.trim()) {
      return NextResponse.json(
        { error: "Nama kategori wajib diisi." },
        { status: 400 }
      );
    }

    const category = await prisma.category.create({
      data: { name: body.name.trim() },
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error("Gagal membuat kategori:", error);

    return NextResponse.json(
      { error: "Gagal membuat kategori. Nama mungkin sudah digunakan." },
      { status: 409 }
    );
  }
}