"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

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

  const loadDashboardData = async () => {
    const savedStore = localStorage.getItem("tw_store_name");
    if (savedStore) setStoreName(savedStore);

    let products: any[] = [];
    let rawSales: any[] = [];
    let debts: any[] = [];

    try {
      const { data: prodData } = await supabase.from("tw_products").select("*");
      if (prodData) {
        products = prodData;
        localStorage.setItem("tw_products", JSON.stringify(prodData));
      } else {
        products = JSON.parse(localStorage.getItem("tw_products") || "[]");
      }

      const { data: salesData } = await supabase.from("tw_sales_history").select("*");
      if (salesData) {
        rawSales = salesData;
        localStorage.setItem("tw_sales_history", JSON.stringify(salesData));
      } else {
        rawSales = JSON.parse(localStorage.getItem("tw_sales_history") || "[]");
      }

      const { data: debtData } = await supabase.from("tw_debts").select("*");
      if (debtData) {
        debts = debtData;
        localStorage.setItem("kasirq_piutang", JSON.stringify(debtData));
      } else {
        debts = JSON.parse(localStorage.getItem("kasirq_piutang") || "[]");
      }
    } catch (e) {
      products = JSON.parse(localStorage.getItem("tw_products") || "[]");
      rawSales = JSON.parse(localStorage.getItem("tw_sales_history") || "[]");
      debts = JSON.parse(localStorage.getItem("kasirq_piutang") || "[]");
    }

    const sales = rawSales.map((s: any) => {
      const statusText = (s.status || "").toLowerCase();
      const isBon = statusText.includes("bon") || statusText.includes("piutang") || statusText.includes("unpaid");
      const isTransfer = statusText.includes("transfer");

      const matchingDebt = debts.find((d: any) => d.trxid === s.id || d.trxId === s.id || d.id === s.id);
      const isDebtPaidOff = matchingDebt && (matchingDebt.status === "Terbayar" || matchingDebt.status === "Lunas" || Number(matchingDebt.remainingamount ?? matchingDebt.remainingAmount ?? 0) <= 0);

      let resolvedMethod = "Tunai";
      if (isBon) {
        resolvedMethod = isDebtPaidOff ? "Terbayar" : "Bon";
      } else if (isTransfer) {
        resolvedMethod = "Transfer";
      }

      return {
        ...s,
        paymentMethod: resolvedMethod,
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
      .filter((d: any) => {
        const st = (d.status || "").toLowerCase();
        const rem = Number(d.remainingamount ?? d.remainingAmount ?? d.amount ?? 0);
        return st !== "lunas" && st !== "terbayar" && rem > 0;
      })
      .reduce((sum: number, d: any) => sum + Number(d.remainingamount ?? d.remainingAmount ?? d.amount ?? 0), 0);

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

    const prodChannel = supabase
      .channel("public:tw_products_dash")
      .on("postgres_changes", { event: "*", schema: "public", table: "tw_products" }, () => {
        loadDashboardData();
      })
      .subscribe();

    const salesChannel = supabase
      .channel("public:tw_sales_dash")
      .on("postgres_changes", { event: "*", schema: "public", table: "tw_sales_history" }, () => {
        loadDashboardData();
      })
      .subscribe();

    const debtsChannel = supabase
      .channel("public:tw_debts_dash")
      .on("postgres_changes", { event: "*", schema: "public", table: "tw_debts" }, () => {
        loadDashboardData();
      })
      .subscribe();

    const handleStorageChange = () => loadDashboardData();
    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      supabase.removeChannel(prodChannel);
      supabase.removeChannel(salesChannel);
      supabase.removeChannel(debtsChannel);
    };
  }, []);

  return (
    <div className="tw-main" style={{ animation: "fadeIn 0.3s ease-in-out", width: "100%", boxSizing: "border-box" }}>
      
      {/* RUNNING TEXT ATAS (Hitam Gradasi Gelap & Putih Bersih Menyala) */}
      <div 
        style={{
          background: "linear-gradient(135deg, #090D16 0%, #1E293B 50%, #020617 100%)",
          color: "#FFFFFF", // Putih bersih menyala
          padding: "14px 0",
          overflow: "hidden",
          whiteSpace: "nowrap",
          position: "relative",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.5)",
          borderBottom: "2px solid #334155"
        }}
      >
        <div 
          style={{
            display: "inline-block",
            animation: "marqueeLoop 28s linear infinite",
            fontWeight: "600",
            fontSize: "0.95rem",
            letterSpacing: "1.5px",
            textTransform: "uppercase",
            textShadow: "0 0 10px rgba(255, 255, 255, 0.4)"
          }}
        >
          <span>✨ SELAMAT DATANG DI {storeName.toUpperCase()} — PUSAT MANAJEMEN RETAIL &amp; KASIR DIGITAL TERINTEGRASI SUPABASE ✨ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 🚀 KELOLA STOK, OMSET, PROFIT, DAN PIUTANG PELANGGAN SECARA REAL-TIME 🚀 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 💼 SIAP MELAYANI TRANSAKSI PENJUALAN HARIAN LINTAS PERANGKAT 💼</span>
        </div>

        <style jsx>{`
          @keyframes marqueeLoop {
            0% { transform: translateX(100%); }
            100% { transform: translateX(-100%); }
          }
        `}</style>
      </div>

      {/* TOPBAR */}
      <header className="tw-topbar">
        <div className="tw-breadcrumb">
          <strong>DASHBOARD INTERAKTIF</strong>
        </div>
      </header>

      <div className="tw-content" style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "20px" }}>
        
        {/* KARTU STATISTIK UTAMA (WARNA LATAR SOLID) */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
          
          {/* Kartu 1: Omset Penjualan (Solid Toska Tua) */}
          <div style={{ backgroundColor: "#0D9488", borderRadius: "12px", padding: "20px", display: "flex", flexDirection: "column", gap: "6px", boxShadow: "0 4px 10px rgba(0, 0, 0, 0.05)", color: "#FFFFFF" }}>
            <span style={{ fontSize: "0.8rem", fontWeight: "600", opacity: 0.9, textTransform: "uppercase", letterSpacing: "0.5px" }}>Total Omset Penjualan</span>
            <strong style={{ fontSize: "1.5rem", fontWeight: "700", letterSpacing: "0.5px" }}>Rp {stats.totalRevenue.toLocaleString("id-ID")}</strong>
            <span style={{ fontSize: "0.75rem", fontWeight: "500", opacity: 0.9 }}>Dari {stats.totalSales} nota transaksi</span>
          </div>

          {/* Kartu 2: Keuntungan / Profit (Solid Biru Korporat) */}
          <div style={{ backgroundColor: "#0284C7", borderRadius: "12px", padding: "20px", display: "flex", flexDirection: "column", gap: "6px", boxShadow: "0 4px 10px rgba(0, 0, 0, 0.05)", color: "#FFFFFF" }}>
            <span style={{ fontSize: "0.8rem", fontWeight: "600", opacity: 0.9, textTransform: "uppercase", letterSpacing: "0.5px" }}>Estimasi Keuntungan (Profit)</span>
            <strong style={{ fontSize: "1.5rem", fontWeight: "700", letterSpacing: "0.5px" }}>Rp {stats.totalProfit.toLocaleString("id-ID")}</strong>
            <span style={{ fontSize: "0.75rem", fontWeight: "500", opacity: 0.9 }}>Akumulasi margin jual - modal</span>
          </div>

          {/* Kartu 3: Piutang / Bon Aktif (Solid Amber/Oranye Gelap) */}
          <div style={{ backgroundColor: "#D97706", borderRadius: "12px", padding: "20px", display: "flex", flexDirection: "column", gap: "6px", boxShadow: "0 4px 10px rgba(0, 0, 0, 0.05)", color: "#FFFFFF" }}>
            <span style={{ fontSize: "0.8rem", fontWeight: "600", opacity: 0.9, textTransform: "uppercase", letterSpacing: "0.5px" }}>Total Piutang / Bon Aktif</span>
            <strong style={{ fontSize: "1.5rem", fontWeight: "700", letterSpacing: "0.5px" }}>Rp {stats.totalDebts.toLocaleString("id-ID")}</strong>
            <Link href="/piutang" style={{ fontSize: "0.75rem", color: "#FEF3C7", textDecoration: "underline", fontWeight: "600" }}>Kelola &amp; Lunasi Bon →</Link>
          </div>

          {/* Kartu 4: Katalog Produk (Solid Ungu Tua) */}
          <div style={{ backgroundColor: "#7C3AED", borderRadius: "12px", padding: "20px", display: "flex", flexDirection: "column", gap: "6px", boxShadow: "0 4px 10px rgba(0, 0, 0, 0.05)", color: "#FFFFFF" }}>
            <span style={{ fontSize: "0.8rem", fontWeight: "600", opacity: 0.9, textTransform: "uppercase", letterSpacing: "0.5px" }}>Total Katalog Produk</span>
            <strong style={{ fontSize: "1.5rem", fontWeight: "700", letterSpacing: "0.5px" }}>{stats.totalProducts} Item</strong>
            <span style={{ fontSize: "0.75rem", fontWeight: "500", opacity: 0.9 }}>{lowStockItems.length} item stok menipis</span>
          </div>

        </div>

        {/* SECTION PERINGATAN LOW STOCK & TRANSAKSI TERAKHIR */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
          
          {/* Card Stok Menipis */}
          <div className="tw-card" style={{ backgroundColor: "#FFFFFF", border: "1px solid #CBD5E1", borderRadius: "12px", padding: "18px", display: "flex", flexDirection: "column", gap: "14px", boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0, fontSize: "0.95rem", color: lowStockItems.length > 0 ? "#DC2626" : "#059669", fontWeight: "800" }}>
                ⚠️ Peringatan Stok Menipis ({lowStockItems.length})
              </h3>
            </div>

            <div style={{ overflowX: "auto", maxHeight: "280px", overflowY: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem", textAlign: "left" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid #E2E8F0", color: "#334155" }}>
                    <th style={{ padding: "10px", fontWeight: "800" }}>Kode SKU</th>
                    <th style={{ padding: "10px", fontWeight: "800" }}>Nama Barang</th>
                    <th style={{ padding: "10px", textAlign: "right", fontWeight: "800" }}>Sisa Stok</th>
                  </tr>
                </thead>
                <tbody>
                  {lowStockItems.length === 0 ? (
                    <tr>
                      <td colSpan={3} style={{ padding: "20px", textAlign: "center", color: "#64748B", fontWeight: "600" }}>
                        ✓ Aman! Semua stok produk berada di atas batas minimum.
                      </td>
                    </tr>
                  ) : (
                    lowStockItems.map((item, idx) => (
                      <tr key={idx} style={{ borderBottom: "1px solid #F1F5F9" }}>
                        <td style={{ padding: "10px", color: "#0284C7", fontWeight: "700" }}>{item.skuCode}</td>
                        <td style={{ padding: "10px", color: "#0F172A", fontWeight: "800" }}>{item.name}</td>
                        <td style={{ padding: "10px", textAlign: "right", color: "#DC2626", fontWeight: "900" }}>{item.stock} {item.unit || "pcs"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Card Aktivitas Penjualan Terakhir */}
          <div className="tw-card" style={{ backgroundColor: "#FFFFFF", border: "1px solid #CBD5E1", borderRadius: "12px", padding: "18px", display: "flex", flexDirection: "column", gap: "14px", boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)" }}>
            <h3 style={{ margin: 0, fontSize: "0.95rem", color: "#0F172A", fontWeight: "800" }}>Aktivitas Penjualan Terakhir</h3>

            <div style={{ overflowX: "auto", maxHeight: "280px", overflowY: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem", textAlign: "left" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid #E2E8F0", color: "#334155" }}>
                    <th style={{ padding: "10px", fontWeight: "800" }}>ID Trx / Waktu</th>
                    <th style={{ padding: "10px", fontWeight: "800" }}>Status Pembayaran</th>
                    <th style={{ padding: "10px", textAlign: "right", fontWeight: "800" }}>Total (Rp)</th>
                  </tr>
                </thead>
                <tbody>
                  {recentSales.length === 0 ? (
                    <tr>
                      <td colSpan={3} style={{ padding: "20px", textAlign: "center", color: "#64748B", fontWeight: "600" }}>
                        Belum ada riwayat transaksi penjualan kasir.
                      </td>
                    </tr>
                  ) : (
                    recentSales.map((sale, idx) => {
                      const method = sale.paymentMethod;
                      const isBon = method === "Bon";
                      const isTerbayar = method === "Terbayar";
                      const isTransfer = method === "Transfer";
                      
                      return (
                        <tr key={idx} style={{ borderBottom: "1px solid #F1F5F9" }}>
                          <td style={{ padding: "10px" }}>
                            <strong style={{ color: "#0284C7", display: "block", fontWeight: "800" }}>{sale.id}</strong>
                            <small style={{ color: "#64748B", fontSize: "0.75rem", fontWeight: "600" }}>{sale.date ? new Date(sale.date).toLocaleString("id-ID") : "-"}</small>
                          </td>
                          <td style={{ padding: "10px" }}>
                            <span style={{ 
                              padding: "3px 8px", 
                              borderRadius: "6px", 
                              background: isBon ? "#FEE2E2" : isTerbayar ? "#D1FAE5" : isTransfer ? "#E0F2FE" : "#D1FAE5", 
                              color: isBon ? "#991B1B" : isTerbayar ? "#065F46" : isTransfer ? "#0369A1" : "#065F46", 
                              fontSize: "0.75rem", 
                              fontWeight: "900" 
                            }}>
                              {method}
                            </span>
                          </td>
                          <td style={{ padding: "10px", textAlign: "right", color: "#D97706", fontWeight: "900" }}>
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