"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function PengaturanPage() {
  // 1. Identitas Toko & Aplikasi Kasir
  const [storeName, setStoreName] = useState("TOKO WIWID");
  const [storeAddress, setStoreAddress] = useState("Jl. Utama Retail No. 1");
  const [storePhone, setStorePhone] = useState("0812-3456-7890");

  // 2. Operasional & Keuangan
  const [currencySymbol, setCurrencySymbol] = useState("Rp");
  const [taxRate, setTaxRate] = useState("0");
  const [enableTax, setEnableTax] = useState(false);
  const [lowStockAlert, setLowStockAlert] = useState("5");

  // 3. Struk Thermal & Printer
  const [receiptHeader, setReceiptHeader] = useState("Selamat Datang!");
  const [receiptFooter, setReceiptFooter] = useState("Terima Kasih Atas Kunjungan Anda!");
  const [paperSize, setPaperSize] = useState("58mm");
  const [showCustomerOnReceipt, setShowCustomerOnReceipt] = useState(true);

  // 4. Tema (Dark/Light Mode)
  const [themeMode, setThemeMode] = useState<"light" | "dark">("light");

  // Fungsi Penerapan Tema ke DOM
  const applyTheme = (mode: "light" | "dark") => {
    if (mode === "dark") {
      document.documentElement.classList.add("dark");
      document.body.classList.add("dark-mode");
    } else {
      document.documentElement.classList.remove("dark");
      document.body.classList.remove("dark-mode");
    }
  };

  // Synchronize Pengaturan dari localStorage saat halaman dimuat
  useEffect(() => {
    const savedName = localStorage.getItem("tw_store_name");
    const savedAddress = localStorage.getItem("tw_store_address");
    const savedPhone = localStorage.getItem("tw_store_phone");

    const savedCurrency = localStorage.getItem("tw_currency_symbol");
    const savedTaxRate = localStorage.getItem("tw_tax_rate");
    const savedEnableTax = localStorage.getItem("tw_enable_tax");
    const savedLowStock = localStorage.getItem("tw_low_stock");

    const savedHeader = localStorage.getItem("tw_receipt_header");
    const savedFooter = localStorage.getItem("tw_receipt_footer");
    const savedPaper = localStorage.getItem("tw_paper_size");
    const savedShowCustomer = localStorage.getItem("tw_show_customer");

    const savedTheme = localStorage.getItem("tw_theme_mode") as "light" | "dark";

    if (savedName) setStoreName(savedName);
    if (savedAddress) setStoreAddress(savedAddress);
    if (savedPhone) setStorePhone(savedPhone);

    if (savedCurrency) setCurrencySymbol(savedCurrency);
    if (savedTaxRate) setTaxRate(savedTaxRate);
    if (savedEnableTax) setEnableTax(savedEnableTax === "true");
    if (savedLowStock) setLowStockAlert(savedLowStock);

    if (savedHeader) setReceiptHeader(savedHeader);
    if (savedFooter) setReceiptFooter(savedFooter);
    if (savedPaper) setPaperSize(savedPaper);
    if (savedShowCustomer) setShowCustomerOnReceipt(savedShowCustomer === "true");

    if (savedTheme) {
      setThemeMode(savedTheme);
      applyTheme(savedTheme);
    }
  }, []);

  // Simpan Pengaturan
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();

    localStorage.setItem("tw_store_name", storeName);
    localStorage.setItem("tw_store_address", storeAddress);
    localStorage.setItem("tw_store_phone", storePhone);

    localStorage.setItem("tw_currency_symbol", currencySymbol);
    localStorage.setItem("tw_tax_rate", taxRate);
    localStorage.setItem("tw_enable_tax", String(enableTax));
    localStorage.setItem("tw_low_stock", lowStockAlert);

    localStorage.setItem("tw_receipt_header", receiptHeader);
    localStorage.setItem("tw_receipt_footer", receiptFooter);
    localStorage.setItem("tw_paper_size", paperSize);
    localStorage.setItem("tw_show_customer", String(showCustomerOnReceipt));

    localStorage.setItem("tw_theme_mode", themeMode);

    applyTheme(themeMode);

    alert("Pengaturan aplikasi berhasil disimpan!");
  };

  // Ekspor Data ke Excel/CSV
  const handleExportData = (type: string) => {
    window.open(`/api/export?type=${type}`, "_blank");
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
            Workspace <span>/</span> <strong>Pengaturan Aplikasi</strong>
          </div>
          <div className="tw-topbar-right">
            <span className="tw-live-badge">
              <span className="tw-status-dot" />
              SISTEM AKTIF
            </span>
            <div className="tw-avatar">W</div>
          </div>
        </header>

        <div className="tw-content" style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "20px" }}>
          {/* Form Pengaturan Lengkap */}
          <div className="tw-card">
            <div className="tw-card-header">
              <div>
                <h2 className="tw-card-title">Konfigurasi Sistem Toko</h2>
                <p style={{ fontSize: "0.85rem", color: "var(--tw-muted)" }}>
                  Kelola nama aplikasi kasir, operasional keuangan, struk thermal, dan mode tampilan.
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveSettings}>
              {/* Seksi 1: Nama Toko / Kasir */}
              <h3 style={{ fontSize: "1rem", marginBottom: "12px", color: "var(--tw-primary)" }}>
                1. Identitas Toko &amp; Nama Aplikasi Kasir
              </h3>
              <div style={{ marginBottom: "12px" }}>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "4px" }}>
                  Nama Aplikasi / Nama Toko *
                </label>
                <input
                  type="text"
                  required
                  className="tw-input"
                  style={{ width: "100%" }}
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  placeholder="Contoh: TOKO WIWID POS"
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "4px" }}>
                    Alamat Lengkap Toko
                  </label>
                  <input
                    type="text"
                    className="tw-input"
                    style={{ width: "100%" }}
                    value={storeAddress}
                    onChange={(e) => setStoreAddress(e.target.value)}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "4px" }}>
                    No. Telepon / WhatsApp
                  </label>
                  <input
                    type="text"
                    className="tw-input"
                    style={{ width: "100%" }}
                    value={storePhone}
                    onChange={(e) => setStorePhone(e.target.value)}
                  />
                </div>
              </div>

              {/* Seksi 2: Operasional Keuangan & Stok */}
              <h3 style={{ fontSize: "1rem", margin: "20px 0 12px", color: "var(--tw-primary)" }}>
                2. Operasional Kasir &amp; Inventaris
              </h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "4px" }}>
                    Simbol Mata Uang
                  </label>
                  <input
                    type="text"
                    className="tw-input"
                    style={{ width: "100%" }}
                    value={currencySymbol}
                    onChange={(e) => setCurrencySymbol(e.target.value)}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "4px" }}>
                    Batas Minimal Peringatan Stok
                  </label>
                  <input
                    type="number"
                    className="tw-input"
                    style={{ width: "100%" }}
                    value={lowStockAlert}
                    onChange={(e) => setLowStockAlert(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ marginBottom: "12px", display: "flex", alignItems: "center", gap: "10px" }}>
                <input
                  type="checkbox"
                  id="enableTax"
                  checked={enableTax}
                  onChange={(e) => setEnableTax(e.target.checked)}
                />
                <label htmlFor="enableTax" style={{ fontSize: "0.85rem", fontWeight: 600 }}>
                  Aktifkan Biaya Pajak (PB1/PPN) saat transaksi kasir
                </label>
              </div>

              {enableTax && (
                <div style={{ marginBottom: "16px", width: "200px" }}>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "4px" }}>
                    Persentase Pajak (%)
                  </label>
                  <input
                    type="number"
                    className="tw-input"
                    style={{ width: "100%" }}
                    value={taxRate}
                    onChange={(e) => setTaxRate(e.target.value)}
                  />
                </div>
              )}

              {/* Seksi 3: Struk Thermal */}
              <h3 style={{ fontSize: "1rem", margin: "20px 0 12px", color: "var(--tw-primary)" }}>
                3. Printer &amp; Format Struk Thermal
              </h3>
              <div style={{ marginBottom: "12px" }}>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "4px" }}>
                  Teks Ucapan Header Struk
                </label>
                <input
                  type="text"
                  className="tw-input"
                  style={{ width: "100%" }}
                  value={receiptHeader}
                  onChange={(e) => setReceiptHeader(e.target.value)}
                />
              </div>

              <div style={{ marginBottom: "12px" }}>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "4px" }}>
                  Teks Pesan Footer Struk
                </label>
                <input
                  type="text"
                  className="tw-input"
                  style={{ width: "100%" }}
                  value={receiptFooter}
                  onChange={(e) => setReceiptFooter(e.target.value)}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "4px" }}>
                    Ukuran Kertas Printer
                  </label>
                  <select
                    className="tw-input"
                    style={{ width: "100%" }}
                    value={paperSize}
                    onChange={(e) => setPaperSize(e.target.value)}
                  >
                    <option value="58mm">58mm (Bluetooth Thermal Standard)</option>
                    <option value="80mm">80mm (Printer Kasir USB/POS)</option>
                  </select>
                </div>
                <div style={{ display: "flex", alignItems: "center", marginTop: "20px" }}>
                  <input
                    type="checkbox"
                    id="showCustomer"
                    checked={showCustomerOnReceipt}
                    onChange={(e) => setShowCustomerOnReceipt(e.target.checked)}
                  />
                  <label htmlFor="showCustomer" style={{ fontSize: "0.85rem", marginLeft: "8px" }}>
                    Cetak nama pelanggan di struk
                  </label>
                </div>
              </div>

              {/* Seksi 4: Mode Tampilan Dark/Light Mode */}
              <h3 style={{ fontSize: "1rem", margin: "20px 0 12px", color: "var(--tw-primary)" }}>
                4. Tema Tampilan (Mode Gelap / Terang)
              </h3>
              <div style={{ marginBottom: "24px" }}>
                <select
                  className="tw-input"
                  style={{ width: "100%" }}
                  value={themeMode}
                  onChange={(e) => {
                    const newMode = e.target.value as "light" | "dark";
                    setThemeMode(newMode);
                    applyTheme(newMode);
                  }}
                >
                  <option value="light">☀️ Mode Terang (Light Mode)</option>
                  <option value="dark">🌙 Mode Gelap (Dark Mode)</option>
                </select>
              </div>

              <button type="submit" className="tw-btn tw-btn-primary" style={{ padding: "12px 24px", fontWeight: "bold" }}>
                💾 Simpan Seluruh Pengaturan
              </button>
            </form>
          </div>

          {/* Kartu Ekspor / Backup Excel */}
          <div className="tw-card" style={{ height: "fit-content" }}>
            <h3 className="tw-card-title" style={{ marginBottom: "12px" }}>Backup Data Excel</h3>
            <p style={{ fontSize: "0.8rem", color: "var(--tw-muted)", marginBottom: "20px" }}>
              Unduh salinan data aplikasi Anda secara berkala ke file CSV/Excel.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <button
                className="tw-btn tw-btn-secondary"
                style={{ textAlign: "left", padding: "12px" }}
                onClick={() => handleExportData("products")}
              >
                📊 Ekspor Data Barang (.csv)
              </button>
              <button
                className="tw-btn tw-btn-secondary"
                style={{ textAlign: "left", padding: "12px" }}
                onClick={() => handleExportData("sales")}
              >
                💰 Ekspor Data Penjualan (.csv)
              </button>
              <button
                className="tw-btn tw-btn-secondary"
                style={{ textAlign: "left", padding: "12px" }}
                onClick={() => handleExportData("customers")}
              >
                👥 Ekspor Data Pelanggan (.csv)
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}