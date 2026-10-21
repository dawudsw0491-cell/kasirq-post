"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Product {
  id: number;
  sku: string;
  name: string;
  price: number;
  stock: number;
}

interface Sale {
  id: number;
  totalAmount: number;
  createdAt: string;
  items: {
    qty: number;
    price: number;
    product: {
      name: string;
    };
  }[];
}

export default function DashboardPage() {
  const [storeName, setStoreName] = useState("TOKO WIWID");
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resProducts, resSales] = await Promise.all([
        fetch("/api/products"),
        fetch("/api/sales"),
      ]);

      const jsonProducts = await resProducts.json();
      const jsonSales = await resSales.json();

      if (jsonProducts.success) setProducts(jsonProducts.data || []);
      if (jsonSales.success) setSales(jsonSales.data || []);
    } catch (err) {
      console.error("Gagal memuat data dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const savedName = localStorage.getItem("tw_store_name");
    if (savedName) setStoreName(savedName);
  }, []);

  // Filter Penjualan Hari Ini
  const todayStr = new Date().toISOString().slice(0, 10);
  const todaySales = sales.filter(
    (s) => new Date(s.createdAt).toISOString().slice(0, 10) === todayStr
  );

  const omsetHariIni = todaySales.reduce((sum, s) => sum + s.totalAmount, 0);
  const totalOmsetSistem = sales.reduce((sum, s) => sum + s.totalAmount, 0);
  const totalTransaksiHariIni = todaySales.length;

  // Stok Kritis (<= 5 pcs)
  const lowStockProducts = products.filter((p) => p.stock <= 5);

  return (
    <main className="tw-dashboard">
      <aside className="tw-sidebar">
        <Link href="/" className="tw-brand">
          <span className="tw-brand-logo">w.</span>
          <span className="tw-brand-copy">
            <strong>{storeName}</strong>
            <small>RETAIL MANAGEMENT</small>
          </span>
        </Link>

        <div className="tw-nav-label">WORKSPACE</div>
        <nav className="tw-nav">
          <Link href="/" className="tw-nav-link tw-nav-active">
            <span className="tw-nav-icon">⌂</span>
            Dashboard
          </Link>
          <Link href="/kasir" className="tw-nav-link">
            <span className="tw-nav-icon">▣</span>
            Kasir
          </Link>
        </nav>

        <div className="tw-nav-label">MANAJEMEN TOKO</div>
        <nav className="tw-nav">
          <Link href="/barang" className="tw-nav-link">
            <span className="tw-nav-icon">▦</span>
            Barang
          </Link>
          <Link href="/kategori" className="tw-nav-link">
            <span className="tw-nav-icon">◇</span>
            Kategori
          </Link>
          <Link href="/pelanggan" className="tw-nav-link">
            <span className="tw-nav-icon">♧</span>
            Pelanggan
          </Link>
          <Link href="/supplier" className="tw-nav-link">
            <span className="tw-nav-icon">⇄</span>
            Supplier
          </Link>
        </nav>

        <div className="tw-nav-label">TRANSAKSI &amp; SISTEM</div>
        <nav className="tw-nav">
          <Link href="/pembelian" className="tw-nav-link">
            <span className="tw-nav-icon">↓</span>
            Pembelian
          </Link>
          <Link href="/penjualan" className="tw-nav-link">
            <span className="tw-nav-icon">↗</span>
            Penjualan
          </Link>
          <Link href="/pengaturan" className="tw-nav-link">
            <span className="tw-nav-icon">⚙</span>
            Pengaturan
          </Link>
        </nav>

        <div className="tw-sidebar-bottom">
          <div className="tw-status-dot" />
          <div>
            <strong>Sistem {storeName}</strong>
            <small>Workspace aktif</small>
          </div>
        </div>
      </aside>

      <div className="tw-main">
        <header className="tw-topbar">
          <div className="tw-breadcrumb">
            Workspace <span>/</span> <strong>Dashboard Utam</strong>
          </div>
          <div className="tw-topbar-right">
            <span className="tw-live-badge">
              <span className="tw-status-dot" />
              SISTEM AKTIF
            </span>
            <div className="tw-avatar">W</div>
          </div>
        </header>

        <div className="tw-content">
          {/* Akses Pintas Cepat */}
          <div style={{ display: "flex", gap: "12px", marginBottom: "20px" }}>
            <Link href="/kasir" className="tw-btn tw-btn-primary" style={{ padding: "12px 20px" }}>
              ▣ Buka Kasir POS ↗
            </Link>
            <Link href="/barang" className="tw-btn" style={{ padding: "12px 20px", background: "#f1f5f9" }}>
              + Tambah / Kelola Barang
            </Link>
            <Link href="/penjualan" className="tw-btn" style={{ padding: "12px 20px", background: "#f1f5f9" }}>
              📊 Laporan Penjualan
            </Link>
          </div>

          {/* Grid Ringkasan KPI Dashboard */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px", marginBottom: "24px" }}>
            <div className="tw-card">
              <span style={{ fontSize: "0.85rem", color: "var(--tw-muted)" }}>Omset Hari Ini</span>
              <h2 style={{ fontSize: "1.6rem", color: "#16a34a", margin: "8px 0 0 0" }}>
                Rp {omsetHariIni.toLocaleString("id-ID")}
              </h2>
            </div>

            <div className="tw-card">
              <span style={{ fontSize: "0.85rem", color: "var(--tw-muted)" }}>Transaksi Hari Ini</span>
              <h2 style={{ fontSize: "1.6rem", margin: "8px 0 0 0" }}>
                {totalTransaksiHariIni} Nota
              </h2>
            </div>

            <div className="tw-card">
              <span style={{ fontSize: "0.85rem", color: "var(--tw-muted)" }}>Total Omset Keseluruhan</span>
              <h2 style={{ fontSize: "1.6rem", color: "var(--tw-primary)", margin: "8px 0 0 0" }}>
                Rp {totalOmsetSistem.toLocaleString("id-ID")}
              </h2>
            </div>

            <div className="tw-card">
              <span style={{ fontSize: "0.85rem", color: "var(--tw-muted)" }}>Total Katalog Barang</span>
              <h2 style={{ fontSize: "1.6rem", margin: "8px 0 0 0" }}>
                {products.length} Item
              </h2>
            </div>
          </div>

          {/* Grid Dua Kolom: Widget Stok Kritis & Transaksi Terakhir */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
            {/* Widget Stok Kritis */}
            <div className="tw-card">
              <div className="tw-card-header" style={{ marginBottom: "12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3 className="tw-card-title" style={{ color: lowStockProducts.length > 0 ? "#dc2626" : "inherit" }}>
                  ⚠️ Peringatan Stok Kritis (&le; 5 pcs)
                </h3>
                <Link href="/barang" style={{ fontSize: "0.8rem", color: "var(--tw-primary)" }}>
                  Lihat Semua &rarr;
                </Link>
              </div>

              {loading ? (
                <p>Memuat data stok...</p>
              ) : lowStockProducts.length === 0 ? (
                <p style={{ color: "#16a34a", padding: "10px 0", fontSize: "0.9rem" }}>
                  ✅ Seluruh stok barang dalam kondisi aman.
                </p>
              ) : (
                <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                  {lowStockProducts.map((p) => (
                    <li
                      key={p.id}
                      style={{
                        display: "flex",
                        justifySpaceBetween: "space-between",
                        padding: "8px 0",
                        borderBottom: "1px solid var(--tw-border)",
                      }}
                    >
                      <span><strong>{p.name}</strong> ({p.sku})</span>
                      <span style={{ color: "#dc2626", fontWeight: "bold" }}>Sisa: {p.stock} pcs</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Widget Transaksi Terakhir */}
            <div className="tw-card">
              <div className="tw-card-header" style={{ marginBottom: "12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3 className="tw-card-title">🧾 Transaksi Terbaru</h3>
                <Link href="/penjualan" style={{ fontSize: "0.8rem", color: "var(--tw-primary)" }}>
                  Laporan Lengkap &rarr;
                </Link>
              </div>

              {loading ? (
                <p>Memuat transaksi...</p>
              ) : sales.length === 0 ? (
                <p style={{ color: "var(--tw-muted)", padding: "10px 0", fontSize: "0.9rem" }}>
                  Belum ada transaksi penjualan yang tercatat.
                </p>
              ) : (
                <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                  {sales.slice(0, 5).map((s) => (
                    <li
                      key={s.id}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        padding: "8px 0",
                        borderBottom: "1px solid var(--tw-border)",
                        fontSize: "0.9rem",
                      }}
                    >
                      <div>
                        <strong>{new Date(s.createdAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}</strong> - {s.items.length} item
                      </div>
                      <div style={{ fontWeight: "bold", color: "#16a34a" }}>
                        Rp {s.totalAmount.toLocaleString("id-ID")}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}