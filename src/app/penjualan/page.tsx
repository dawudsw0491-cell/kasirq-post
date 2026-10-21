"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface SaleItem {
  id: number;
  qty: number;
  price: number;
  subtotal: number;
  product: { name: string; sku: string };
}

interface Sale {
  id: number;
  invoiceNo: string;
  totalAmount: number;
  payAmount: number;
  changeAmount: number;
  createdAt: string;
  customer?: { name: string } | null;
  items: SaleItem[];
}

export default function PenjualanPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [summary, setSummary] = useState({ totalTransactions: 0, totalRevenue: 0 });
  const [loading, setLoading] = useState(true);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);

  const fetchSalesHistory = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/sales/history");
      const json = await res.json();
      if (json.success) {
        setSales(json.data);
        setSummary(json.summary);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSalesHistory();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  return (
    <main className="tw-dashboard">
      <aside className="tw-sidebar">
        <Link href="/" className="tw-brand">
          <span className="tw-brand-logo">w.</span>
          <span className="tw-brand-copy">
            <strong>TOKO WIWID</strong>
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

        <div className="tw-nav-label">TRANSAKSI</div>
        <nav className="tw-nav">
          <Link href="/pembelian" className="tw-nav-link">
            <span className="tw-nav-icon">↓</span>
            Pembelian
          </Link>
          <Link href="/penjualan" className="tw-nav-link tw-nav-active">
            <span className="tw-nav-icon">↗</span>
            Penjualan
          </Link>
        </nav>

        <div className="tw-sidebar-bottom">
          <div className="tw-status-dot" />
          <div>
            <strong>Sistem Toko Wiwid</strong>
            <small>Workspace aktif</small>
          </div>
        </div>
      </aside>

      <div className="tw-main">
        <header className="tw-topbar">
          <div className="tw-breadcrumb">
            Workspace <span>/</span> <strong>Laporan Penjualan</strong>
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
          {/* Summary Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "24px" }}>
            <div className="tw-card" style={{ marginBottom: 0 }}>
              <span style={{ fontSize: "0.8rem", color: "var(--tw-muted)", fontWeight: 600 }}>TOTAL TRANSAKSI</span>
              <h2 style={{ fontSize: "1.8rem", marginTop: "4px" }}>{summary.totalTransactions} Transaksi</h2>
            </div>
            <div className="tw-card" style={{ marginBottom: 0 }}>
              <span style={{ fontSize: "0.8rem", color: "var(--tw-muted)", fontWeight: 600 }}>TOTAL OMSET PENJUALAN</span>
              <h2 style={{ fontSize: "1.8rem", marginTop: "4px", color: "var(--tw-primary)" }}>
                Rp {summary.totalRevenue.toLocaleString("id-ID")}
              </h2>
            </div>
          </div>

          <div className="tw-card">
            <div className="tw-card-header">
              <div>
                <h2 className="tw-card-title">Riwayat Transaksi Penjualan</h2>
                <p style={{ fontSize: "0.85rem", color: "var(--tw-muted)" }}>
                  Daftar seluruh transaksi kasir yang pernah dilakukan.
                </p>
              </div>
            </div>

            <div className="tw-table-container">
              <table className="tw-table">
                <thead>
                  <tr>
                    <th>No. Faktur / Invoice</th>
                    <th>Waktu Transaksi</th>
                    <th>Pelanggan</th>
                    <th>Total Belanja</th>
                    <th>Jumlah Barang</th>
                    <th style={{ textAlign: "center" }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: "center", padding: "20px" }}>
                        Memuat riwayat transaksi...
                      </td>
                    </tr>
                  ) : sales.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: "center", padding: "30px", color: "var(--tw-muted)" }}>
                        Belum ada riwayat transaksi penjualan.
                      </td>
                    </tr>
                  ) : (
                    sales.map((sale) => (
                      <tr key={sale.id}>
                        <td><strong>{sale.invoiceNo}</strong></td>
                        <td>{new Date(sale.createdAt).toLocaleString("id-ID")}</td>
                        <td>{sale.customer?.name || "Umum"}</td>
                        <td><strong>Rp {sale.totalAmount.toLocaleString("id-ID")}</strong></td>
                        <td>
                          <span className="tw-badge tw-badge-success">
                            {sale.items.reduce((a, b) => a + b.qty, 0)} Item
                          </span>
                        </td>
                        <td style={{ textAlign: "center" }}>
                          <button
                            className="tw-btn tw-btn-primary"
                            style={{ padding: "4px 10px", fontSize: "0.75rem" }}
                            onClick={() => setSelectedSale(sale)}
                          >
                            Detail / Cetak Struk
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Modal Struk & Detail Transaksi */}
          {selectedSale && (
            <div
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: "rgba(0,0,0,0.6)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 9999,
              }}
            >
              <div className="tw-card" style={{ background: "#fff", padding: "20px", maxWidth: "360px", width: "100%" }}>
                <div id="thermal-receipt" className="receipt-container">
                  <div className="receipt-header">
                    <h2>TOKO WIWID</h2>
                    <p>Jl. Utama Retail No. 1</p>
                    <p>Telp/WA: 0812-3456-7890</p>
                  </div>

                  <p style={{ margin: "4px 0" }}>No: {selectedSale.invoiceNo}</p>
                  <p style={{ margin: "4px 0" }}>Tgl: {new Date(selectedSale.createdAt).toLocaleString("id-ID")}</p>
                  <p style={{ margin: "4px 0" }}>Pelanggan: {selectedSale.customer?.name || "Umum"}</p>
                  <div className="receipt-divider" />

                  <table className="receipt-table">
                    <tbody>
                      {selectedSale.items.map((item) => (
                        <tr key={item.id}>
                          <td colSpan={2}>
                            {item.product?.name || "Produk"}<br />
                            <small>{item.qty} x Rp {item.price.toLocaleString("id-ID")}</small>
                          </td>
                          <td className="num">Rp {item.subtotal.toLocaleString("id-ID")}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div className="receipt-divider" />

                  <div className="receipt-row">
                    <span>TOTAL:</span>
                    <strong>Rp {selectedSale.totalAmount.toLocaleString("id-ID")}</strong>
                  </div>
                  <div className="receipt-row">
                    <span>BAYAR:</span>
                    <span>Rp {selectedSale.payAmount.toLocaleString("id-ID")}</span>
                  </div>
                  <div className="receipt-row">
                    <span>KEMBALI:</span>
                    <span>Rp {selectedSale.changeAmount.toLocaleString("id-ID")}</span>
                  </div>

                  <div className="receipt-footer">
                    <p>Terima Kasih Atas Kunjungan Anda!</p>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "10px", marginTop: "15px" }}>
                  <button className="tw-btn tw-btn-primary" style={{ flex: 1 }} onClick={handlePrint}>
                    🖨️ Cetak Struk
                  </button>
                  <button className="tw-btn tw-btn-secondary" onClick={() => setSelectedSale(null)}>
                    Tutup
                  </button>
                </div>
              </div>
            </div>
          )}

          <footer className="tw-footer">
            <span>© {new Date().getFullYear()} Toko Wiwid</span>
            <span>Made for better business.</span>
          </footer>
        </div>
      </div>
    </main>
  );
}