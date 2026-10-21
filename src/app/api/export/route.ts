import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "products";

    let csvContent = "";
    let filename = "export.csv";

    if (type === "products") {
      filename = `Data_Barang_${Date.now()}.csv`;
      const products = await prisma.product.findMany({ include: { category: true } });
      
      csvContent = "ID,SKU,Nama Barang,Kategori,Harga Beli,Harga Jual,Stok\n";
      products.forEach((p) => {
        csvContent += `"${p.id}","${p.sku}","${p.name}","${p.category?.name || "-"}","${p.costPrice}","${p.price}","${p.stock}"\n`;
      });
    } else if (type === "sales") {
      filename = `Data_Penjualan_${Date.now()}.csv`;
      const sales = await prisma.sale.findMany({ include: { customer: true } });

      csvContent = "ID,No Invoice,Tanggal,Pelanggan,Total Belanja,Nominal Bayar,Kembalian\n";
      sales.forEach((s) => {
        csvContent += `"${s.id}","${s.invoiceNo}","${new Date(s.createdAt).toLocaleString("id-ID")}","${s.customer?.name || "Umum"}","${s.totalAmount}","${s.payAmount}","${s.changeAmount}"\n`;
      });
    } else if (type === "customers") {
      filename = `Data_Pelanggan_${Date.now()}.csv`;
      const customers = await prisma.customer.findMany();

      csvContent = "ID,Nama Pelanggan,No Telepon,Alamat\n";
      customers.forEach((c) => {
        csvContent += `"${c.id}","${c.name}","${c.phone || "-"}","${c.address || "-"}"\n`;
      });
    }

    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}