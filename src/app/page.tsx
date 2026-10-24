"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function DashboardPage() {
  const [storeName, setStoreName] = useState("Toko Wiwid");
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalSales: 0,
    totalRevenue: 0,
    totalProfit: 0,
    totalDebts: 0,
  });
  const [lowStockItems, setLowStockItems] = useState<any[]>([]);
  const [recentSales, setRecentSales] = useState<any[]>([]);

  const loadDashboardData = () => {
    const savedStore = localStorage.getItem("tw_store_name");
    if (savedStore) setStoreName(savedStore);

    const products = JSON.parse(localStorage.getItem("tw_products") || "[]");
    const rawSales = JSON.parse(localStorage.getItem("tw_sales_history") || "[]");
    const debts = JSON.parse(localStorage.getItem("kasirq_piutang") || "[]");

    // NORMALISASI DATA PENJUALAN AGAR KONSISTEN DENGAN PAYMENTMETHOD KASIR & PENJUALAN
    const sales = rawSales.map((s: any) => {
      const method = s.paymentMethod || s.paymentType || "tunai";
      const isBon = method === "bon" || (s.pay === 0 && s.customerName && s.customerName !== "Umum");
      return {
        ...s,
        paymentMethod: isBon ? "bon" : "tunai"
      };
    });

    let totalRev = 0;
    let totalProf = 0;

    sales.forEach((s: any) => {
      totalRev += s.total || 0;
      if (s.items && Array.isArray(s.items)) {
        s.items.forEach((it: any) => {
          const buyP = it.buyPrice || 0;
          const sellP = it.sellPrice || 0;
          const qty = it.qty || 0;
          totalProf += (sellP - buyP) * qty;
        });
      }
    });

    const activeDebts = debts
      .filter((d: any) => d.status !== "Lunas")
      .reduce((sum: number, d: any) => sum + (d.remainingAmount || 0), 0);

    const lowStock = products.filter((p: any) => Number(p.stock || 0) <= 5);

    setStats({
      totalProducts: products.length,
      totalSales: sales.length,
      totalRevenue: totalRev,
      totalProfit: totalProf,
      totalDebts: activeDebts,
    });

    setLowStockItems(lowStock);
    setRecentSales(sales.slice(0, 5));
  };

  useEffect(() => {
    loadDashboardData();
    const handleStorageChange = () => loadDashboardData();
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  return (
    <div className="tw-main" style={{ animation: "fadeIn 0.3s ease-in-out", width: "100%", boxSizing: "border-box" }}>
      
      {/* RUNNING TEXT ELEGAN, KECEPATAN PAS, & ADA JEDA BERSIH */}
      <div 
        style={{
          background: "linear-gradient(135deg, #0284c7 0%, #0369a1 50%, #38bdf8 100%)",
          color: "#ffffff",
          padding: "12px 0",
          overflow: "hidden",
          whiteSpace: "nowrap",
          position: "relative",
          boxShadow: "0 4px 20px rgba(2, 132, 199, 0.4)",
          borderBottom: "1px solid rgba(255, 255, 255, 0.2)"
        }}
      >
        <div 
          style={{
            display: "inline-block",
            animation: "marqueeLoop 28s linear infinite",
            fontWeight: "800",
            fontSize: "0.9rem",
            letterSpacing: "1.5px",
            textTransform: "uppercase",
            textShadow: "0 2px 5px rgba(0,0,0,0.4)"
          }}
        >
          <span>✨ SELAMAT DATANG DI {storeName.toUpperCase()} — PUSAT MANAJEMEN RETAIL &amp; KASIR DIGITAL TERINTEGRASI ✨ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 🚀 KELOLA STOK, OMSET, PROFIT, DAN PIUTANG PELANGGAN DENGAN MUDAH &amp; AKURAT 🚀 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 💼 SIAP MELAYANI TRANSAKSI PENJUALAN HARIAN DENGAN CEPAT &amp; HANDAL 💼</span>
        </div>

        <style jsx>{`
          @keyframes marqueeLoop {
            0% { transform: translateX(100%); }
            100% { transform: translateX(-100%); }
          }
        `}</style>
      </div>

      <header className="tw-topbar">
        <div className="tw-breadcrumb">
          Workspace <span>/</span> <strong>Dashboard Interaktif ({storeName})</strong>
        </div>
      </header>

      <div className="tw-content" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "20px" }}>
        
        {/* KARTU STATISTIK UTAMA */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
          
          <div className="tw-card" style={{ display: "flex", flexDirection: "column", gap: "8px", borderLeft: "4px solid #f59e0b" }}>
            <span style={{ fontSize: "0.75rem", color: "var(--tw-muted)" }}>Total Omset Penjualan</span>
            <strong style={{ fontSize: "1.4rem", color: "#f59e0b" }}>Rp {stats.totalRevenue.toLocaleString("id-ID")}</strong>
            <span style={{ fontSize: "0.7rem", color: "var(--tw-muted)" }}>Dari {stats.totalSales} nota transaksi</span>
          </div>

          <div className="tw-card" style={{ display: "flex", flexDirection: "column", gap: "8px", borderLeft: "4px solid #10b981" }}>
            <span style={{ fontSize: "0.75rem", color: "var(--tw-muted)" }}>Estimasi Keuntungan (Profit)</span>
            <strong style={{ fontSize: "1.4rem", color: "#10b981" }}>Rp {stats.totalProfit.toLocaleString("id-ID")}</strong>
            <span style={{ fontSize: "0.7rem", color: "var(--tw-muted)" }}>Akumulasi margin jual - modal</span>
          </div>

          <div className="tw-card" style={{ display: "flex", flexDirection: "column", gap: "8px", borderLeft: "4px solid #ef4444" }}>
            <span style={{ fontSize: "0.75rem", color: "var(--tw-muted)" }}>Total Piutang / Bon Aktif</span>
            <strong style={{ fontSize: "1.4rem", color: "#ef4444" }}>Rp {stats.totalDebts.toLocaleString("id-ID")}</strong>
            <Link href="/piutang" style={{ fontSize: "0.7rem", color: "#38bdf8", textDecoration: "none" }}>Kelola &amp; Lunasi Bon →</Link>
          </div>

          <div className="tw-card" style={{ display: "flex", flexDirection: "column", gap: "8px", borderLeft: "4px solid #38bdf8" }}>
            <span style={{ fontSize: "0.75rem", color: "var(--tw-muted)" }}>Total Katalog Produk</span>
            <strong style={{ fontSize: "1.4rem", color: "#38bdf8" }}>{stats.totalProducts} Item</strong>
            <span style={{ fontSize: "0.7rem", color: "var(--tw-muted)" }}>{lowStockItems.length} item stok menipis</span>
          </div>

        </div>

        {/* SECTION PERINGATAN LOW STOCK & TRANSAKSI TERAKHIR */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
          
          <div className="tw-card" style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 className="tw-card-title" style={{ margin: 0, color: lowStockItems.length > 0 ? "#ef4444" : "#10b981" }}>
                ⚠️ Peringatan Stok Menipis ({lowStockItems.length})
              </h3>
            </div>

            <div style={{ overflowX: "auto", maxHeight: "280px", overflowY: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8rem", textAlign: "left" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--tw-border)", color: "var(--tw-muted)" }}>
                    <th style={{ padding: "8px" }}>Kode SKU</th>
                    <th style={{ padding: "8px" }}>Nama Barang</th>
                    <th style={{ padding: "8px", textAlign: "right" }}>Sisa Stok</th>
                  </tr>
                </thead>
                <tbody>
                  {lowStockItems.length === 0 ? (
                    <tr>
                      <td colSpan={3} style={{ padding: "20px", textAlign: "center", color: "var(--tw-muted)" }}>
                        ✓ Aman! Semua stok produk berada di atas batas minimum.
                      </td>
                    </tr>
                  ) : (
                    lowStockItems.map((item, idx) => (
                      <tr key={idx} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                        <td style={{ padding: "8px", color: "#38bdf8" }}>{item.skuCode}</td>
                        <td style={{ padding: "8px", color: "#fff", fontWeight: "bold" }}>{item.name}</td>
                        <td style={{ padding: "8px", textAlign: "right", color: "#ef4444", fontWeight: "bold" }}>{item.stock} pcs</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="tw-card" style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <h3 className="tw-card-title" style={{ margin: 0 }}>Aktivitas Penjualan Terakhir</h3>

            <div style={{ overflowX: "auto", maxHeight: "280px", overflowY: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8rem", textAlign: "left" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--tw-border)", color: "var(--tw-muted)" }}>
                    <th style={{ padding: "8px" }}>ID Trx / Waktu</th>
                    <th style={{ padding: "8px" }}>Metode</th>
                    <th style={{ padding: "8px", textAlign: "right" }}>Total (Rp)</th>
                  </tr>
                </thead>
                <tbody>
                  {recentSales.length === 0 ? (
                    <tr>
                      <td colSpan={3} style={{ padding: "20px", textAlign: "center", color: "var(--tw-muted)" }}>
                        Belum ada riwayat transaksi penjualan kasir.
                      </td>
                    </tr>
                  ) : (
                    recentSales.map((sale, idx) => {
                      const isBon = sale.paymentMethod === "bon";
                      return (
                        <tr key={idx} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                          <td style={{ padding: "8px" }}>
                            <strong style={{ color: "#38bdf8", display: "block" }}>{sale.id}</strong>
                            <small style={{ color: "var(--tw-muted)", fontSize: "0.7rem" }}>{new Date(sale.date).toLocaleString("id-ID")}</small>
                          </td>
                          <td style={{ padding: "8px" }}>
                            <span style={{ padding: "2px 6px", borderRadius: "4px", background: isBon ? "rgba(239, 68, 68, 0.15)" : "rgba(16, 185, 129, 0.15)", color: isBon ? "#ef4444" : "#10b981", fontSize: "0.7rem", fontWeight: "bold" }}>
                              {isBon ? "BON / Piutang" : "Tunai"}
                            </span>
                          </td>
                          <td style={{ padding: "8px", textAlign: "right", color: "#f59e0b", fontWeight: "bold" }}>
                            Rp {(sale.total || 0).toLocaleString("id-ID")}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}