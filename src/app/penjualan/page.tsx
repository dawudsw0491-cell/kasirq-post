"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface SaleItem {
  id: number;
  qty: number;
  price: number;
  subtotal: number;
  product: {
    name: string;
    sku: string;
  };
}

interface Sale {
  id: number;
  invoiceNo: string;
  totalAmount: number;
  payAmount: number;
  changeAmount: number;
  paymentMethod?: string;
  createdAt: string;
  items: SaleItem[];
}

export default function PenjualanPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [storeName, setStoreName] = useState("TOKO WIWID");

  const fetchSales = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/sales");
      const json = await res.json();
      if (json.success) setSales(json.data);
    } catch (err) {
      console.error("Gagal memuat laporan penjualan:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
    const savedName = localStorage.getItem("tw_store_name");
    if (savedName) setStoreName(savedName);
  }, []);

  // Ringkasan Statistik Laporan
  const totalOmset = sales.reduce((sum, s) => sum + s.totalAmount, 0);
  const totalTransaksi = sales.length;
  const qrisTotal = sales.filter((s) => s.paymentMethod === "QRIS").reduce((sum, s) => sum + s.totalAmount, 0);
  const tunaiTotal = sales.filter((s) => !s.paymentMethod || s.paymentMethod === "Tunai").reduce((sum, s) => sum + s.totalAmount, 0);
  const debitTotal = sales.filter((s) => s.paymentMethod === "Debit").reduce((sum, s) => sum + s.totalAmount, 0);

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
          <Link href="/" className="tw-nav-link">
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
          <Link href="/penjualan" className="tw-nav-link tw-nav-active">
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
            Transaksi &amp; Sistem <span>/</span> <strong>Laporan Penjualan</strong>
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
          {/* Grid Ringkasan KPI Laporan */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "20px" }}>
            <div className="tw-card">
              <span style={{ fontSize: "0.85rem", color: "var(--tw-muted)" }}>Total Omset Penjualan</span>
              <h2 style={{ fontSize: "1.5rem", color: "var(--tw-primary)", margin: "8px 0 0 0" }}>
                Rp {totalOmset.toLocaleString("id-ID")}
              </h2>
            </div>
            <div className="tw-card">
              <span style={{ fontSize: "0.85rem", color: "var(--tw-muted)" }}>Total Transaksi</span>
              <h2 style={{ fontSize: "1.5rem", margin: "8px 0 0 0" }}>{totalTransaksi} Nota</h2>
            </div>
            <div className="tw-card">
              <span style={{ fontSize: "0.85rem", color: "var(--tw-muted)" }}>Pemasukan Tunai</span>
              <h2 style={{ fontSize: "1.5rem", color: "#16a34a", margin: "8px 0 0 0" }}>
                Rp {tunaiTotal.toLocaleString("id-ID")}
              </h2>
            </div>
            <div className="tw-card">
              <span style={{ fontSize: "0.85rem", color: "var(--tw-muted)" }}>Pemasukan QRIS &amp; EDC</span>
              <h2 style={{ fontSize: "1.5rem", color: "#0284c7", margin: "8px 0 0 0" }}>
                Rp {(qrisTotal + debitTotal).toLocaleString("id-ID")}
              </h2>
            </div>
          </div>

          {/* Tabel Riwayat Penjualan */}
          <div className="tw-card">
            <div className="tw-card-header" style={{ marginBottom: "16px" }}>
              <h2 className="tw-card-title">Riwayat Transaksi Penjualan</h2>
            </div>

            {loading ? (
              <p>Memuat laporan...</p>
            ) : sales.length === 0 ? (
              <p style={{ textAlign: "center", color: "var(--tw-muted)", padding: "20px" }}>Belum ada data transaksi penjualan.</p>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table className="tw-table" style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: "2px solid var(--tw-border)", textAlign: "left" }}>
                      <th style={{ padding: "10px" }}>No. Invoice</th>
                      <th style={{ padding: "10px" }}>Tanggal &amp; Waktu</th>
                      <th style={{ padding: "10px" }}>Item Terjual</th>
                      <th style={{ padding: "10px" }}>Metode</th>
                      <th style={{ padding: "10px", textAlign: "right" }}>Total Transaksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sales.map((sale) => (
                      <tr key={sale.id} style={{ borderBottom: "1px solid var(--tw-border)" }}>
                        <td style={{ padding: "10px", fontWeight: "bold" }}>{sale.invoiceNo}</td>
                        <td style={{ padding: "10px", fontSize: "0.85rem" }}>
                          {new Date(sale.createdAt).toLocaleString("id-ID")}
                        </td>
                        <td style={{ padding: "10px", fontSize: "0.85rem" }}>
                          {sale.items.map((it) => `${it.product.name} (${it.qty})`).join(", ")}
                        </td>
                        <td style={{ padding: "10px" }}>
                          <span
                            style={{
                              padding: "2px 8px",
                              borderRadius: "12px",
                              fontSize: "0.75rem",
                              fontWeight: "bold",
                              background: sale.paymentMethod === "QRIS" ? "#e0f2fe" : sale.paymentMethod === "Debit" ? "#fef3c7" : "#dcfce7",
                              color: sale.paymentMethod === "QRIS" ? "#0369a1" : sale.paymentMethod === "Debit" ? "#b45309" : "#15803d",
                            }}
                          >
                            {sale.paymentMethod || "Tunai"}
                          </span>
                        </td>
                        <td style={{ padding: "10px", textAlign: "right", fontWeight: "bold" }}>
                          Rp {sale.totalAmount.toLocaleString("id-ID")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}