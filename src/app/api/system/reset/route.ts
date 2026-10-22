import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function POST() {
  try {
    // Tentukan direktori tempat file data JSON disimpan di server (sesuaikan jika ada)
    const dataDir = path.join(process.cwd(), "data");

    // Jika folder data ada, kosongkan/hapus file JSON di dalamnya
    if (fs.existsSync(dataDir)) {
      const files = fs.readdirSync(dataDir);
      files.forEach((file) => {
        if (file.endsWith(".json")) {
          // Timpa file JSON dengan array kosong []
          fs.writeFileSync(path.join(dataDir, file), JSON.stringify([], null, 2));
        }
      });
    }

    return NextResponse.json({
      success: true,
      message: "Seluruh file database server berhasil dikosongkan total ke 0.",
    });
  } catch (error) {
    console.error("Server Full Reset Error:", error);
    return NextResponse.json(
      { success: false, error: "Gagal menghapus file database server." },
      { status: 500 }
    );
  }
}