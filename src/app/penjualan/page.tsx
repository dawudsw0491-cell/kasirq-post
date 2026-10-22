"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

export default function PenjualanPage() {
  const [storeName, setStoreName] = useState("KASIRQ STORE");
  const [isOnline, setIsOnline] = useState(true);
  const [salesHistory, setSalesHistory] = useState<any[]>([]);
  const [message, setMessage] = useState("");

  // State Modal Struk
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<any>(null);

  const syncSalesData = useCallback(() => {
    const savedStore = localStorage.getItem("tw_store_name");
    if (savedStore) setStoreName(savedStore);

    const savedSales = localStorage.getItem("tw_sales_history") || localStorage.getItem("tw_sales_reports");
    if (savedSales) {
      try {
        const parsed = JSON.parse(savedSales);
        setSalesHistory(parsed);
      } catch (e) {
        setSalesHistory([]);
      }
    } else {
      setSalesHistory([]);
    }
  }, []);

  useEffect(() => {
    syncSalesData();

    const handleStorageChange = () => syncSalesData();
    window.addEventListener("storage", handleStorageChange);

    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [syncSalesData]);

  // Fitur Refund
  const handleRefund = (sale: any) => {
    const confirmRefund = confirm(`Proses Refund untuk transaksi senilai Rp ${sale.total.toLocaleString("id-ID")}? Omset dan stok produk akan disesuaikan.`);
    if (!confirmRefund) return;

    const updatedSales = salesHistory.filter((item) => item.id !== sale.id);
    setSalesHistory(updatedSales);
    localStorage.setItem("tw_sales_history", JSON.stringify(updatedSales));
    localStorage.setItem("tw_sales_reports", JSON.stringify(updatedSales));

    const savedProducts = localStorage.getItem("tw_products");
    if (savedProducts) {
      try {
        let products = JSON.parse(savedProducts);
        sale.items.forEach((cartItem: any) => {
          products = products.map((p: any) => {
            if (p.id === cartItem.id || p.skuCode === cartItem.skuCode) {
              return { ...p, stock: (p.stock || 0) + cartItem.qty };
            }
            return p;
          });
        });
        localStorage.setItem("tw_products", JSON.stringify(products));
      } catch (e) {}
    }

    const savedFin = localStorage.getItem("tw_financial_records");
    let finData = savedFin ? JSON.parse(savedFin) : [];
    finData.unshift({
      id: Date.now(),
      date: new Date().toLocaleDateString("id-ID"),
      description: `Refund Transaksi #${String(sale.id).slice(-6)}`,
      type: "OUT",
      amount: sale.total,
    });
    localStorage.setItem("tw_financial_records", JSON.stringify(finData));

    window.dispatchEvent(new Event("storage"));

    setMessage("Refund berhasil diproses. Omset dan stok telah dikembalikan.");
    setTimeout(() => setMessage(""), 4000);
  };

  const handleOpenReceipt = (sale: any) => {
    setSelectedReceipt(sale);
    setShowReceiptModal(true);
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  const handleShareSocial = () => {
    if (!selectedReceipt) return;
    const text = encodeURIComponent(
      `*${storeName.toUpperCase()}*\n` +
      `STRUK PEMBELIAN\n` +
      `Tgl: ${selectedReceipt.date}\n` +
      `================================\n` +
      selectedReceipt.items.map((i: any) => `${i.name}\n  ${i.qty} x Rp ${i.sellPrice.toLocaleString("id-ID")} = Rp ${(i.qty * i.sellPrice).toLocaleString("id-ID")}`).join("\n") +
      `\n================================\n` +
      `*TOTAL: Rp ${selectedReceipt.total.toLocaleString("id-ID")}*\n` +
      `Bayar: Rp ${selectedReceipt.pay.toLocaleString("id-ID")}\n` +
      `Kembali: Rp ${selectedReceipt.change.toLocaleString("id-ID")}\n` +
      `================================\n` +
      `*Terima Kasih Atas Kunjungan Anda!*`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, "_blank");
  };

  const totalOmzet = salesHistory.reduce((acc, curr) => acc + (curr.total || 0), 0);

  return (
    <main className="tw-dashboard" style={{ animation: "fadeIn 0.3s ease-in-out" }}>
      <aside className="tw-sidebar">
        <Link href="/" className="tw-brand" style={{ transition: "all 0.2s ease" }}>
          <div
            style={{
              width: "38px",
              height: "38px",
              borderRadius: "10px",
              background: "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 12px rgba(2, 132, 199, 0.4)",
              border: "1px solid rgba(56, 189, 248, 0.4)",
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 4H20V16H4V4Z" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="rgba(255,255,255,0.15)" />
              <path d="M8 8H16" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" />
              <path d="M8 12H12" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" />
              <path d="M8 20H16" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
              <path d="M12 16V20" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <span className="tw-brand-copy">
            <strong>{storeName}</strong>
            <small>RETAIL MANAGEMENT</small>
          </span>
        </Link>

        <div className="tw-nav-label">WORKSPACE</div>
        <nav className="tw-nav">
          <Link href="/" className="tw-nav-link"><span className="tw-nav-icon">⌂</span>Dashboard</Link>
          <Link href="/kasir" className="tw-nav-link"><span className="tw-nav-icon">▣</span>Kasir (POS)</Link>
        </nav>

        <div className="tw-nav-label">MANAJEMEN TOKO</div>
        <nav className="tw-nav">
          <Link href="/barang" className="tw-nav-link"><span className="tw-nav-icon">▦</span>Barang</Link>
          <Link href="/kategori" className="tw-nav-link"><span className="tw-nav-icon">◇</span>Kode Barang (SKU)</Link>
          <Link href="/pelanggan" className="tw-nav-link"><span className="tw-nav-icon">♧</span>Pelanggan</Link>
          <Link href="/supplier" className="tw-nav-link"><span className="tw-nav-icon">⇄</span>Supplier</Link>
        </nav>

        <div className="tw-nav-label">TRANSAKSI &amp; SISTEM</div>
        <nav className="tw-nav">
          <Link href="/pembelian" className="tw-nav-link"><span className="tw-nav-icon">↓</span>Pembelian</Link>
          <Link href="/penjualan" className="tw-nav-link tw-nav-active"><span className="tw-nav-icon">↗</span>Penjualan</Link>
          <Link href="/keuangan" className="tw-nav-link"><span className="tw-nav-icon">💰</span>Keuangan</Link>
          <Link href="/pengaturan" className="tw-nav-link"><span className="tw-nav-icon">⚙</span>Pengaturan</Link>
        </nav>

        <div className="tw-sidebar-bottom">
          <div
            className="tw-status-dot"
            style={{
              backgroundColor: isOnline ? "#10b981" : "#ef4444",
              boxShadow: isOnline ? "0 0 8px #10b981" : "0 0 8px #ef4444",
            }}
          />
          <div>
            <strong>Sistem {storeName}</strong>
            <small>{isOnline ? "Online (Terhubung)" : "Offline (Terputus)"}</small>
          </div>
        </div>
      </aside>

      <div className="tw-main">
        <header className="tw-topbar">
          <div className="tw-breadcrumb">
            Transaksi <span>/</span> <strong>Laporan &amp; Riwayat Penjualan</strong>
          </div>
          
          <div className="tw-topbar-right" style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span
              className="tw-live-badge"
              style={{
                backgroundColor: isOnline ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)",
                color: isOnline ? "#10b981" : "#ef4444",
                borderColor: isOnline ? "rgba(16, 185, 129, 0.25)" : "rgba(239, 68, 68, 0.25)",
              }}
            >
              <span
                className="tw-status-dot"
                style={{
                  backgroundColor: isOnline ? "#10b981" : "#ef4444",
                  boxShadow: isOnline ? "0 0 8px #10b981" : "0 0 8px #ef4444",
                }}
              />
              {isOnline ? "ONLINE" : "OFFLINE"}
            </span>
          </div>
        </header>

        <div className="tw-content" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {message && (
            <div style={{ padding: "12px", background: "rgba(16, 185, 129, 0.15)", color: "#38bdf8", border: "1px solid rgba(16, 185, 129, 0.3)", borderRadius: "10px" }}>
              ✓ {message}
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "16px" }}>
            <div className="tw-card" style={{ padding: "20px" }}>
              <span style={{ fontSize: "0.8rem", color: "var(--tw-muted)" }}>Total Transaksi Penjualan</span>
              <strong style={{ fontSize: "1.6rem", color: "#38bdf8", display: "block", marginTop: "4px" }}>
                {salesHistory.length} <small style={{ fontSize: "0.8rem", color: "var(--tw-muted)" }}>trx</small>
              </strong>
            </div>
            <div className="tw-card" style={{ padding: "20px" }}>
              <span style={{ fontSize: "0.8rem", color: "var(--tw-muted)" }}>Akumulasi Omset Penjualan Bersih</span>
              <strong style={{ fontSize: "1.6rem", color: "#10b981", display: "block", marginTop: "4px" }}>
                Rp {totalOmzet.toLocaleString("id-ID")}
              </strong>
            </div>
          </div>

          <div className="tw-card">
            <h3 className="tw-card-title" style={{ marginBottom: "16px" }}>Riwayat Transaksi Masuk</h3>
            {salesHistory.length === 0 ? (
              <div style={{ padding: "40px", textAlign: "center", color: "var(--tw-muted)", border: "1px dashed var(--tw-border)", borderRadius: "10px" }}>
                Belum ada data laporan penjualan. Lakukan transaksi melalui menu <strong>Kasir (POS)</strong>.
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.9rem" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--tw-border)", color: "var(--tw-muted)" }}>
                      <th style={{ padding: "10px" }}>Waktu Transaksi</th>
                      <th style={{ padding: "10px" }}>Detail Item Barang</th>
                      <th style={{ padding: "10px" }}>Total Belanja</th>
                      <th style={{ padding: "10px" }}>Bayar / Kembalian</th>
                      <th style={{ padding: "10px", textAlign: "center" }}>Aksi (Struk &amp; Refund)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {salesHistory.map((s) => (
                      <tr key={s.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                        <td style={{ padding: "12px 10px", color: "var(--tw-muted)", fontSize: "0.85rem" }}>
                          {s.date || new Date(s.id).toLocaleString("id-ID")}
                        </td>
                        <td style={{ padding: "12px 10px", color: "#ffffff" }}>
                          {s.items && s.items.map((it: any, idx: number) => (
                            <div key={idx} style={{ fontSize: "0.85rem" }}>
                              • {it.name} <span style={{ color: "#38bdf8" }}>({it.qty}x Rp {it.sellPrice.toLocaleString("id-ID")})</span>
                            </div>
                          ))}
                        </td>
                        <td style={{ padding: "12px 10px", color: "#10b981", fontWeight: "600" }}>
                          Rp {(s.total || 0).toLocaleString("id-ID")}
                        </td>
                        <td style={{ padding: "12px 10px", color: "var(--tw-muted)", fontSize: "0.85rem" }}>
                          Bayar: Rp {(s.pay || 0).toLocaleString("id-ID")} <br />
                          Kembali: Rp {(s.change || 0).toLocaleString("id-ID")}
                        </td>
                        <td style={{ padding: "12px 10px", textAlign: "center", display: "flex", justifyContent: "center", gap: "8px" }}>
                          <button
                            onClick={() => handleOpenReceipt(s)}
                            style={{ background: "rgba(56, 189, 248, 0.15)", border: "1px solid #38bdf8", color: "#38bdf8", cursor: "pointer", fontSize: "0.75rem", padding: "4px 10px", borderRadius: "6px", fontWeight: "600" }}
                          >
                            Struk
                          </button>
                          <button
                            onClick={() => handleRefund(s)}
                            style={{ background: "rgba(239, 68, 68, 0.15)", border: "1px solid #ef4444", color: "#ef4444", cursor: "pointer", fontSize: "0.75rem", padding: "4px 10px", borderRadius: "6px", fontWeight: "600" }}
                          >
                            Refund
                          </button>
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

      {/* MODAL STRUK FORMAT PROFESIONAL (PUTIH, FONT HITAM SOLID, HEADER/FOOTER BOLD) */}
      {showReceiptModal && selectedReceipt && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div
            style={{
              width: "100%",
              maxWidth: "340px",
              background: "#ffffff",
              color: "#000000",
              padding: "24px 20px",
              borderRadius: "8px",
              boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
              fontFamily: "'Courier New', Courier, monospace, sans-serif",
            }}
          >
            {/* HEADER STRUK BOLD & RAPI */}
            <div style={{ textAlign: "center", marginBottom: "12px" }}>
              <h2 style={{ margin: 0, fontSize: "1.25rem", fontWeight: "900", textTransform: "uppercase", letterSpacing: "1px", color: "#000000" }}>
                {storeName}
              </h2>
              <p style={{ fontSize: "0.75rem", fontWeight: "bold", margin: "3px 0 0 0", color: "#000000" }}>
                OFFICIAL RETAIL RECEIPT
              </p>
              <div style={{ fontSize: "0.7rem", color: "#000000", marginTop: "2px" }}>
                No: #{String(selectedReceipt.id).slice(-8)}
              </div>
              <div style={{ fontSize: "0.7rem", color: "#000000" }}>
                {selectedReceipt.date}
              </div>
              <div style={{ borderBottom: "2px dashed #000000", margin: "10px 0 12px 0" }} />
            </div>

            {/* DAFTAR BARANG STRUK */}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "0.8rem", color: "#000000", marginBottom: "12px" }}>
              {selectedReceipt.items.map((it: any, i: number) => (
                <div key={i}>
                  <div style={{ fontWeight: "bold", textTransform: "uppercase" }}>{it.name}</div>
                  <div style={{ display: "flex", justifyContent: "space-between", paddingLeft: "8px", fontSize: "0.78rem" }}>
                    <span>{it.qty} x Rp {it.sellPrice.toLocaleString("id-ID")}</span>
                    <span style={{ fontWeight: "bold" }}>Rp {(it.qty * it.sellPrice).toLocaleString("id-ID")}</span>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ borderBottom: "2px dashed #000000", margin: "10px 0" }} />

            {/* TOTAL & METODE PEMBAYARAN BOLD */}
            <div style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "0.82rem", color: "#000000", marginBottom: "14px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.95rem", fontWeight: "900" }}>
                <span>TOTAL BELANJA</span>
                <span>Rp {selectedReceipt.total.toLocaleString("id-ID")}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem" }}>
                <span>TUNAI / BAYAR</span>
                <span>Rp {selectedReceipt.pay.toLocaleString("id-ID")}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", fontWeight: "bold" }}>
                <span>KEMBALI</span>
                <span>Rp {selectedReceipt.change.toLocaleString("id-ID")}</span>
              </div>
            </div>

            <div style={{ borderBottom: "2px dashed #000000", margin: "10px 0 12px 0" }} />

            {/* FOOTER STRUK BOLD */}
            <div style={{ textAlign: "center", marginBottom: "20px" }}>
              <strong style={{ fontSize: "0.8rem", fontWeight: "bold", display: "block", color: "#000000", textTransform: "uppercase" }}>
                *** TERIMA KASIH ***
              </strong>
              <small style={{ fontSize: "0.7rem", fontWeight: "bold", color: "#000000", display: "block", marginTop: "2px" }}>
                Barang yang sudah dibeli tidak dapat ditukar
              </small>
            </div>

            {/* TOMBOL KONTROL AKSI */}
            <div style={{ display: "flex", gap: "6px" }}>
              <button
                onClick={handlePrintReceipt}
                style={{ flex: 1, background: "#0284c7", color: "#ffffff", padding: "8px 4px", fontSize: "0.75rem", fontWeight: "bold", borderRadius: "6px", border: "none", cursor: "pointer" }}
              >
                🖨 Print
              </button>
              <button
                onClick={handleShareSocial}
                style={{ flex: 1, background: "#10b981", color: "#ffffff", padding: "8px 4px", fontSize: "0.75rem", fontWeight: "bold", borderRadius: "6px", border: "none", cursor: "pointer" }}
              >
                💬 Share WA
              </button>
              <button
                onClick={() => setShowReceiptModal(false)}
                style={{ flex: 1, background: "#64748b", color: "#ffffff", padding: "8px 4px", fontSize: "0.75rem", fontWeight: "bold", borderRadius: "6px", border: "none", cursor: "pointer" }}
              >
                Tutup
              </button>
            </div>

          </div>
        </div>
      )}
    </main>
  );
}