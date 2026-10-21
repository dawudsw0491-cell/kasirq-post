"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

const menuConfig: Record<
  string,
  { title: string; endpoint: string; description: string }
> = {
  barang: {
    title: "Barang",
    endpoint: "/api/products",
    description: "Daftar barang, harga jual, dan stok.",
  },
  kategori: {
    title: "Kategori",
    endpoint: "/api/categories",
    description: "Daftar kategori barang.",
  },
  pelanggan: {
    title: "Pelanggan",
    endpoint: "/api/customers",
    description: "Data pelanggan toko.",
  },
  supplier: {
    title: "Supplier",
    endpoint: "/api/suppliers",
    description: "Data pemasok barang.",
  },
  pembelian: {
    title: "Pembelian",
    endpoint: "/api/purchases",
    description: "Riwayat pembelian barang.",
  },
  penjualan: {
    title: "Penjualan",
    endpoint: "/api/sales",
    description: "Riwayat transaksi penjualan.",
  },
};

function formatValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "-";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

export default function MenuPage() {
  const params = useParams<{ menu: string }>();
  const slug = params.menu;
  const config = menuConfig[slug];

  const [items, setItems] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!config) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function load() {
      try {
        const response = await fetch(config.endpoint);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Gagal memuat data.");
        }

        if (!cancelled) {
          const rows = Array.isArray(data)
            ? data
            : Array.isArray(data.items)
              ? data.items
              : [];
          setItems(rows);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Gagal memuat data."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [config]);

  if (!config) {
    return (
      <main className="min-h-screen bg-slate-50 p-8">
        <div className="mx-auto max-w-3xl rounded-2xl bg-white p-8">
          <h1 className="text-2xl font-bold">Halaman tidak ditemukan</h1>
          <Link href="/" className="mt-4 inline-block text-emerald-700">
            ← Kembali ke dashboard
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white px-5 py-5 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <Link href="/" className="text-sm font-medium text-emerald-700">
            ← Dashboard
          </Link>
          <h1 className="mt-2 text-2xl font-bold">Toko Wiwid · {config.title}</h1>
          <p className="mt-1 text-sm text-slate-500">{config.description}</p>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-bold">Daftar {config.title}</h2>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm text-emerald-800">
              {items.length} data
            </span>
          </div>

          {loading && (
            <p className="py-8 text-sm text-slate-500">Memuat data...</p>
          )}

          {!loading && error && (
            <div className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-700">
              {error}
              <p className="mt-2">
                Pastikan database PostgreSQL sudah dikonfigurasi dan API dapat
                diakses.
              </p>
            </div>
          )}

          {!loading && !error && items.length === 0 && (
            <p className="mt-5 rounded-xl bg-slate-50 p-6 text-sm text-slate-500">
              Belum ada data untuk ditampilkan.
            </p>
          )}

          {!loading && !error && items.length > 0 && (
            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[600px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    {Object.keys(items[0]).map((key) => (
                      <th key={key} className="px-4 py-3 font-semibold">
                        {key}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => (
                    <tr
                      key={String(item.id ?? index)}
                      className="border-b border-slate-100"
                    >
                      {Object.keys(items[0]).map((key) => (
                        <td
                          key={key}
                          className="max-w-xs px-4 py-3 align-top"
                        >
                          <span className="line-clamp-3 break-words">
                            {formatValue(item[key])}
                          </span>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
