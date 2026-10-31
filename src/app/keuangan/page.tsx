"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function KeuanganPage() {
  const [salesHistory, setSalesHistory] = useState<any[]>([]);
  const [financesHistory, setFinancesHistory] = useState<any[]>([]);
  const [debtsHistory, setDebtsHistory] = useState<any[]>([]);
  const [productsList, setProductsList] = useState<any[]>([]);
  const [isOnline, setIsOnline] = useState(true);

  const loadFinancialData = async () => {
    let loadedSales: any[] = [];
    let loadedFinances: any[] = [];
    let loadedDebts: any[] = [];
    let loadedProducts: any[] = [];

    try {
      // 1. Ambil data penjualan dari tw_sales_history
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

    try {
      // 2. Ambil data keuangan/pelunasan dari tw_finances
      const { data: finData, error: finError } = await supabase
        .from("tw_finances")
        .select("*")
        .order("created_at", { ascending: false });

      if (!finError && finData) {
        loadedFinances = finData;
        localStorage.setItem("tw_purchase_history", JSON.stringify(finData));
      } else {
        const savedFin = localStorage.getItem("tw_purchase_history");
        if (savedFin) loadedFinances = JSON.parse(savedFin);
      }
    } catch (e) {
      const savedFin = localStorage.getItem("tw_purchase_history");
      if (savedFin) loadedFinances = JSON.parse(savedFin);
    }

    try {
      // 3. Ambil data piutang tw_debts untuk cek status pelunasan bon
      const { data: debtData } = await supabase.from("tw_debts").select("*");
      if (debtData) {
        loadedDebts = debtData;
        localStorage.setItem("kasirq_piutang", JSON.stringify(debtData));
      } else {
        loadedDebts = JSON.parse(localStorage.getItem("kasirq_piutang") || "[]");
      }
    } catch (e) {
      loadedDebts = JSON.parse(localStorage.getItem("kasirq_piutang") || "[]");
    }

    try {
      // 4. Ambil data produk untuk total modal (buyPrice * stock)
      const { data: prodData } = await supabase.from("tw_products").select("*");
      if (prodData) {
        loadedProducts = prodData;
        localStorage.setItem("tw_products", JSON.stringify(prodData));
      } else {
        loadedProducts = JSON.parse(localStorage.getItem("tw_products") || "[]");
      }
    } catch (e) {
      loadedProducts = JSON.parse(localStorage.getItem("tw_products") || "[]");
    }

    setSalesHistory(loadedSales);
    setFinancesHistory(loadedFinances);
    setDebtsHistory(loadedDebts);
    setProductsList(loadedProducts);
  };

  useEffect(() => {
    loadFinancialData();

    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    const handleStorageChange = () => loadFinancialData();
    window.addEventListener("storage", handleStorageChange);

    const salesChannel = supabase
      .channel("public:tw_sales_history_finance_v3")
      .on("postgres_changes", { event: "*", schema: "public", table: "tw_sales_history" }, () => {
        loadFinancialData();
      })
      .subscribe();

    const financesChannel = supabase
      .channel("public:tw_finances_finance_v3")
      .on("postgres_changes", { event: "*", schema: "public", table: "tw_finances" }, () => {
        loadFinancialData();
      })
      .subscribe();

    const debtsChannel = supabase
      .channel("public:tw_debts_finance_v3")
      .on("postgres_changes", { event: "*", schema: "public", table: "tw_debts" }, () => {
        loadFinancialData();
      })
      .subscribe();

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("storage", handleStorageChange);
      supabase.removeChannel(salesChannel);
      supabase.removeChannel(financesChannel);
      supabase.removeChannel(debtsChannel);
    };
  }, []);

  // 1. Akumulasi Modal Produk (buyPrice * stock)
  const totalModalProduk = productsList.reduce((sum, p) => {
    const buy = Number(p.buyPrice ?? p.buyprice ?? 0);
    const st = Number(p.stock ?? 0);
    return sum + (buy * st);
  }, 0);

  // 2. Pengeluaran lain dari tw_finances (tipe 'Keluar')
  const totalPengeluaranLain = financesHistory
    .filter((f) => (f.type || "").toLowerCase() === "keluar")
    .reduce((sum, f) => sum + Number(f.amount || f.total || 0), 0);

  const totalModalKeseluruhan = totalModalProduk + totalPengeluaranLain;

  // 3. Pemasukan Kas: Penjualan Lunas (Tunai/Transfer) + Transaksi Bon yang sudah Lunas/Terbayar
  const penjualanLunas = salesHistory.filter((s: any) => {
    const statusText = (s.status || "").toLowerCase();
    const isBon = statusText.includes("bon") || statusText.includes("piutang") || statusText.includes("unpaid");
    
    const matchingDebt = debtsHistory.find((d: any) => d.trxid === s.id || d.trxId === s.id || d.id === s.id);
    const isDebtPaidOff = matchingDebt && (matchingDebt.status === "Terbayar" || matchingDebt.status === "Lunas" || Number(matchingDebt.remainingamount ?? matchingDebt.remainingAmount ?? 0) <= 0);

    return (!isBon) || isDebtPaidOff;
  });

  const penjualanBonAktif = salesHistory.filter((s: any) => {
    const statusText = (s.status || "").toLowerCase();
    const isBon = statusText.includes("bon") || statusText.includes("piutang") || statusText.includes("unpaid");
    
    const matchingDebt = debtsHistory.find((d: any) => d.trxid === s.id || d.trxId === s.id || d.id === s.id);
    const isDebtPaidOff = matchingDebt && (matchingDebt.status === "Terbayar" || matchingDebt.status === "Lunas" || Number(matchingDebt.remainingamount ?? matchingDebt.remainingAmount ?? 0) <= 0);

    return isBon && !isDebtPaidOff;
  });

  const pemasukanPelunasanFinances = financesHistory.filter((f: any) => {
    const type = (f.type || "").toLowerCase();
    return type === "masuk";
  });

  const totalOmzetLunas = penjualanLunas.reduce((sum, trx) => sum + (trx.total || 0), 0);
  const totalFinancesMasuk = pemasukanPelunasanFinances.reduce((sum, fin) => sum + Number(fin.amount || fin.total || 0), 0);

  const totalKasMasukKeseluruhan = totalOmzetLunas; 
  const totalPiutangBelumBayar = penjualanBonAktif.reduce((sum, trx) => sum + (trx.total || 0), 0);
  const estimatedProfit = totalKasMasukKeseluruhan - totalModalKeseluruhan;

  return (
    <div className="tw-main" style={{ animation: "fadeIn 0.3s ease-in-out", width: "100%", boxSizing: "border-box" }}>
      
      {/* TOPBAR DENGAN CARD HEADER SOLID ELEGAN */}
      <header className="tw-topbar" style={{ background: "transparent", borderBottom: "none", padding: "16px 24px 0 24px" }}>
        <div className="tw-header-card" style={{ width: "100%", backgroundColor: "#FFFFFF", border: "1px solid #CBD5E1", borderRadius: "10px", padding: "12px 20px", boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div className="tw-breadcrumb">
            <strong style={{ color: "#0F172A", fontSize: "0.95rem", fontWeight: "700" }}>LAPORAN KEUANGAN</strong>
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

      <div className="tw-content" style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "20px" }}>
        
        {/* KARTU RINGKASAN KEUANGAN */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
          
          <div className="tw-card" style={{ backgroundColor: "#FFFFFF", border: "1px solid #CBD5E1", borderRadius: "12px", padding: "18px", display: "flex", flexDirection: "column", gap: "6px", borderLeft: "4px solid #059669", boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)" }}>
            <span style={{ fontSize: "0.8rem", color: "#334155", fontWeight: "600", textTransform: "uppercase" }}>Total Kas Masuk (Lunas &amp; Pelunasan)</span>
            <strong style={{ fontSize: "1.3rem", color: "#059669", fontWeight: "700" }}>Rp {totalKasMasukKeseluruhan.toLocaleString("id-ID")}</strong>
            <span style={{ fontSize: "0.75rem", color: "#64748B", fontWeight: "500" }}>Tunai, Transfer, &amp; Bon Terbayar</span>
          </div>

          <div className="tw-card" style={{ backgroundColor: "#FFFFFF", border: "1px solid #CBD5E1", borderRadius: "12px", padding: "18px", display: "flex", flexDirection: "column", gap: "6px", borderLeft: "4px solid #DC2626", boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)" }}>
            <span style={{ fontSize: "0.8rem", color: "#334155", fontWeight: "600", textTransform: "uppercase" }}>Total Piutang / Bon Belum Lunas</span>
            <strong style={{ fontSize: "1.3rem", color: "#DC2626", fontWeight: "700" }}>Rp {totalPiutangBelumBayar.toLocaleString("id-ID")}</strong>
            <span style={{ fontSize: "0.75rem", color: "#64748B", fontWeight: "500" }}>Belum masuk kas masuk (Piutang aktif)</span>
          </div>

          <div className="tw-card" style={{ backgroundColor: "#FFFFFF", border: "1px solid #CBD5E1", borderRadius: "12px", padding: "18px", display: "flex", flexDirection: "column", gap: "6px", borderLeft: "4px solid #D97706", boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)" }}>
            <span style={{ fontSize: "0.8rem", color: "#334155", fontWeight: "600", textTransform: "uppercase" }}>Total Modal Produk</span>
            <strong style={{ fontSize: "1.3rem", color: "#D97706", fontWeight: "700" }}>Rp {totalModalKeseluruhan.toLocaleString("id-ID")}</strong>
            <span style={{ fontSize: "0.75rem", color: "#64748B", fontWeight: "500" }}>Akumulasi (Harga Beli × Qty)</span>
          </div>

          <div className="tw-card" style={{ backgroundColor: "#FFFFFF", border: "1px solid #CBD5E1", borderRadius: "12px", padding: "18px", display: "flex", flexDirection: "column", gap: "6px", borderLeft: "4px solid #0284C7", boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)" }}>
            <span style={{ fontSize: "0.8rem", color: "#334155", fontWeight: "600", textTransform: "uppercase" }}>Estimasi Selisih / Kas Bersih</span>
            <strong style={{ fontSize: "1.3rem", color: "#0284C7", fontWeight: "700" }}>Rp {estimatedProfit.toLocaleString("id-ID")}</strong>
            <span style={{ fontSize: "0.75rem", color: "#64748B", fontWeight: "500" }}>Kas Masuk dikurangi Total Modal</span>
          </div>

        </div>

        {/* TABEL DETAIL ARUS KEUANGAN */}
        <div className="tw-card" style={{ backgroundColor: "#FFFFFF", border: "1px solid #CBD5E1", borderRadius: "12px", padding: "18px", display: "flex", flexDirection: "column", gap: "16px", boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
            <h3 className="tw-card-title" style={{ margin: 0, color: "#0F172A", fontSize: "1rem", fontWeight: "600" }}>Rincian Arus Pemasukan Kas &amp; Piutang Bon</h3>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
            
            {/* Kolom Pemasukan Kas Lunas / Terbayar */}
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <h4 style={{ fontSize: "0.88rem", color: "#059669", margin: 0, fontWeight: "600" }}>Pemasukan Kas Masuk ({penjualanLunas.length})</h4>
              <div style={{ maxHeight: "320px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "8px" }}>
                {penjualanLunas.length === 0 ? (
                  <span style={{ fontSize: "0.82rem", color: "#64748B", fontWeight: "500" }}>Belum ada data pemasukan kas lunas.</span>
                ) : (
                  penjualanLunas.slice(0, 15).map((s, idx) => {
                    const statusText = (s.status || "").toLowerCase();
                    const isBonPaid = statusText.includes("bon") || statusText.includes("piutang");
                    return (
                      <div key={`lunas-${idx}`} style={{ padding: "10px", background: "#F8FAFC", borderRadius: "8px", border: "1px solid #E2E8F0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <strong style={{ fontSize: "0.8rem", color: "#0F172A", display: "block", fontWeight: "600" }}>
                            {s.id} {isBonPaid ? "(Bon Terbayar/Lunas)" : "(Tunai/Transfer)"}
                          </strong>
                          <span style={{ fontSize: "0.72rem", color: "#64748B", fontWeight: "500" }}>{s.date ? new Date(s.date).toLocaleString("id-ID") : "-"}</span>
                        </div>
                        <span style={{ fontSize: "0.85rem", fontWeight: "600", color: "#059669" }}>+Rp {(s.total || 0).toLocaleString("id-ID")}</span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Kolom Bon / Piutang Aktif */}
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <h4 style={{ fontSize: "0.88rem", color: "#DC2626", margin: 0, fontWeight: "600" }}>Bon / Piutang Belum Lunas ({penjualanBonAktif.length})</h4>
              <div style={{ maxHeight: "320px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "8px" }}>
                {penjualanBonAktif.length === 0 ? (
                  <span style={{ fontSize: "0.82rem", color: "#64748B", fontWeight: "500" }}>Tidak ada piutang bon aktif saat ini.</span>
                ) : (
                  penjualanBonAktif.slice(0, 15).map((s, idx) => (
                    <div key={`bon-${idx}`} style={{ padding: "10px", background: "#FEF2F2", borderRadius: "8px", display: "flex", justifyContent: "space-between", alignItems: "center", border: "1px solid #FCA5A5" }}>
                      <div>
                        <strong style={{ fontSize: "0.8rem", color: "#991B1B", display: "block", fontWeight: "600" }}>{s.id} (Bon - {s.customerName || "Pelanggan"})</strong>
                        <span style={{ fontSize: "0.72rem", color: "#64748B", fontWeight: "500" }}>{s.date ? new Date(s.date).toLocaleString("id-ID") : "-"}</span>
                      </div>
                      <span style={{ fontSize: "0.85rem", fontWeight: "600", color: "#DC2626" }}>Rp {(s.total || 0).toLocaleString("id-ID")}</span>
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