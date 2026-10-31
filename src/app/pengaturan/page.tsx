"use client";

import { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import { supabase } from "@/lib/supabase";

export interface FeatureSettings {
  barang: boolean;
  kodeBarang: boolean;
  pelanggan: boolean;
  supplier: boolean;
  pembelian: boolean; // Mengontrol visibilitas menu Hutang & Piutang
  penjualan: boolean;
  keuangan: boolean;
}

export const DEFAULT_FEATURES: FeatureSettings = {
  barang: true,
  kodeBarang: true,
  pelanggan: true,
  supplier: true,
  pembelian: true,
  penjualan: true,
  keuangan: true,
};

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
  const [loadingReset, setLoadingReset] = useState(false);

  // State Pengaturan Toggle Fitur
  const [features, setFeatures] = useState<FeatureSettings>(DEFAULT_FEATURES);

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

    // Load saved feature settings
    const savedFeatures = localStorage.getItem("kasirq_features");
    if (savedFeatures) {
      try {
        setFeatures(JSON.parse(savedFeatures));
      } catch (e) {
        setFeatures(DEFAULT_FEATURES);
      }
    }

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

  const handleToggleFeature = (key: keyof FeatureSettings) => {
    const updated = {
      ...features,
      [key]: !features[key],
    };
    setFeatures(updated);
    localStorage.setItem("kasirq_features", JSON.stringify(updated));
    window.dispatchEvent(new Event("storage"));

    setMessage(`Status fitur "${key === "pembelian" ? "Hutang & Piutang" : key}" berhasil diubah!`);
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
        ["Total Arus Kas Masuk", { t: "n", f: 'SUMIF(Arus_Keuangan!C3:C1000, "IN", Arus_Keuangan!D3:D1000)' }],
        ["Total Arus Kas Keluar", { t: "n", f: 'SUMIF(Arus_Keuangan!C3:C1000, "OUT", Arus_Keuangan!D3:D1000)' }],
        ["Total Piutang Belum Lunas", { t: "n", f: 'SUM(Piutang_Pelanggan!E3:E1000)' }],
      ];
      const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(workbook, wsSummary, "Ringkasan_Dashboard");

      // 2. Sheet Master SKU
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
          { t: "n", f: `G${idx + 3}-F${idx + 3}` },
        ]),
      ];
      const wsSku = XLSX.utils.aoa_to_sheet(skuData);
      XLSX.utils.book_append_sheet(workbook, wsSku, "Master_SKU");

      // 3. Sheet Inventaris Stok
      const rawProducts = JSON.parse(localStorage.getItem("tw_products") || "[]");
      const productData = [
        ["MONITORING INVENTARIS STOK PRODUK"],
        ["ID", "Kode SKU", "Nama Barang", "Kategori", "Harga Modal", "Harga Jual", "Stok Tersedia", "Status Kritis Stok"],
        ...rawProducts.map((p: any, idx: number) => [
          p.id,
          p.skuCode || p.skucode,
          p.name,
          p.category,
          p.buyPrice || p.buyprice,
          p.retailPrice || p.retailprice,
          p.stock,
          { t: "s", f: `IF(G${idx + 3}<=5, "STOK MENIPIS", "AMAN")` },
        ]),
      ];
      const wsProducts = XLSX.utils.aoa_to_sheet(productData);
      XLSX.utils.book_append_sheet(workbook, wsProducts, "Inventaris_Stok");

      // 4. Sheet Riwayat Penjualan
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
              { t: "n", f: `D${salesFlatRows.length + 1}*E${salesFlatRows.length + 1}` },
              i === 0 ? (s.total_amount || s.total) : "",
              i === 0 ? s.pay : "",
              i === 0 ? s.change : "",
            ]);
          });
        }
      });
      const wsSales = XLSX.utils.aoa_to_sheet(salesFlatRows);
      XLSX.utils.book_append_sheet(workbook, wsSales, "Riwayat_Penjualan");

      // 5. Sheet Piutang / Bon Pelanggan
      const rawDebts = JSON.parse(localStorage.getItem("kasirq_piutang") || "[]");
      const debtData = [
        ["REKAPITULASI PIUTANG & BON PELANGGAN"],
        ["ID Trx", "Tanggal Bon", "Nama Pelanggan", "Total Bon", "Sisa Piutang", "Status"],
        ...rawDebts.map((d: any) => [
          d.trxId || d.id,
          d.date,
          d.customerName,
          d.amount,
          d.remainingAmount,
          d.status,
        ]),
      ];
      const wsDebts = XLSX.utils.aoa_to_sheet(debtData);
      XLSX.utils.book_append_sheet(workbook, wsDebts, "Piutang_Pelanggan");

      // 6. Sheet Arus Keuangan
      const rawFin = JSON.parse(
        localStorage.getItem("tw_financials") ||
        localStorage.getItem("kasirq_keuangan") ||
        localStorage.getItem("tw_cash_flow") || "[]"
      );
      const finData = [
        ["BUKU BESAR ARUS KEUANGAN KAS MASUK & KELUAR"],
        ["ID", "Tanggal", "Keterangan Transaksi", "Tipe (IN/OUT)", "Nominal (Rp)"],
        ...rawFin.map((f: any) => [
          f.id,
          f.date,
          f.description || f.category,
          f.type === "income" ? "IN" : "OUT",
          f.amount,
        ]),
      ];
      const wsFin = XLSX.utils.aoa_to_sheet(finData);
      XLSX.utils.book_append_sheet(workbook, wsFin, "Arus_Keuangan");

      // 7. Sheet Supplier
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

  // FULL RESET: MENGHAPUS STOK, SKU, DATABASE CLOUD SUPABASE DAN LOCAL STORAGE KESELURUHAN
  const handleFullReset = async () => {
    const confirmReset = confirm(
      "PERINGATAN DENGAN AKSES PENUH:\n\nSeluruh data stok barang, master SKU, riwayat penjualan, omset, piutang, hutang, dan keuangan di SUPABASE CLOUD DATABASE & LOCAL STORAGE akan DIHAPUS TOTAL dari nol.\n\nApakah Anda yakin ingin melakukan Full Reset?"
    );
    if (!confirmReset) return;

    setLoadingReset(true);

    try {
      // 1. HAPUS & BERSIHKAN DATA DI CLOUD DATABASE SUPABASE (Termasuk Produk & Stok)
      await supabase.from("tw_sales_history").delete().neq("id", "0");
      await supabase.from("tw_products").delete().neq("skuCode", "0");
      
      // Bersihkan tabel master SKU jika ada di Supabase
      try {
        await supabase.from("tw_master_sku").delete().neq("skuCode", "0");
        await supabase.from("tw_customers").delete().neq("id", "0");
        await supabase.from("tw_suppliers").delete().neq("id", "0");
        await supabase.from("tw_debts").delete().neq("id", "0");
        await supabase.from("tw_finances").delete().neq("id", "0");
      } catch (errDb) {
        // Abaikan jika tabel pendukung belum ada
      }

      // 2. HAPUS SELURUH KEY LOCAL STORAGE TERKAIT STOK & PRODUK
      const keysToRemove = [
        "tw_master_sku",
        "tw_products",
        "tw_sales_history",
        "tw_pembelian",
        "tw_purchases",
        "kasirq_piutang",
        "kasirq_hutang",
        "tw_financials",
        "kasirq_keuangan",
        "tw_cash_flow",
        "tw_expenses",
        "tw_incomes",
        "kasirq_saldo",
        "tw_suppliers",
        "tw_customers",
        "kasirq_pelanggan",
      ];

      keysToRemove.forEach((key) => {
        localStorage.removeItem(key);
      });

      // Iterasi pembersihan cadangan seluruh memori lokal
      const allKeys = Object.keys(localStorage);
      allKeys.forEach((key) => {
        if (key.startsWith("tw_") || key.startsWith("kasirq_")) {
          if (
            key !== "tw_store_name" &&
            key !== "tw_app_name" &&
            key !== "tw_store_address" &&
            key !== "tw_store_phone"
          ) {
            localStorage.removeItem(key);
          }
        }
      });

      window.dispatchEvent(new Event("storage"));
      alert("✓ BERHASIL FULL RESET! Seluruh stok barang, master SKU, dan data Cloud Supabase telah bersih total (0).");
      window.location.reload();
    } catch (err: any) {
      alert("Gagal mereset data Supabase Cloud: " + (err.message || err));
    } finally {
      setLoadingReset(false);
    }
  };

  const featureList: { key: keyof FeatureSettings; title: string; desc: string }[] = [
    { key: "barang", title: "Modul Barang (Inventaris)", desc: "Monitoring saldo stok barang real-time" },
    { key: "kodeBarang", title: "Modul Kode Barang (SKU)", desc: "Katalog master data SKU dan penetapan harga" },
    { key: "pelanggan", title: "Modul Pelanggan", desc: "Manajemen database pelanggan & member" },
    { key: "supplier", title: "Modul Supplier", desc: "Database pemasok/supplier toko" },
    { key: "pembelian", title: "Modul Hutang & Piutang / Pelunasan Bon", desc: "Pencatatan bon pelanggan & pelunasan piutang" },
    { key: "penjualan", title: "Modul Penjualan & Laporan", desc: "Laporan riwayat transaksi penjualan" },
    { key: "keuangan", title: "Modul Keuangan", desc: "Catatan arus kas, pemasukan, dan pengeluaran" },
  ];

  return (
    <div className="tw-main" style={{ animation: "fadeIn 0.3s ease-in-out", width: "100%", boxSizing: "border-box" }}>
      
      {/* TOPBAR DENGAN CARD HEADER SOLID ELEGAN */}
      <header className="tw-topbar" style={{ background: "transparent", borderBottom: "none", padding: "16px 24px 0 24px" }}>
        <div className="tw-header-card" style={{ width: "100%", backgroundColor: "#FFFFFF", border: "1px solid #CBD5E1", borderRadius: "10px", padding: "12px 20px", boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div className="tw-breadcrumb">
            <strong style={{ color: "#0F172A", fontSize: "0.95rem", fontWeight: "700" }}>PENGATURAN APLIKASI &amp; IDENTITAS TOKO</strong>
          </div>
          <div className="tw-topbar-right" style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span
              className="tw-live-badge"
              style={{
                backgroundColor: isOnline ? "#D1FAE5" : "#FEE2E2",
                color: isOnline ? "#065F46" : "#991B1B",
                borderColor: isOnline ? "#A7F3D0" : "#FCA5A5",
                fontSize: "0.75rem",
                fontWeight: "600"
              }}
            >
              <span
                className="tw-status-dot"
                style={{
                  backgroundColor: isOnline ? "#059669" : "#DC2626",
                  boxShadow: isOnline ? "0 0 8px #059669" : "0 0 8px #DC2626",
                }}
              />
              {isOnline ? "ONLINE" : "OFFLINE"}
            </span>
          </div>
        </div>
      </header>

      <div className="tw-content" style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "20px", padding: "24px" }}>
        
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          
          {/* PANEL FORM PENGATURAN & IDENTITAS TOKO */}
          <div className="tw-card" style={{ backgroundColor: "#FFFFFF", border: "1px solid #CBD5E1", borderRadius: "12px", padding: "18px", display: "flex", flexDirection: "column", gap: "16px", boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)" }}>
            <h3 className="tw-card-title" style={{ margin: 0, color: "#0F172A", fontSize: "1rem", fontWeight: "600" }}>Pengaturan Aplikasi &amp; Identitas Toko</h3>

            {message && (
              <div style={{ padding: "12px", background: "#D1FAE5", color: "#065F46", borderRadius: "8px", fontSize: "0.85rem", fontWeight: "600", border: "1px solid #A7F3D0" }}>
                ✓ {message}
              </div>
            )}

            <form onSubmit={handleSaveSettings} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", color: "#334155", marginBottom: "4px", fontWeight: "600" }}>Nama Aplikasi</label>
                  <input
                    type="text"
                    value={appName}
                    onChange={(e) => setAppName(e.target.value)}
                    style={{ width: "100%", padding: "8px 12px", background: "#FFFFFF", border: "1px solid #CBD5E1", borderRadius: "8px", color: "#0F172A", fontSize: "0.85rem", fontWeight: "500" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", color: "#334155", marginBottom: "4px", fontWeight: "600" }}>Nama Toko / Brand</label>
                  <input
                    type="text"
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    style={{ width: "100%", padding: "8px 12px", background: "#FFFFFF", border: "1px solid #CBD5E1", borderRadius: "8px", color: "#0F172A", fontSize: "0.85rem", fontWeight: "500" }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.8rem", color: "#334155", marginBottom: "4px", fontWeight: "600" }}>Alamat Lengkap Toko</label>
                <textarea
                  value={storeAddress}
                  onChange={(e) => setStoreAddress(e.target.value)}
                  rows={2}
                  style={{ width: "100%", padding: "8px 12px", background: "#FFFFFF", border: "1px solid #CBD5E1", borderRadius: "8px", color: "#0F172A", fontSize: "0.85rem", fontWeight: "500", resize: "none" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", color: "#334155", marginBottom: "4px", fontWeight: "600" }}>No. Telepon Toko</label>
                  <input
                    type="text"
                    value={storePhone}
                    onChange={(e) => setStorePhone(e.target.value)}
                    style={{ width: "100%", padding: "8px 12px", background: "#FFFFFF", border: "1px solid #CBD5E1", borderRadius: "8px", color: "#0F172A", fontSize: "0.85rem", fontWeight: "500" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", color: "#334155", marginBottom: "4px", fontWeight: "600" }}>Ukuran Struk Thermal</label>
                  <select
                    value={thermalSize}
                    onChange={(e) => setThermalSize(e.target.value)}
                    style={{ width: "100%", padding: "8px 12px", background: "#FFFFFF", border: "1px solid #CBD5E1", borderRadius: "8px", color: "#0F172A", fontSize: "0.85rem", fontWeight: "500" }}
                  >
                    <option value="80 mm (Standar POS)">80 mm (Standar POS)</option>
                    <option value="58 mm (Mini Thermal)">58 mm (Mini Thermal)</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.8rem", color: "#334155", marginBottom: "6px", fontWeight: "600" }}>Cetak Struk (Header &amp; Footer)</label>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  <div>
                    <span style={{ fontSize: "0.75rem", color: "#64748B", display: "block", marginBottom: "2px", fontWeight: "500" }}>Header Struk</span>
                    <input
                      type="text"
                      value={headerReceipt}
                      onChange={(e) => setHeaderReceipt(e.target.value)}
                      style={{ width: "100%", padding: "8px 12px", background: "#FFFFFF", border: "1px solid #CBD5E1", borderRadius: "8px", color: "#0F172A", fontSize: "0.85rem", fontWeight: "500" }}
                    />
                  </div>
                  <div>
                    <span style={{ fontSize: "0.75rem", color: "#64748B", display: "block", marginBottom: "2px", fontWeight: "500" }}>Footer Struk</span>
                    <input
                      type="text"
                      value={footerReceipt}
                      onChange={(e) => setFooterReceipt(e.target.value)}
                      style={{ width: "100%", padding: "8px 12px", background: "#FFFFFF", border: "1px solid #CBD5E1", borderRadius: "8px", color: "#0F172A", fontSize: "0.85rem", fontWeight: "500" }}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.8rem", color: "#334155", marginBottom: "6px", fontWeight: "600" }}>Pengaturan Pajak (PPN &amp; PPh)</label>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px", background: "#F8FAFC", padding: "12px", borderRadius: "8px", border: "1px solid #E2E8F0" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.85rem", cursor: "pointer", color: "#0F172A", fontWeight: "500" }}>
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
                        style={{ width: "60px", padding: "4px 8px", textAlign: "center", background: "#FFFFFF", border: "1px solid #CBD5E1", borderRadius: "6px", color: "#0F172A", fontWeight: "600" }}
                      />
                      <span style={{ fontSize: "0.85rem", color: "#334155", fontWeight: "600" }}>%</span>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center" }}>
                    <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.85rem", cursor: "pointer", color: "#0F172A", fontWeight: "500" }}>
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

              <button type="submit" className="tw-btn tw-btn-primary" style={{ padding: "12px", fontWeight: "600", marginTop: "8px", background: "#059669", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "0.9rem" }}>
                Simpan Perubahan Pengaturan
              </button>
            </form>
          </div>

          {/* PANEL KARTU MANAGEMENT TOGGLE MODUL / FITUR */}
          <div className="tw-card" style={{ backgroundColor: "#FFFFFF", border: "1px solid #CBD5E1", borderRadius: "12px", padding: "18px", display: "flex", flexDirection: "column", gap: "16px", boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)" }}>
            <div>
              <h3 className="tw-card-title" style={{ margin: 0, color: "#0F172A", fontSize: "1rem", fontWeight: "600" }}>Pengaturan Fitur &amp; Modul KasirQ</h3>
              <span style={{ fontSize: "0.75rem", color: "#64748B", fontWeight: "500" }}>
                Aktifkan atau nonaktifkan modul yang tidak digunakan agar tampilan navigasi sidebar lebih ringkas.
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {featureList.map((item) => {
                const isEnabled = features[item.key];
                return (
                  <div
                    key={item.key}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "12px",
                      background: "#F8FAFC",
                      border: "1px solid #E2E8F0",
                      borderRadius: "10px",
                    }}
                  >
                    <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                      <span style={{ fontWeight: "600", fontSize: "0.85rem", color: isEnabled ? "#0F172A" : "#64748B" }}>
                        {item.title}
                      </span>
                      <span style={{ fontSize: "0.75rem", color: "#64748B", fontWeight: "500" }}>{item.desc}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggleFeature(item.key)}
                      style={{
                        padding: "6px 14px",
                        borderRadius: "8px",
                        border: isEnabled ? "1px solid #A7F3D0" : "1px solid #FCA5A5",
                        fontWeight: "600",
                        fontSize: "0.75rem",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                        background: isEnabled ? "#D1FAE5" : "#FEE2E2",
                        color: isEnabled ? "#065F46" : "#991B1B",
                      }}
                    >
                      {isEnabled ? "Aktif" : "Non-Aktif"}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* KOLOM KANAN: BACKUP & FULL RESET */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          
          <div className="tw-card" style={{ backgroundColor: "#FFFFFF", border: "1px solid #CBD5E1", borderRadius: "12px", padding: "18px", boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)" }}>
            <h3 className="tw-card-title" style={{ fontSize: "1rem", color: "#0F172A", fontWeight: "600", marginBottom: "6px" }}>Backup All Data &amp; Export Excel</h3>
            <p style={{ fontSize: "0.8rem", color: "#64748B", fontWeight: "500", marginBottom: "16px" }}>
              Unduh database toko Anda dalam berkas spreadsheet multi-sheet.
            </p>
            <button
              onClick={handleExportExcel}
              style={{
                width: "100%",
                background: "#059669",
                color: "#ffffff",
                padding: "12px",
                borderRadius: "8px",
                border: "none",
                fontWeight: "600",
                fontSize: "0.85rem",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                boxShadow: "0 4px 12px rgba(5, 150, 105, 0.2)",
              }}
            >
              <span>📊</span>Backup Database (.xlsx)
            </button>
          </div>

          <div className="tw-card" style={{ border: "1px solid #FCA5A5", background: "#FEF2F2", borderRadius: "12px", padding: "18px", boxShadow: "0 4px 12px rgba(220, 38, 38, 0.05)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
              <span>⚠️</span>
              <h3 className="tw-card-title" style={{ fontSize: "1rem", color: "#991B1B", fontWeight: "600", margin: 0 }}>Full Reset (Mulai dari 0)</h3>
            </div>
            <p style={{ fontSize: "0.8rem", color: "#7F1D1D", fontWeight: "500", marginBottom: "16px" }}>
              Hapus seluruh pengelolaan dan penyimpanan, 
              *Dianjurkan untuk melakukan Backup Database
            </p>
            <button
              onClick={handleFullReset}
              disabled={loadingReset}
              style={{
                width: "100%",
                background: "#DC2626",
                color: "#ffffff",
                padding: "12px",
                borderRadius: "8px",
                border: "none",
                fontWeight: "600",
                fontSize: "0.85rem",
                cursor: loadingReset ? "wait" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                boxShadow: "0 4px 12px rgba(220, 38, 38, 0.2)",
              }}
            >
              <span>🔄</span> {loadingReset ? "Mereset Cloud & Local..." : "Reset Semua Data"}
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}