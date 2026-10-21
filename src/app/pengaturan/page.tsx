"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function PengaturanPage() {
  const [storeName, setStoreName] = useState("TOKO WIWID");
  const [storeAddress, setStoreAddress] = useState("Jl. Utama Retail No. 1");
  const [storePhone, setStorePhone] = useState("0812-3456-7890");
  const [receiptFooter, setReceiptFooter] = useState("Terima Kasih Atas Kunjungan Anda!");
  const [paperSize, setPaperSize] = useState("58mm");
  const [enableTax, setEnableTax] = useState(false);
  const [taxRate, setTaxRate] = useState(0);
  const [savedMessage, setSavedMessage] = useState("");

  useEffect(() => {
    const savedName = localStorage.getItem("tw_store_name");
    const savedAddress = localStorage.getItem("tw_store_address");
    const savedPhone = localStorage.getItem("tw_store_phone");
    const savedFooter = localStorage.getItem("tw_receipt_footer");
    const savedPaper = localStorage.getItem("tw_paper_size");
    const savedEnableTax = localStorage.getItem("tw_enable_tax");
    const savedTaxRate = localStorage.getItem("tw_tax_rate");

    if (savedName) setStoreName(savedName);
    if (savedAddress) setStoreAddress(savedAddress);
    if (savedPhone) setStorePhone(savedPhone);
    if (savedFooter) setReceiptFooter(savedFooter);
    if (savedPaper) setPaperSize(savedPaper);
    if (savedEnableTax === "true") setEnableTax(true);
    if (savedTaxRate) setTaxRate(parseFloat(savedTaxRate) || 0);
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem("tw_store_name", storeName);
    localStorage.setItem("tw_store_address", storeAddress);
    localStorage.setItem("tw_store_phone", storePhone);
    localStorage.setItem("tw_receipt_footer", receiptFooter);
    localStorage.setItem("tw_paper_size", paperSize);
    localStorage.setItem("tw_enable_tax", enableTax ? "true" : "false");
    localStorage.setItem("tw_tax_rate", taxRate.toString());

    setSavedMessage("Pengaturan toko berhasil disimpan!");
    setTimeout(() => setSavedMessage(""), 3000);
  };

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
          <Link href="/penjualan" className="tw-nav-link">
            <span className="tw-nav-icon">↗</span>
            Penjualan
          </Link>
          <Link href="/pengaturan" className="tw-nav-link tw-nav-active">
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
            Transaksi &amp; Sistem <span>/</span> <strong>Pengaturan Toko</strong>
          </div>
          <div className="tw-topbar-right">
            <span className="tw-live-badge">
              <span className="tw-status-dot" />
              SISTEM AKTIF
            </span>
            <div className="tw-avatar">W</div>
          </div>
        </header>

        <div className="tw-content" style={{ maxWidth: "700px" }}>
          <div className="tw-card">
            <h2 className="tw-card-title" style={{ marginBottom: "20px" }}>Konfigurasi &amp; Identitas Toko</h2>

            {savedMessage && (
              <div style={{ background: "#dcfce7", color: "#166534", padding: "10px 14px", borderRadius: "8px", marginBottom: "16px", fontWeight: "bold" }}>
                {savedMessage}
              </div>
            )}

            <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "6px" }}>Nama Toko</label>
                <input
                  type="text"
                  className="tw-input"
                  style={{ width: "100%" }}
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "6px" }}>Alamat Toko</label>
                <input
                  type="text"
                  className="tw-input"
                  style={{ width: "100%" }}
                  value={storeAddress}
                  onChange={(e) => setStoreAddress(e.target.value)}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "6px" }}>Nomor Telepon / WhatsApp</label>
                <input
                  type="text"
                  className="tw-input"
                  style={{ width: "100%" }}
                  value={storePhone}
                  onChange={(e) => setStorePhone(e.target.value)}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "6px" }}>Ukuran Kertas Struk</label>
                  <select
                    className="tw-input"
                    style={{ width: "100%" }}
                    value={paperSize}
                    onChange={(e) => setPaperSize(e.target.value)}
                  >
                    <option value="58mm">Thermal 58 mm</option>
                    <option value="80mm">Thermal 80 mm</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "6px" }}>Aktifkan Pajak (PPN/PPH)</label>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "8px" }}>
                    <input
                      type="checkbox"
                      checked={enableTax}
                      onChange={(e) => setEnableTax(e.target.checked)}
                      style={{ width: "18px", height: "18px" }}
                    />
                    <span>{enableTax ? "Aktif" : "Non-aktif"}</span>
                  </div>
                </div>
              </div>

              {enableTax && (
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "6px" }}>Tarif Pajak (%)</label>
                  <input
                    type="number"
                    className="tw-input"
                    style={{ width: "100%" }}
                    value={taxRate}
                    onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                  />
                </div>
              )}

              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "6px" }}>Catatan Footer Struk</label>
                <input
                  type="text"
                  className="tw-input"
                  style={{ width: "100%" }}
                  value={receiptFooter}
                  onChange={(e) => setReceiptFooter(e.target.value)}
                />
              </div>

              <button type="submit" className="tw-btn tw-btn-primary" style={{ padding: "12px", marginTop: "10px" }}>
                Simpan Pengaturan ↗
              </button>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}