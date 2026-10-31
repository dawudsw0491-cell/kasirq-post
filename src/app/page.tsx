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
      // 1. Ambil data produk dari Supabase
      const { data: prodData } = await supabase.from("tw_products").select("*");
      if (prodData) {
        products = prodData;
        localStorage.setItem("tw_products", JSON.stringify(prodData));
      } else {
        products = JSON.parse(localStorage.getItem("tw_products") || "[]");
      }

      // 2. Ambil data penjualan dari Supabase
      const { data: salesData } = await supabase.from("tw_sales_history").select("*");
      if (salesData) {
        rawSales = salesData;
        localStorage.setItem("tw_sales_history", JSON.stringify(salesData));
      } else {
        rawSales = JSON.parse(localStorage.getItem("tw_sales_history") || "[]");
      }

      // 3. Ambil data piutang dari Supabase (tw_debts)
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

    // Pemetaan status pembayaran dan pengecekan apakah bon sudah terbayar/lunas di tw_debts
    const sales = rawSales.map((s: any) => {
      const statusText = (s.status || "").toLowerCase();
      const isBon = statusText.includes("bon") || statusText.includes("piutang") || statusText.includes("unpaid");
      const isTransfer = statusText.includes("transfer");

      // Cek status pelunasan dari data debts (tw_debts)
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

    // Total piutang aktif hanya menghitung item yang statusnya belum lunas/terbayar
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

    // Supabase Realtime Subscriptions untuk Dashboard
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
      
      {/* RUNNING TEXT ATAS */}
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

      <div className="tw-content" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "20px" }}>
        
        {/* KARTU STATISTIK UTAMA */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
          
          <div style={{ backgroundColor: "#0B0F19", border: "1px solid #1E293B", borderRadius: "12px", padding: "18px", display: "flex", flexDirection: "column", gap: "6px", borderLeft: "4px solid #38BDF8", boxShadow: "0 4px 12px rgba(0, 0, 0, 0.4)" }}>
            <span style={{ fontSize: "0.75rem", color: "#94A3B8", fontWeight: "600" }}>Total Omset Penjualan</span>
            <strong style={{ fontSize: "1.4rem", color: "#FFFFFF", letterSpacing: "0.3px" }}>Rp {stats.totalRevenue.toLocaleString("id-ID")}</strong>
            <span style={{ fontSize: "0.7rem", color: "#CBD5E1" }}>Dari {stats.totalSales} nota transaksi</span>
          </div>

          <div style={{ backgroundColor: "#0B0F19", border: "1px solid #1E293B", borderRadius: "12px", padding: "18px", display: "flex", flexDirection: "column", gap: "6px", borderLeft: "4px solid #34D399", boxShadow: "0 4px 12px rgba(0, 0, 0, 0.4)" }}>
            <span style={{ fontSize: "0.75rem", color: "#94A3B8", fontWeight: "600" }}>Estimasi Keuntungan (Profit)</span>
            <strong style={{ fontSize: "1.4rem", color: "#FFFFFF", letterSpacing: "0.3px" }}>Rp {stats.totalProfit.toLocaleString("id-ID")}</strong>
            <span style={{ fontSize: "0.7rem", color: "#CBD5E1" }}>Akumulasi margin jual - modal</span>
          </div>

          <div style={{ backgroundColor: "#0B0F19", border: "1px solid #1E293B", borderRadius: "12px", padding: "18px", display: "flex", flexDirection: "column", gap: "6px", borderLeft: "4px solid #F59E0B", boxShadow: "0 4px 12px rgba(0, 0, 0, 0.4)" }}>
            <span style={{ fontSize: "0.75rem", color: "#94A3B8", fontWeight: "600" }}>Total Piutang / Bon Aktif</span>
            <strong style={{ fontSize: "1.4rem", color: "#FFFFFF", letterSpacing: "0.3px" }}>Rp {stats.totalDebts.toLocaleString("id-ID")}</strong>
            <Link href="/piutang" style={{ fontSize: "0.7rem", color: "#38bdf8", textDecoration: "none", fontWeight: "bold" }}>Kelola &amp; Lunasi Bon →</Link>
          </div>

          <div style={{ backgroundColor: "#0B0F19", border: "1px solid #1E293B", borderRadius: "12px", padding: "18px", display: "flex", flexDirection: "column", gap: "6px", borderLeft: "4px solid #06B6D4", boxShadow: "0 4px 12px rgba(0, 0, 0, 0.4)" }}>
            <span style={{ fontSize: "0.75rem", color: "#94A3B8", fontWeight: "600" }}>Total Katalog Produk</span>
            <strong style={{ fontSize: "1.4rem", color: "#FFFFFF", letterSpacing: "0.3px" }}>{stats.totalProducts} Item</strong>
            <span style={{ fontSize: "0.7rem", color: "#CBD5E1" }}>{lowStockItems.length} item stok menipis</span>
          </div>

        </div>

        {/* SECTION PERINGATAN LOW STOCK & TRANSAKSI TERAKHIR */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
          
          <div style={{ backgroundColor: "#0B0F19", border: "1px solid #1E293B", borderRadius: "12px", padding: "18px", display: "flex", flexDirection: "column", gap: "14px", boxShadow: "0 4px 12px rgba(0, 0, 0, 0.4)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0, fontSize: "0.95rem", color: lowStockItems.length > 0 ? "#F87171" : "#34D399", fontWeight: "700" }}>
                ⚠️ Peringatan Stok Menipis ({lowStockItems.length})
              </h3>
            </div>

            <div style={{ overflowX: "auto", maxHeight: "280px", overflowY: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8rem", textAlign: "left" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #1E293B", color: "#94A3B8" }}>
                    <th style={{ padding: "8px" }}>Kode SKU</th>
                    <th style={{ padding: "8px" }}>Nama Barang</th>
                    <th style={{ padding: "8px", textAlign: "right" }}>Sisa Stok</th>
                  </tr>
                </thead>
                <tbody>
                  {lowStockItems.length === 0 ? (
                    <tr>
                      <td colSpan={3} style={{ padding: "20px", textAlign: "center", color: "#CBD5E1" }}>
                        ✓ Aman! Semua stok produk berada di atas batas minimum.
                      </td>
                    </tr>
                  ) : (
                    lowStockItems.map((item, idx) => (
                      <tr key={idx} style={{ borderBottom: "1px solid rgba(30, 41, 59, 0.6)" }}>
                        <td style={{ padding: "8px", color: "#38bdf8", fontWeight: "600" }}>{item.skuCode}</td>
                        <td style={{ padding: "8px", color: "#FFFFFF", fontWeight: "bold" }}>{item.name}</td>
                        <td style={{ padding: "8px", textAlign: "right", color: "#F87171", fontWeight: "bold" }}>{item.stock} {item.unit || "pcs"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div style={{ backgroundColor: "#0B0F19", border: "1px solid #1E293B", borderRadius: "12px", padding: "18px", display: "flex", flexDirection: "column", gap: "14px", boxShadow: "0 4px 12px rgba(0, 0, 0, 0.4)" }}>
            <h3 style={{ margin: 0, fontSize: "0.95rem", color: "#FFFFFF", fontWeight: "700" }}>Aktivitas Penjualan Terakhir</h3>

            <div style={{ overflowX: "auto", maxHeight: "280px", overflowY: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8rem", textAlign: "left" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #1E293B", color: "#94A3B8" }}>
                    <th style={{ padding: "8px" }}>ID Trx / Waktu</th>
                    <th style={{ padding: "8px" }}>Status Pembayaran</th>
                    <th style={{ padding: "8px", textAlign: "right" }}>Total (Rp)</th>
                  </tr>
                </thead>
                <tbody>
                  {recentSales.length === 0 ? (
                    <tr>
                      <td colSpan={3} style={{ padding: "20px", textAlign: "center", color: "#CBD5E1" }}>
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
                        <tr key={idx} style={{ borderBottom: "1px solid rgba(30, 41, 59, 0.6)" }}>
                          <td style={{ padding: "8px" }}>
                            <strong style={{ color: "#38bdf8", display: "block" }}>{sale.id}</strong>
                            <small style={{ color: "#CBD5E1", fontSize: "0.7rem" }}>{sale.date ? new Date(sale.date).toLocaleString("id-ID") : "-"}</small>
                          </td>
                          <td style={{ padding: "8px" }}>
                            <span style={{ 
                              padding: "2px 6px", 
                              borderRadius: "4px", 
                              background: isBon ? "rgba(239, 68, 68, 0.2)" : isTerbayar ? "rgba(16, 185, 129, 0.2)" : isTransfer ? "rgba(56, 189, 248, 0.2)" : "rgba(16, 185, 129, 0.2)", 
                              color: isBon ? "#F87171" : isTerbayar ? "#34D399" : isTransfer ? "#38BDF8" : "#34D399", 
                              fontSize: "0.7rem", 
                              fontWeight: "bold" 
                            }}>
                              {method}
                            </span>
                          </td>
                          <td style={{ padding: "8px", textAlign: "right", color: "#FBBF24", fontWeight: "bold" }}>
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