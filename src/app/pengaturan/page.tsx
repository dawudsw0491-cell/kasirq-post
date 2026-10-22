"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import * as XLSX from "xlsx";

export default function PengaturanPage() {
  const [storeName, setStoreName] = useState("KASIRQ STORE");
  const [appName, setAppName] = useState("KasirQ Retail Management");
  const [storeAddress, setStoreAddress] = useState("Jl. Gatot Subroto No. 88, Solo");
  const [storePhone, setStorePhone] = useState("081234567890");
  const [thermalSize, setThermalSize] = useState("80 mm (Standar POS)");
  const [headerReceipt, setHeaderReceipt] = useState("Selamat Datang di KASIRQ STORE");
  const [footerReceipt, setFooterReceipt] = useState("Terima Kasih Atas Kunjungan Anda!");
  const [ppnActive, setPpnActive] = useState(true);
  const [ppnValue, setPpnValue] = useState(11);
  const [pphActive, setPphActive] = useState(false);

  const [isOnline, setIsOnline] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const savedStore = localStorage.getItem("tw_store_name");
    if (savedStore) setStoreName(savedStore);

    const savedApp = localStorage.getItem("tw_app_name");
    if (savedApp) setAppName(savedApp);

    const savedAddress = localStorage.getItem("tw_store_address");
    if (savedAddress) setStoreAddress(savedAddress);

    const savedPhone = localStorage.getItem("tw_store_phone");
    if (savedPhone) setStorePhone(savedPhone);

    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem("tw_store_name", storeName);
    localStorage.setItem("tw_app_name", appName);
    localStorage.setItem("tw_store_address", storeAddress);
    localStorage.setItem("tw_store_phone", storePhone);
    window.dispatchEvent(new Event("storage"));
    setMessage("Pengaturan dan identitas toko berhasil disimpan!");
    setTimeout(() => setMessage(""), 3000);
  };

  // FITUR EXPORT TO EXCEL MULTI-SHEET DENGAN FORMULA TERINTEGRASI
  const handleExportExcel = () => {
    try {
      const workbook = XLSX.utils.book_new();

      // 1. Sheet Ringkasan Eksekutif & Formula
      const summaryData = [
        ["LAPORAN RINGKASAN EKSEKUTIF - " + storeName],
        ["Tanggal Ekspor:", new Date().toLocaleDateString("id-ID")],
        [],
        ["Keterangan Metrik", "Nilai / Formula Excel"],
        ["Total Item Master SKU", { t: "n", f: "COUNTA(Master_SKU!A3:A1000)" }],
        ["Total Jenis Produk Aktif", { t: "n", f: "COUNTA(Inventaris_Stok!A3:A1000)" }],
        ["Total Akumulasi Omset", { t: "n", f: "SUM(Riwayat_Penjualan!C3:C1000)" }],
        ["Total Arus Kas Masuk", { t: "n", f: "SUMIF(Arus_Keuangan!C3:C1000, \"IN\", Arus_Keuangan!D3:D1000)" }],
        ["Total Arus Kas Keluar", { t: "n", f: "SUMIF(Arus_Keuangan!C3:C1000, \"OUT\", Arus_Keuangan!D3:D1000)" }],
      ];
      const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(workbook, wsSummary, "Ringkasan_Dashboard");

      // 2. Sheet Master SKU & Margin Keuntungan Formula
      const rawSku = JSON.parse(localStorage.getItem("tw_master_sku") || "[]");
      const skuData = [
        ["DATABASE MASTER KODE BARANG (SKU)"],
        ["ID", "Kode SKU", "Nama Barang", "Kategori", "Supplier", "Harga Modal", "Harga Jual", "Margin Keuntungan (Rp)"],
        ...rawSku.map((s: any, idx: number) => [
          s.id,
          s.skuCode,
          s.name,
          s.category,
          s.supplier,
          s.buyPrice,
          s.sellPrice,
          { t: "n", f: `G${idx + 3}-F${idx + 3}` }, // Formula Margin = Harga Jual - Harga Modal
        ]),
      ];
      const wsSku = XLSX.utils.aoa_to_sheet(skuData);
      XLSX.utils.book_append_sheet(workbook, wsSku, "Master_SKU");

      // 3. Sheet Inventaris Stok & Formula Status Kritis
      const rawProducts = JSON.parse(localStorage.getItem("tw_products") || "[]");
      const productData = [
        ["MONITORING INVENTARIS STOK PRODUK"],
        ["ID", "Kode SKU", "Nama Barang", "Kategori", "Harga Modal", "Harga Jual", "Stok Tersedia", "Status Kritis Stok"],
        ...rawProducts.map((p: any, idx: number) => [
          p.id,
          p.skuCode,
          p.name,
          p.category,
          p.buyPrice,
          p.sellPrice,
          p.stock,
          { t: "s", f: `IF(G${idx + 3}<=5, "STOK MENIPIS", "AMAN")` }, // Formula Logika Stok
        ]),
      ];
      const wsProducts = XLSX.utils.aoa_to_sheet(productData);
      XLSX.utils.book_append_sheet(workbook, wsProducts, "Inventaris_Stok");

      // 4. Sheet Riwayat Penjualan & Formula Subtotal
      const rawSales = JSON.parse(localStorage.getItem("tw_sales_history") || "[]");
      const salesFlatRows: any[] = [
        ["LAPORAN RIWAYAT TRANSAKSI PENJUALAN KASIR"],
        ["ID Transaksi", "Tanggal", "Nama Barang Terjual", "Qty", "Harga Satuan", "Subtotal Baris", "Total Belanja Nota", "Tunai", "Kembalian"],
      ];
      rawSales.forEach((s: any) => {
        if (s.items && s.items.length > 0) {
          s.items.forEach((it: any, i: number) => {
            salesFlatRows.push([
              i === 0 ? s.id : "",
              i === 0 ? s.date : "",
              it.name,
              it.qty,
              it.sellPrice,
              { t: "n", f: `D${salesFlatRows.length + 1}*E${salesFlatRows.length + 1}` }, // Formula Subtotal = Qty * Harga
              i === 0 ? s.total : "",
              i === 0 ? s.pay : "",
              i === 0 ? s.change : "",
            ]);
          });
        }
      });
      const wsSales = XLSX.utils.aoa_to_sheet(salesFlatRows);
      XLSX.utils.book_append_sheet(workbook, wsSales, "Riwayat_Penjualan");

      // 5. Sheet Arus Keuangan
      const rawFin = JSON.parse(localStorage.getItem("tw_financial_records") || "[]");
      const finData = [
        ["BUKU BESAR ARUS KEUANGAN KAS MASUK & KELUAR"],
        ["ID", "Tanggal", "Keterangan Transaksi", "Tipe (IN/OUT)", "Nominal (Rp)"],
        ...rawFin.map((f: any) => [
          f.id,
          f.date,
          f.description,
          f.type,
          f.amount,
        ]),
      ];
      const wsFin = XLSX.utils.aoa_to_sheet(finData);
      XLSX.utils.book_append_sheet(workbook, wsFin, "Arus_Keuangan");

      // 6. Sheet Supplier
      const rawSuppliers = JSON.parse(localStorage.getItem("tw_suppliers") || "[]");
      const supplierData = [
        ["DAFTAR MASTER SUPPLIER"],
        ["ID", "Nama Supplier", "Kontak", "Alamat"],
        ...rawSuppliers.map((sup: any) => [
          sup.id,
          sup.name,
          sup.phone || sup.contact || "-",
          sup.address || "-",
        ]),
      ];
      const wsSuppliers = XLSX.utils.aoa_to_sheet(supplierData);
      XLSX.utils.book_append_sheet(workbook, wsSuppliers, "Supplier");

      // Export dan Unduh Berkas Excel (.xlsx)
      XLSX.writeFile(workbook, `Laporan_Database_KasirQ_${Date.now()}.xlsx`);

      setMessage("Berhasil! File Excel multi-sheet berformula berhasil diunduh.");
      setTimeout(() => setMessage(""), 4000);
    } catch (error) {
      console.error(error);
      alert("Gagal melakukan export database ke Excel.");
    }
  };

  const handleFullReset = () => {
    const confirmReset = confirm("PERINGATAN: Seluruh data omset, transaksi, stok barang, pelanggan, dan supplier akan dihapus permanen untuk memulai operasional dari awal. Lanjutkan?");
    if (!confirmReset) return;

    localStorage.removeItem("tw_master_sku");
    localStorage.removeItem("tw_products");
    localStorage.removeItem("tw_sales_history");
    localStorage.removeItem("tw_sales_reports");
    localStorage.removeItem("tw_financial_records");
    localStorage.removeItem("tw_suppliers");

    window.dispatchEvent(new Event("storage"));
    alert("Sistem berhasil di-reset penuh ke 0.");
    window.location.reload();
  };

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
          <Link href="/penjualan" className="tw-nav-link"><span className="tw-nav-icon">↗</span>Penjualan</Link>
          <Link href="/keuangan" className="tw-nav-link"><span className="tw-nav-icon">💰</span>Keuangan</Link>
          <Link href="/pengaturan" className="tw-nav-link tw-nav-active"><span className="tw-nav-icon">⚙</span>Pengaturan</Link>
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
            Sistem <span>/</span> <strong>Pengaturan Aplikasi &amp; Identitas Toko</strong>
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

        <div className="tw-content" style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "20px" }}>
          
          <div className="tw-card" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <h3 className="tw-card-title">Pengaturan Aplikasi &amp; Identitas Toko</h3>

            {message && (
              <div style={{ padding: "10px", background: "rgba(16, 185, 129, 0.15)", color: "#38bdf8", borderRadius: "8px", fontSize: "0.85rem" }}>
                ✓ {message}
              </div>
            )}

            <form onSubmit={handleSaveSettings} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", color: "var(--tw-muted)", marginBottom: "4px" }}>Nama Aplikasi</label>
                  <input
                    type="text"
                    value={appName}
                    onChange={(e) => setAppName(e.target.value)}
                    style={{ width: "100%" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", color: "var(--tw-muted)", marginBottom: "4px" }}>Nama Toko / Brand</label>
                  <input
                    type="text"
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    style={{ width: "100%" }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.8rem", color: "var(--tw-muted)", marginBottom: "4px" }}>Alamat Lengkap Toko</label>
                <textarea
                  value={storeAddress}
                  onChange={(e) => setStoreAddress(e.target.value)}
                  rows={2}
                  style={{ width: "100%", resize: "none" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", color: "var(--tw-muted)", marginBottom: "4px" }}>No. Telepon Toko</label>
                  <input
                    type="text"
                    value={storePhone}
                    onChange={(e) => setStorePhone(e.target.value)}
                    style={{ width: "100%" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", color: "var(--tw-muted)", marginBottom: "4px" }}>Ukuran Struk Thermal</label>
                  <select
                    value={thermalSize}
                    onChange={(e) => setThermalSize(e.target.value)}
                    style={{ width: "100%" }}
                  >
                    <option value="80 mm (Standar POS)">80 mm (Standar POS)</option>
                    <option value="58 mm (Mini Thermal)">58 mm (Mini Thermal)</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.8rem", color: "var(--tw-muted)", marginBottom: "6px", fontWeight: "bold" }}>Cetak Struk (Header &amp; Footer)</label>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  <div>
                    <span style={{ fontSize: "0.75rem", color: "var(--tw-muted)", display: "block", marginBottom: "2px" }}>Header Struk</span>
                    <input
                      type="text"
                      value={headerReceipt}
                      onChange={(e) => setHeaderReceipt(e.target.value)}
                      style={{ width: "100%" }}
                    />
                  </div>
                  <div>
                    <span style={{ fontSize: "0.75rem", color: "var(--tw-muted)", display: "block", marginBottom: "2px" }}>Footer Struk</span>
                    <input
                      type="text"
                      value={footerReceipt}
                      onChange={(e) => setFooterReceipt(e.target.value)}
                      style={{ width: "100%" }}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.8rem", color: "var(--tw-muted)", marginBottom: "6px", fontWeight: "bold" }}>Pengaturan Pajak (PPN &amp; PPh)</label>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px", background: "rgba(255,255,255,0.02)", padding: "12px", borderRadius: "8px", border: "1px solid var(--tw-border)" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.85rem", cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={ppnActive}
                        onChange={(e) => setPpnActive(e.target.checked)}
                        style={{ width: "16px", height: "16px" }}
                      />
                      Aktifkan Pajak PPN
                    </label>
                    <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                      <input
                        type="number"
                        value={ppnValue}
                        onChange={(e) => setPpnValue(Number(e.target.value))}
                        style={{ width: "60px", padding: "4px 8px", textAlign: "center" }}
                      />
                      <span style={{ fontSize: "0.85rem" }}>%</span>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center" }}>
                    <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.85rem", cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={pphActive}
                        onChange={(e) => setPphActive(e.target.checked)}
                        style={{ width: "16px", height: "16px" }}
                      />
                      Aktifkan Pajak PPh
                    </label>
                  </div>
                </div>
              </div>

              <button type="submit" className="tw-btn tw-btn-primary" style={{ padding: "12px", fontWeight: "bold", marginTop: "8px" }}>
                Simpan Perubahan Pengaturan
              </button>
            </form>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            
            <div className="tw-card">
              <h3 className="tw-card-title" style={{ fontSize: "1rem", marginBottom: "6px" }}>Backup All Data &amp; Export Excel</h3>
              <p style={{ fontSize: "0.8rem", color: "var(--tw-muted)", marginBottom: "16px" }}>
                Unduh database toko Anda dalam berkas spreadsheet multi-sheet terinterkoneksi formula.
              </p>
              <button
                onClick={handleExportExcel}
                style={{
                  width: "100%",
                  background: "#10b981",
                  color: "#ffffff",
                  padding: "12px",
                  borderRadius: "8px",
                  border: "none",
                  fontWeight: "bold",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  boxShadow: "0 4px 12px rgba(16, 185, 129, 0.3)",
                }}
              >
                <span>📊</span> Download Full Database Backup (.xlsx)
              </button>
            </div>

            <div className="tw-card" style={{ border: "1px solid rgba(239, 68, 68, 0.4)", background: "rgba(239, 68, 68, 0.03)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                <span>⚠️</span>
                <h3 className="tw-card-title" style={{ fontSize: "1rem", color: "#ef4444" }}>Full Reset (Mulai dari 0)</h3>
              </div>
              <p style={{ fontSize: "0.8rem", color: "var(--tw-muted)", marginBottom: "16px" }}>
                Hapus seluruh data omset, transaksi, stok barang, pelanggan, dan supplier untuk memulai operasional toko baru dari awal.
              </p>
              <button
                onClick={handleFullReset}
                style={{
                  width: "100%",
                  background: "#ef4444",
                  color: "#ffffff",
                  padding: "12px",
                  borderRadius: "8px",
                  border: "none",
                  fontWeight: "bold",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  boxShadow: "0 4px 12px rgba(239, 68, 68, 0.3)",
                }}
              >
                <span>🔄</span> Full Reset Semua Data ke 0
              </button>
            </div>

          </div>

        </div>
      </div>
    </main>
  );
}