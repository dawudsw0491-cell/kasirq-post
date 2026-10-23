"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function DashboardPage() {
  const [todaySales, setTodaySales] = useState(0);
  const [todayTransactions, setTodayTransactions] = useState(0);
  const [netProfit, setNetProfit] = useState(0);
  const [topProduct, setTopProduct] = useState({ name: "-", count: 0 });
  const [lowStockProducts, setLowStockProducts] = useState<any[]>([]);
  const [dailyChartData, setDailyChartData] = useState<{ date: string; label: string; total: number; count: number }[]>([]);
  const [isOnline, setIsOnline] = useState(true);

  const LOW_STOCK_THRESHOLD = 5;

  useEffect(() => {
    const savedSales = localStorage.getItem("tw_sales_history") || localStorage.getItem("sales");
    let salesData: any[] = [];
    if (savedSales) {
      try {
        salesData = JSON.parse(savedSales);
      } catch (e) {
        salesData = [];
      }
    }

    const todayStr = new Date().toLocaleDateString("id-ID");
    const todayData = salesData.filter((s) => {
      const sDate = s.date ? new Date(s.date).toLocaleDateString("id-ID") : "";
      return sDate === todayStr || s.date?.includes(todayStr);
    });

    const revenueToday = todayData.reduce((acc, curr) => acc + (curr.total || curr.amount || 0), 0);
    setTodaySales(revenueToday);
    setTodayTransactions(todayData.length);
    setNetProfit(revenueToday * 0.2);

    const chartDays = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateKey = d.toLocaleDateString("id-ID");
      const dayLabel = d.toLocaleDateString("id-ID", { weekday: "short", day: "numeric", month: "short" });

      const daySalesArr = salesData.filter((s) => {
        const sDate = s.date ? new Date(s.date).toLocaleDateString("id-ID") : "";
        return sDate === dateKey || s.date?.includes(dateKey);
      });

      const dayTotal = daySalesArr.reduce((acc, curr) => acc + (curr.total || curr.amount || 0), 0);
      chartDays.push({
        date: dateKey,
        label: dayLabel,
        total: dayTotal,
        count: daySalesArr.length,
      });
    }
    setDailyChartData(chartDays);

    const savedProducts = localStorage.getItem("tw_products");
    if (savedProducts) {
      try {
        const prodData = JSON.parse(savedProducts);
        const lowStock = prodData.filter((p: any) => Number(p.stock) <= LOW_STOCK_THRESHOLD);
        setLowStockProducts(lowStock);

        if (prodData.length > 0) {
          const sorted = [...prodData].sort((a, b) => (b.stock || 0) - (a.stock || 0));
          setTopProduct({ name: sorted[0].name, count: sorted[0].stock || 0 });
        }
      } catch (e) {
        setLowStockProducts([]);
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

  const maxChartVal = Math.max(...dailyChartData.map((d) => d.total), 100000);

  return (
    <div className="tw-main" style={{ animation: "fadeIn 0.3s ease-in-out", width: "100%", boxSizing: "border-box" }}>
      <header className="tw-topbar">
        <div className="tw-breadcrumb">
          <strong>Dashboard Utama</strong>
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

          <Link href="/kasir">
            <button className="tw-btn tw-btn-primary" style={{ padding: "8px 16px", borderRadius: "20px", display: "flex", alignItems: "center", gap: "6px" }}>
              <span>▣</span> Buka Kasir
            </button>
          </Link>
        </div>
      </header>

      <div className="tw-content" style={{ display: "flex", flexDirection: "column", gap: "24px", padding: "20px" }}>
        
        {lowStockProducts.length > 0 && (
          <div
            style={{
              padding: "14px 20px",
              background: "rgba(239, 68, 68, 0.12)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              borderRadius: "12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              color: "#ef4444",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "1.2rem" }}>⚠️</span>
              <div>
                <strong style={{ fontSize: "0.9rem", display: "block", color: "#ffffff" }}>
                  Peringatan: {lowStockProducts.length} Produk Mencapai Batas Stok Menipis (≤ {LOW_STOCK_THRESHOLD} unit)
                </strong>
                <small style={{ color: "var(--tw-muted)" }}>Segera lakukan pembelian/restock barang untuk menghindari kehabisan stok penjualan.</small>
              </div>
            </div>
            <Link href="/pembelian">
              <button className="tw-btn" style={{ background: "#ef4444", color: "#ffffff", padding: "6px 14px", fontSize: "0.8rem", borderRadius: "8px" }}>
                Restock Sekarang
              </button>
            </Link>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
          
          <div className="tw-card" style={{ padding: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <span style={{ fontSize: "0.8rem", color: "var(--tw-muted)" }}>Omset Penjualan</span>
              <span style={{ fontSize: "0.75rem", padding: "2px 8px", background: "rgba(2, 132, 199, 0.15)", color: "#38bdf8", borderRadius: "12px" }}>Hari ini</span>
            </div>
            <strong style={{ fontSize: "1.4rem", color: "#ffffff", display: "block" }}>
              Rp {todaySales.toLocaleString("id-ID")}
            </strong>
            <small style={{ fontSize: "0.75rem", color: "var(--tw-muted)" }}>{todayTransactions} Transaksi hari ini</small>
          </div>

          <div className="tw-card" style={{ padding: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <span style={{ fontSize: "0.8rem", color: "var(--tw-muted)" }}>Est. Profit Bersih</span>
              <span style={{ fontSize: "0.75rem", padding: "2px 8px", background: "rgba(16, 185, 129, 0.15)", color: "#10b981", borderRadius: "12px" }}>Profit</span>
            </div>
            <strong style={{ fontSize: "1.4rem", color: "#10b981", display: "block" }}>
              Rp {netProfit.toLocaleString("id-ID")}
            </strong>
            <small style={{ fontSize: "0.75rem", color: "var(--tw-muted)" }}>Keuntungan estimasi</small>
          </div>

          <div className="tw-card" style={{ padding: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <span style={{ fontSize: "0.8rem", color: "var(--tw-muted)" }}>Produk Sering Dicari</span>
              <span style={{ fontSize: "0.75rem", padding: "2px 8px", background: "rgba(251, 191, 36, 0.15)", color: "#fbbf24", borderRadius: "12px" }}>Top</span>
            </div>
            <strong style={{ fontSize: "1.1rem", color: "#ffffff", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {topProduct.name}
            </strong>
            <small style={{ fontSize: "0.75rem", color: "var(--tw-muted)" }}>Tersedia {topProduct.count} unit</small>
          </div>

          <div className="tw-card" style={{ padding: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <span style={{ fontSize: "0.8rem", color: "var(--tw-muted)" }}>Batas Stok Menipis</span>
              <span style={{ fontSize: "0.75rem", padding: "2px 8px", background: "rgba(239, 68, 68, 0.15)", color: "#ef4444", borderRadius: "12px" }}>Alert ≤ {LOW_STOCK_THRESHOLD}</span>
            </div>
            <strong style={{ fontSize: "1.4rem", color: lowStockProducts.length > 0 ? "#ef4444" : "#10b981", display: "block" }}>
              {lowStockProducts.length} <small style={{ fontSize: "0.8rem", color: "var(--tw-muted)", fontWeight: "400" }}>produk</small>
            </strong>
            <small style={{ fontSize: "0.75rem", color: "var(--tw-muted)" }}>
              {lowStockProducts.length > 0 ? "Memerlukan restock" : "Semua stok aman"}
            </small>
          </div>

        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "20px" }}>
          
          <div className="tw-card" style={{ padding: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <div>
                <h3 className="tw-card-title" style={{ margin: 0 }}>Grafik Penjualan Real-time (7 Hari Terakhir)</h3>
                <small style={{ color: "var(--tw-muted)", fontSize: "0.8rem" }}>Akumulasi omset dari histori transaksi kasir</small>
              </div>
              <span style={{ fontSize: "0.75rem", background: "rgba(16, 185, 129, 0.15)", color: "#10b981", padding: "4px 10px", borderRadius: "10px" }}>
                ● Real-time
              </span>
            </div>

            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", height: "200px", gap: "8px", paddingTop: "20px", borderBottom: "1px solid var(--tw-border)", overflowX: "auto" }}>
              {dailyChartData.map((item, idx) => {
                const barHeightPercent = Math.max((item.total / maxChartVal) * 100, 4);
                return (
                  <div
                    key={idx}
                    style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", height: "100%", justifyContent: "flex-end", minWidth: "35px" }}
                  >
                    <span style={{ fontSize: "0.7rem", color: item.total > 0 ? "#38bdf8" : "var(--tw-muted)", fontWeight: item.total > 0 ? "600" : "400" }}>
                      {item.total > 0 ? `Rp ${(item.total / 1000).toFixed(0)}k` : "Rp 0"}
                    </span>

                    <div
                      title={`${item.label}: Rp ${item.total.toLocaleString("id-ID")} (${item.count} transaksi)`}
                      style={{
                        width: "100%",
                        maxWidth: "32px",
                        height: `${barHeightPercent}%`,
                        background: item.total > 0 ? "linear-gradient(180deg, #10b981 0%, #059669 100%)" : "rgba(255,255,255,0.05)",
                        borderRadius: "6px 6px 0 0",
                        transition: "all 0.3s ease",
                        cursor: "pointer",
                        boxShadow: item.total > 0 ? "0 2px 8px rgba(16, 185, 129, 0.3)" : "none",
                      }}
                    />

                    <span style={{ fontSize: "0.7rem", color: "#ffffff", fontWeight: "500", marginTop: "4px", whiteSpace: "nowrap" }}>{item.label}</span>
                    <small style={{ fontSize: "0.65rem", color: "var(--tw-muted)" }}>{item.count} trx</small>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="tw-card" style={{ padding: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div>
                <h3 className="tw-card-title" style={{ margin: 0 }}>Stok Menipis</h3>
                <small style={{ fontSize: "0.75rem", color: "var(--tw-muted)" }}>Batas Alert: ≤ {LOW_STOCK_THRESHOLD} unit</small>
              </div>
              <Link href="/barang" style={{ fontSize: "0.8rem", color: "#38bdf8", textDecoration: "none" }}>Manage →</Link>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxHeight: "220px", overflowY: "auto" }}>
              {lowStockProducts.length === 0 ? (
                <div style={{ padding: "30px 10px", textAlign: "center", color: "var(--tw-muted)", border: "1px dashed var(--tw-border)", borderRadius: "10px" }}>
                  <span style={{ fontSize: "1.5rem", display: "block", marginBottom: "6px" }}>✅</span>
                  <span style={{ fontSize: "0.85rem" }}>Semua stok barang tercukupi (&gt; {LOW_STOCK_THRESHOLD} unit).</span>
                </div>
              ) : (
                lowStockProducts.map((p, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "10px 12px",
                      background: "rgba(239, 68, 68, 0.05)",
                      borderRadius: "8px",
                      border: "1px solid rgba(239, 68, 68, 0.2)",
                    }}
                  >
                    <div>
                      <strong style={{ fontSize: "0.85rem", color: "#ffffff", display: "block" }}>{p.name}</strong>
                      <small style={{ fontSize: "0.75rem", color: "var(--tw-muted)" }}>Kategori: {p.category || "Umum"}</small>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <span style={{ padding: "4px 8px", background: "rgba(239, 68, 68, 0.2)", color: "#ef4444", borderRadius: "6px", fontSize: "0.75rem", fontWeight: "bold", display: "block" }}>
                        Sisa: {p.stock} unit
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}