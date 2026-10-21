"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Product {
  id: number;
  sku: string;
  name: string;
  price: number;
  costPrice?: number;
  stock: number;
}

export default function Home() {
  const [storeName, setStoreName] = useState("TOKO WIWID");
  const [products, setProducts] = useState<Product[]>([]);
  const [todaySales, setTodaySales] = useState(0);
  const [todayTransactions, setTodayTransactions] = useState(0);
  const [totalOmset, setTotalOmset] = useState(0);

  useEffect(() => {
    const savedName = localStorage.getItem("tw_store_name");
    if (savedName) setStoreName(savedName);

    // Fetch Products
    fetch("/api/products")
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setProducts(json.data || []);
      })
      .catch((err) => console.error(err));

    // Fetch Sales Summary
    fetch("/api/sales")
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data) {
          const sales = json.data;
          const todayStr = new Date().toISOString().split("T")[0];

          let todaySum = 0;
          let todayCount = 0;
          let totalSum = 0;

          sales.forEach((s: any) => {
            totalSum += s.totalAmount || 0;
            const saleDate = new Date(s.createdAt).toISOString().split("T")[0];
            if (saleDate === todayStr) {
              todaySum += s.totalAmount || 0;
              todayCount += 1;
            }
          });

          setTodaySales(todaySum);
          setTodayTransactions(todayCount);
          setTotalOmset(totalSum);
        }
      })
      .catch((err) => console.error(err));
  }, []);

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
          <Link href="/keuangan" className="tw-nav-link">
            <span className="tw-nav-icon">💰</span>
            Keuangan
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
            Workspace <span>/</span> <strong>Dashboard Utamain</strong>
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
          {/* CARDS RINGKASAN */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px", marginBottom: "24px" }}>
            <div className="tw-card">
              <span style={{ fontSize: "0.85rem", color: "var(--tw-muted)" }}>Omset Hari Ini</span>
              <h2 style={{ fontSize: "1.6rem", color: "var(--tw-primary)", margin: "8px 0 0 0" }}>
                Rp {todaySales.toLocaleString("id-ID")}
              </h2>
            </div>
            <div className="tw-card">
              <span style={{ fontSize: "0.85rem", color: "var(--tw-muted)" }}>Transaksi Hari Ini</span>
              <h2 style={{ fontSize: "1.6rem", margin: "8px 0 0 0" }}>{todayTransactions} Transaksi</h2>
            </div>
            <div className="tw-card">
              <span style={{ fontSize: "0.85rem", color: "var(--tw-muted)" }}>Total Omset Sistem</span>
              <h2 style={{ fontSize: "1.6rem", color: "#16a34a", margin: "8px 0 0 0" }}>
                Rp {totalOmset.toLocaleString("id-ID")}
              </h2>
            </div>
            <div className="tw-card">
              <span style={{ fontSize: "0.85rem", color: "var(--tw-muted)" }}>Total Katalog Barang</span>
              <h2 style={{ fontSize: "1.6rem", margin: "8px 0 0 0" }}>{products.length} Produk</h2>
            </div>
          </div>

          {/* PERINGATAN STOK KRITIS & NAVIGASI CEPAT */}
          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "20px" }}>
            <div className="tw-card">
              <h3 className="tw-card-title" style={{ marginBottom: "16px", color: "#dc2626" }}>
                ⚠️ Peringatan Stok Kritis (≤ 5 pcs)
              </h3>
              {lowStockProducts.length === 0 ? (
                <p style={{ color: "var(--tw-muted)" }}>Semua stok barang dalam kondisi aman.</p>
              ) : (
                <table className="tw-table" style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: "2px solid var(--tw-border)", textAlign: "left" }}>
                      <th style={{ padding: "8px" }}>SKU</th>
                      <th style={{ padding: "8px" }}>Nama Barang</th>
                      <th style={{ padding: "8px", textAlign: "right" }}>Stok Sisa</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lowStockProducts.map((p) => (
                      <tr key={p.id} style={{ borderBottom: "1px solid var(--tw-border)" }}>
                        <td style={{ padding: "8px", fontSize: "0.85rem" }}>{p.sku}</td>
                        <td style={{ padding: "8px", fontWeight: "bold" }}>{p.name}</td>
                        <td style={{ padding: "8px", textAlign: "right", color: "#dc2626", fontWeight: "bold" }}>
                          {p.stock} pcs
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="tw-card" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <h3 className="tw-card-title">Navigasi Pintas Operasional</h3>
              <Link href="/kasir" className="tw-btn tw-btn-primary" style={{ padding: "12px", textAlign: "center", textDecoration: "none" }}>
                ▣ Buka Aplikasi Kasir (POS) ↗
              </Link>
              <Link href="/barang" className="tw-btn tw-btn-secondary" style={{ padding: "12px", textAlign: "center", textDecoration: "none" }}>
                ▦ Kelola Stok &amp; Harga Barang ↗
              </Link>
              <Link href="/keuangan" className="tw-btn tw-btn-secondary" style={{ padding: "12px", textAlign: "center", textDecoration: "none" }}>
                💰 Buka Laporan Keuangan &amp; Arus Kas ↗
              </Link>
              <Link href="/penjualan" className="tw-btn tw-btn-secondary" style={{ padding: "12px", textAlign: "center", textDecoration: "none" }}>
                ↗ Lihat Riwayat Laporan Penjualan ↗
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}