"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function DashboardPage() {
  const [storeName, setStoreName] = useState("TOKO WIWID");
  const [loading, setLoading] = useState(true);
  
  // Metrics Monitoring
  const [summary, setSummary] = useState({
    totalRevenue: 0,
    totalTransactions: 0,
    totalProducts: 0,
    totalStock: 0,
    lowStockCount: 0,
  });

  const [recentSales, setRecentSales] = useState<any[]>([]);

  useEffect(() => {
    // 1. Read Pengaturan dari LocalStorage
    const savedName = localStorage.getItem("tw_store_name");
    if (savedName) setStoreName(savedName);

    const savedTheme = localStorage.getItem("tw_theme_mode");
    if (savedTheme === "dark") {
      document.body.classList.add("dark-mode");
      document.documentElement.classList.add("dark");
    } else {
      document.body.classList.remove("dark-mode");
      document.documentElement.classList.remove("dark");
    }

    // 2. Fetch Data Monitoring Real-time
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        // Fetch Produk & Stok
        const resProducts = await fetch("/api/products");
        const jsonProducts = await resProducts.json();

        // Fetch Riwayat Penjualan
        const resSales = await fetch("/api/sales/history");
        const jsonSales = await resSales.json();

        let totalProducts = 0;
        let totalStock = 0;
        let lowStockCount = 0;

        if (jsonProducts.success && Array.isArray(jsonProducts.data)) {
          totalProducts = jsonProducts.data.length;
          totalStock = jsonProducts.data.reduce((acc: number, p: any) => acc + (p.stock || 0), 0);
          lowStockCount = jsonProducts.data.filter((p: any) => p.stock <= 5).length;
        }

        let totalRevenue = 0;
        let totalTransactions = 0;
        let recent: any[] = [];

        if (jsonSales.success && Array.isArray(jsonSales.data)) {
          totalTransactions = jsonSales.data.length;
          totalRevenue = jsonSales.summary?.totalRevenue || 0;
          recent = jsonSales.data.slice(0, 5); // Take 5 transaksi terbaru
        }

        setSummary({
          totalRevenue,
          totalTransactions,
          totalProducts,
          totalStock,
          lowStockCount,
        });
        setRecentSales(recent);
      } catch (err) {
        console.error("Gagal memuat monitoring dashboard:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

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
            Workspace <span>/</span> <strong>Dashboard Monitoring</strong>
          </div>
          <div className="tw-topbar-right">
            <span className="tw-live-badge">
              <span className="tw-status-dot" />
              MONITORING REALTIME
            </span>
            <div className="tw-avatar">W</div>
          </div>
        </header>

        <div className="tw-content">
          {/* BANNER UTAMA */}
          <div
            className="tw-welcome"
            style={{
              background: "linear-gradient(135deg, #4f46e5 0%, #312e81 100%)",
              color: "#fff",
              padding: "24px 32px",
              borderRadius: "16px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "24px",
            }}
          >
            <div>
              <div style={{ fontSize: "0.75rem", letterSpacing: "1.5px", color: "#a5b4fc", marginBottom: "8px", fontWeight: "700" }}>
                POS MONITORING &amp; MANAGEMENT
              </div>
              <h1 style={{ fontSize: "1.8rem", fontWeight: "800", margin: "0 0 6px 0" }}>
                Dashboard <span>{storeName}</span>
              </h1>
              <p style={{ fontSize: "0.9rem", color: "#e0e7ff", margin: 0 }}>
                Pantau performa penjualan, ketersediaan inventaris, dan jalankan transaksi operasional.
              </p>
            </div>

            <Link href="/kasir" className="tw-btn tw-btn-primary" style={{ padding: "12px 24px", background: "#fff", color: "#4f46e5", fontWeight: "bold", fontSize: "0.9rem" }}>
              ⚡ Buka Kasir (POS) ↗
            </Link>
          </div>

          {/* GRID MONITORING METRICS (KPI) */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "24px" }}>
            <div className="tw-card" style={{ marginBottom: 0, padding: "18px" }}>
              <span style={{ fontSize: "0.75rem", color: "var(--tw-muted)", fontWeight: 700 }}>TOTAL OMSET PENJUALAN</span>
              <h3 style={{ fontSize: "1.4rem", color: "var(--tw-primary)", margin: "6px 0 0" }}>
                {loading ? "..." : `Rp ${summary.totalRevenue.toLocaleString("id-ID")}`}
              </h3>
            </div>

            <div className="tw-card" style={{ marginBottom: 0, padding: "18px" }}>
              <span style={{ fontSize: "0.75rem", color: "var(--tw-muted)", fontWeight: 700 }}>TOTAL TRANSAKSI</span>
              <h3 style={{ fontSize: "1.4rem", margin: "6px 0 0" }}>
                {loading ? "..." : `${summary.totalTransactions} Trx`}
              </h3>
            </div>

            <div className="tw-card" style={{ marginBottom: 0, padding: "18px" }}>
              <span style={{ fontSize: "0.75rem", color: "var(--tw-muted)", fontWeight: 700 }}>VARIASI PRODUK</span>
              <h3 style={{ fontSize: "1.4rem", margin: "6px 0 0" }}>
                {loading ? "..." : `${summary.totalProducts} Jenis`}
              </h3>
            </div>

            <div className="tw-card" style={{ marginBottom: 0, padding: "18px" }}>
              <span style={{ fontSize: "0.75rem", color: "var(--tw-muted)", fontWeight: 700 }}>TOTAL STOK UNIT</span>
              <h3 style={{ fontSize: "1.4rem", margin: "6px 0 0" }}>
                {loading ? "..." : `${summary.totalStock} Pcs`}
              </h3>
            </div>

            <div className="tw-card" style={{ marginBottom: 0, padding: "18px" }}>
              <span style={{ fontSize: "0.75rem", color: "var(--tw-muted)", fontWeight: 700 }}>STOK MENIPIS (&lt;=5)</span>
              <h3 style={{ fontSize: "1.4rem", color: summary.lowStockCount > 0 ? "#ef4444" : "#10b981", margin: "6px 0 0" }}>
                {loading ? "..." : `${summary.lowStockCount} Produk`}
              </h3>
            </div>
          </div>

          {/* DUA KOLOM: TRANSAKSI TERAKHIR & AKSI CEPAT */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: "20px" }}>
            {/* Tabel Transaksi Terakhir */}
            <div className="tw-card">
              <div className="tw-card-header">
                <h3 className="tw-card-title">Transaksi Kasir Terbaru</h3>
                <Link href="/penjualan" style={{ fontSize: "0.8rem", color: "var(--tw-primary)", fontWeight: "bold" }}>
                  Lihat Semua →
                </Link>
              </div>

              <div className="tw-table-container">
                <table className="tw-table">
                  <thead>
                    <tr>
                      <th>No Invoice</th>
                      <th>Waktu</th>
                      <th>Pelanggan</th>
                      <th>Total Belanja</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={4} style={{ textAlign: "center", padding: "15px" }}>Memuat transaksi...</td>
                      </tr>
                    ) : recentSales.length === 0 ? (
                      <tr>
                        <td colSpan={4} style={{ textAlign: "center", padding: "20px", color: "var(--tw-muted)" }}>
                          Belum ada transaksi penjualan recorded.
                        </td>
                      </tr>
                    ) : (
                      recentSales.map((s) => (
                        <tr key={s.id}>
                          <td><strong>{s.invoiceNo}</strong></td>
                          <td>{new Date(s.createdAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}</td>
                          <td>{s.customer?.name || "Umum"}</td>
                          <td><strong>Rp {s.totalAmount.toLocaleString("id-ID")}</strong></td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Aksi Cepat Operasional */}
            <div className="tw-card" style={{ height: "fit-content" }}>
              <h3 className="tw-card-title" style={{ marginBottom: "12px" }}>Aksi Cepat</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <Link href="/kasir" className="tw-btn tw-btn-primary" style={{ textAlign: "center", padding: "10px" }}>
                  ▣ Transaksi Kasir Baru
                </Link>
                <Link href="/barang" className="tw-btn tw-btn-secondary" style={{ textAlign: "center", padding: "10px" }}>
                  ▦ Tambah / Edit Barang
                </Link>
                <Link href="/pembelian" className="tw-btn tw-btn-secondary" style={{ textAlign: "center", padding: "10px" }}>
                  ↓ Restock Barang Masuk
                </Link>
                <Link href="/pengaturan" className="tw-btn tw-btn-secondary" style={{ textAlign: "center", padding: "10px" }}>
                  ⚙ Pengaturan &amp; Backup
                </Link>
              </div>
            </div>
          </div>

          <footer className="tw-footer" style={{ marginTop: "24px" }}>
            <span>© {new Date().getFullYear()} {storeName}</span>
            <span>Made for better business.</span>
          </footer>
        </div>
      </div>
    </main>
  );
}