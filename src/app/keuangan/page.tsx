"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function KeuanganPage() {
  const [salesHistory, setSalesHistory] = useState<any[]>([]);
  const [purchaseHistory, setPurchaseHistory] = useState<any[]>([]);
  const [isOnline, setIsOnline] = useState(true);

  const loadFinancialData = async () => {
    let loadedSales: any[] = [];
    let loadedPurchases: any[] = [];

    // 1. Ambil data penjualan dari Supabase / localStorage
    try {
      const { data: salesData, error: salesError } = await supabase
        .from("tw_sales_history")
        .select("*")
        .order("created_at", { ascending: false });

      if (!salesError && salesData) {
        loadedSales = salesData;
        localStorage.setItem("tw_sales_history", JSON.stringify(salesData));
      } else {
        const savedSales = localStorage.getItem("tw_sales_history");
        if (savedSales) loadedSales = JSON.parse(savedSales);
      }
    } catch (e) {
      const savedSales = localStorage.getItem("tw_sales_history");
      if (savedSales) loadedSales = JSON.parse(savedSales);
    }

    // 2. Ambil data pengeluaran/restock dari Supabase / localStorage (Aman jika tabel tw_finances belum ada)
    try {
      const { data: financeData, error: financeError } = await supabase
        .from("tw_finances")
        .select("*")
        .order("created_at", { ascending: false });

      if (!financeError && financeData) {
        loadedPurchases = financeData;
        localStorage.setItem("tw_purchase_history", JSON.stringify(financeData));
      } else {
        const savedPurchases = localStorage.getItem("tw_purchase_history");
        if (savedPurchases) loadedPurchases = JSON.parse(savedPurchases);
      }
    } catch (e) {
      const savedPurchases = localStorage.getItem("tw_purchase_history");
      if (savedPurchases) loadedPurchases = JSON.parse(savedPurchases);
    }

    setSalesHistory(loadedSales);
    setPurchaseHistory(loadedPurchases);
  };

  useEffect(() => {
    loadFinancialData();

    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    const salesChannel = supabase
      .channel("public:tw_sales_history_finance")
      .on("postgres_changes", { event: "*", schema: "public", table: "tw_sales_history" }, () => {
        loadFinancialData();
      })
      .subscribe();

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      supabase.removeChannel(salesChannel);
    };
  }, []);

  // Hanya menghitung transaksi Tunai / Transfer sebagai Kas Masuk (Bon/Piutang dikecualikan)
  const cashSalesOnly = salesHistory.filter((s: any) => {
    const statusText = (s.status || "").toLowerCase();
    return !statusText.includes("bon") && !statusText.includes("piutang") && !statusText.includes("unpaid");
  });

  const totalOmzet = cashSalesOnly.reduce((sum, trx) => sum + (trx.total || 0), 0);
  const totalModalKeluar = purchaseHistory.reduce((sum, pur) => sum + (pur.amount || pur.total || 0), 0);
  const estimatedProfit = totalOmzet - totalModalKeluar;

  return (
    <div className="tw-main" style={{ animation: "fadeIn 0.3s ease-in-out", width: "100%", boxSizing: "border-box" }}>
      <header className="tw-topbar">
        <div className="tw-breadcrumb">
          <strong>LAPORAN KEUANGAN</strong>
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
            {isOnline ? "ONLINE (SUPABASE)" : "OFFLINE"}
          </span>
        </div>
      </header>

      <div className="tw-content" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "20px" }}>
        
        {/* KARTU RINGKASAN KEUANGAN */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
          <div className="tw-card" style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <span style={{ fontSize: "0.8rem", color: "var(--tw-muted)" }}>Total Kas Masuk (Tunai/Transfer)</span>
            <strong style={{ fontSize: "1.25rem", color: "#10b981" }}>Rp {totalOmzet.toLocaleString("id-ID")}</strong>
            <small style={{ fontSize: "0.7rem", color: "var(--tw-muted)" }}>Dari {cashSalesOnly.length} transaksi lunas</small>
          </div>

          <div className="tw-card" style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <span style={{ fontSize: "0.8rem", color: "var(--tw-muted)" }}>Total Belanja / Restock</span>
            <strong style={{ fontSize: "1.25rem", color: "#ef4444" }}>Rp {totalModalKeluar.toLocaleString("id-ID")}</strong>
            <small style={{ fontSize: "0.7rem", color: "var(--tw-muted)" }}>Dari {purchaseHistory.length} catatan pengeluaran</small>
          </div>

          <div className="tw-card" style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <span style={{ fontSize: "0.8rem", color: "var(--tw-muted)" }}>Estimasi Selisih / Kas Bersih</span>
            <strong style={{ fontSize: "1.25rem", color: "#38bdf8" }}>Rp {estimatedProfit.toLocaleString("id-ID")}</strong>
            <small style={{ fontSize: "0.7rem", color: "var(--tw-muted)" }}>Kas Masuk dikurangi Pengeluaran</small>
          </div>
        </div>

        {/* TABEL DETAIL ARUS KEUANGAN */}
        <div className="tw-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h3 className="tw-card-title" style={{ margin: 0 }}>Ringkasan Aktivitas Finansial</h3>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
            
            {/* Kolom Pemasukan Kas */}
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <h4 style={{ fontSize: "0.9rem", color: "#10b981", margin: 0 }}>Pemasukan Kas Terbaru ({cashSalesOnly.length})</h4>
              <div style={{ maxHeight: "300px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "8px" }}>
                {cashSalesOnly.length === 0 ? (
                  <span style={{ fontSize: "0.8rem", color: "var(--tw-muted)" }}>Belum ada data pemasukan kas lunas.</span>
                ) : (
                  cashSalesOnly.slice(0, 10).map((s, idx) => (
                    <div key={idx} style={{ padding: "10px", background: "rgba(255,255,255,0.02)", borderRadius: "8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <strong style={{ fontSize: "0.8rem", color: "#fff", display: "block" }}>{s.id}</strong>
                        <small style={{ fontSize: "0.7rem", color: "var(--tw-muted)" }}>{s.date ? new Date(s.date).toLocaleString("id-ID") : "-"}</small>
                      </div>
                      <span style={{ fontSize: "0.85rem", fontWeight: "bold", color: "#10b981" }}>+Rp {(s.total || 0).toLocaleString("id-ID")}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Kolom Pengeluaran / Restock */}
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <h4 style={{ fontSize: "0.9rem", color: "#ef4444", margin: 0 }}>Pengeluaran Restock ({purchaseHistory.length})</h4>
              <div style={{ maxHeight: "300px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "8px" }}>
                {purchaseHistory.length === 0 ? (
                  <span style={{ fontSize: "0.8rem", color: "var(--tw-muted)" }}>Belum ada data pengeluaran/restock.</span>
                ) : (
                  purchaseHistory.slice(0, 10).map((p, idx) => (
                    <div key={idx} style={{ padding: "10px", background: "rgba(255,255,255,0.02)", borderRadius: "8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <strong style={{ fontSize: "0.8rem", color: "#fff", display: "block" }}>{p.name || p.description || "Pengeluaran"}</strong>
                        <small style={{ fontSize: "0.7rem", color: "var(--tw-muted)" }}>{p.qty ? `Qty: ${p.qty} unit` : (p.category || "")}</small>
                      </div>
                      <span style={{ fontSize: "0.85rem", fontWeight: "bold", color: "#ef4444" }}>-Rp {(p.amount || p.total || 0).toLocaleString("id-ID")}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}