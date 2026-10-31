"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function KeuanganPage() {
  const [salesHistory, setSalesHistory] = useState<any[]>([]);
  const [purchaseHistory, setPurchaseHistory] = useState<any[]>([]);
  const [financesHistory, setFinancesHistory] = useState<any[]>([]);
  const [productsList, setProductsList] = useState<any[]>([]);
  const [isOnline, setIsOnline] = useState(true);

  const loadFinancialData = async () => {
    let loadedSales: any[] = [];
    let loadedPurchases: any[] = [];
    let loadedFinances: any[] = [];
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
      // 2. Ambil data pengeluaran / restock dari tw_purchase_history / tw_finances
      const { data: finData, error: finError } = await supabase
        .from("tw_finances")
        .select("*")
        .order("created_at", { ascending: false });

      if (!finError && finData) {
        loadedFinances = finData;
        localStorage.setItem("tw_purchase_history", JSON.stringify(finData));
      } else {
        const savedPurchases = localStorage.getItem("tw_purchase_history");
        if (savedPurchases) loadedFinances = JSON.parse(savedPurchases);
      }
    } catch (e) {
      const savedPurchases = localStorage.getItem("tw_purchase_history");
      if (savedPurchases) loadedFinances = JSON.parse(savedPurchases);
    }

    try {
      // 3. Ambil data produk untuk perhitungan total modal (buyPrice * stock/qty)
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
      .channel("public:tw_sales_history_finance_v2")
      .on("postgres_changes", { event: "*", schema: "public", table: "tw_sales_history" }, () => {
        loadFinancialData();
      })
      .subscribe();

    const financesChannel = supabase
      .channel("public:tw_finances_finance_v2")
      .on("postgres_changes", { event: "*", schema: "public", table: "tw_finances" }, () => {
        loadFinancialData();
      })
      .subscribe();

    const productsChannel = supabase
      .channel("public:tw_products_finance_v2")
      .on("postgres_changes", { event: "*", schema: "public", table: "tw_products" }, () => {
        loadFinancialData();
      })
      .subscribe();

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("storage", handleStorageChange);
      supabase.removeChannel(salesChannel);
      supabase.removeChannel(financesChannel);
      supabase.removeChannel(productsChannel);
    };
  }, []);

  // 1. Hitung total modal produk terdaftar (buyPrice * stock)
  const totalModalProduk = productsList.reduce((sum, p) => {
    const buy = Number(p.buyPrice ?? p.buyprice ?? 0);
    const st = Number(p.stock ?? 0);
    return sum + (buy * st);
  }, 0);

  // 2. Hitung total pengeluaran dari tabel finances (termasuk restock / pengeluaran lain)
  const totalPengeluaranLain = financesHistory
    .filter((f) => (f.type || "").toLowerCase() === "keluar")
    .reduce((sum, f) => sum + Number(f.amount || f.total || 0), 0);

  const totalModalKeseluruhan = totalModalProduk + totalPengeluaranLain;

  // 3. Hitung pemasukan kas (Penjualan Tunai/Transfer + Pelunasan Piutang yang masuk ke tw_finances)
  const penjualanTunaiTransfer = salesHistory.filter((s: any) => {
    const statusText = (s.status || "").toLowerCase();
    return !statusText.includes("bon") && !statusText.includes("piutang") && !statusText.includes("unpaid");
  });

  const pemasukanPelunasanBon = financesHistory.filter((f: any) => {
    const cat = (f.category || "").toLowerCase();
    const desc = (f.description || "").toLowerCase();
    const type = (f.type || "").toLowerCase();
    return type === "masuk" && (cat.includes("pelunasan") || desc.includes("pelunasan") || desc.includes("bon"));
  });

  const totalOmzetPenjualanLunas = penjualanTunaiTransfer.reduce((sum, trx) => sum + (trx.total || 0), 0);
  const totalPemasukanPelunasan = pemasukanPelunasanBon.reduce((sum, fin) => sum + Number(fin.amount || fin.total || 0), 0);

  const totalKasMasukKeseluruhan = totalOmzetPenjualanLunas + totalPemasukanPelunasan;
  const estimatedProfit = totalKasMasukKeseluruhan - totalModalKeseluruhan;

  return (
    <div className="tw-main" style={{ animation: "fadeIn 0.3s ease-in-out", width: "100%", boxSizing: "border-box" }}>
      <header className="tw-topbar">
        <div className="tw-breadcrumb">
          <strong>LAPORAN KEUANGAN &amp; ARUS KAS</strong>
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
          <div className="tw-card" style={{ display: "flex", flexDirection: "column", gap: "8px", borderLeft: "4px solid #10b981" }}>
            <span style={{ fontSize: "0.8rem", color: "var(--tw-muted)" }}>Total Kas Masuk (Penjualan + Pelunasan)</span>
            <strong style={{ fontSize: "1.25rem", color: "#10b981" }}>Rp {totalKasMasukKeseluruhan.toLocaleString("id-ID")}</strong>
            <small style={{ fontSize: "0.7rem", color: "var(--tw-muted)" }}>Tunai/Transfer &amp; Pelunasan Bon</small>
          </div>

          <div className="tw-card" style={{ display: "flex", flexDirection: "column", gap: "8px", borderLeft: "4px solid #ef4444" }}>
            <span style={{ fontSize: "0.8rem", color: "var(--tw-muted)" }}>Total Modal Produk &amp; Pengeluaran</span>
            <strong style={{ fontSize: "1.25rem", color: "#ef4444" }}>Rp {totalModalKeseluruhan.toLocaleString("id-ID")}</strong>
            <small style={{ fontSize: "0.7rem", color: "var(--tw-muted)" }}>Akumulasi (BuyPrice × Qty Produk) + Biaya</small>
          </div>

          <div className="tw-card" style={{ display: "flex", flexDirection: "column", gap: "8px", borderLeft: "4px solid #38bdf8" }}>
            <span style={{ fontSize: "0.8rem", color: "var(--tw-muted)" }}>Estimasi Selisih / Kas Bersih</span>
            <strong style={{ fontSize: "1.25rem", color: "#38bdf8" }}>Rp {estimatedProfit.toLocaleString("id-ID")}</strong>
            <small style={{ fontSize: "0.7rem", color: "var(--tw-muted)" }}>Kas Masuk dikurangi Total Modal</small>
          </div>
        </div>

        {/* TABEL DETAIL ARUS KEUANGAN */}
        <div className="tw-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h3 className="tw-card-title" style={{ margin: 0 }}>Rincian Arus Pemasukan &amp; Pengeluaran</h3>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
            
            {/* Kolom Pemasukan Kas */}
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <h4 style={{ fontSize: "0.9rem", color: "#10b981", margin: 0 }}>Pemasukan Kas (Penjualan Lunas &amp; Pelunasan Bon)</h4>
              <div style={{ maxHeight: "320px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "8px" }}>
                {penjualanTunaiTransfer.length === 0 && pemasukanPelunasanBon.length === 0 ? (
                  <span style={{ fontSize: "0.8rem", color: "var(--tw-muted)" }}>Belum ada data pemasukan kas.</span>
                ) : (
                  <>
                    {penjualanTunaiTransfer.slice(0, 10).map((s, idx) => (
                      <div key={`sale-${idx}`} style={{ padding: "10px", background: "rgba(255,255,255,0.02)", borderRadius: "8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <strong style={{ fontSize: "0.8rem", color: "#fff", display: "block" }}>{s.id} (Tunai/Transfer)</strong>
                          <small style={{ fontSize: "0.7rem", color: "var(--tw-muted)" }}>{s.date ? new Date(s.date).toLocaleString("id-ID") : "-"}</small>
                        </div>
                        <span style={{ fontSize: "0.85rem", fontWeight: "bold", color: "#10b981" }}>+Rp {(s.total || 0).toLocaleString("id-ID")}</span>
                      </div>
                    ))}
                    {pemasukanPelunasanBon.slice(0, 10).map((f, idx) => (
                      <div key={`fin-${idx}`} style={{ padding: "10px", background: "rgba(56, 189, 248, 0.05)", borderRadius: "8px", display: "flex", justifyContent: "space-between", alignItems: "center", border: "1px solid rgba(56, 189, 248, 0.2)" }}>
                        <div>
                          <strong style={{ fontSize: "0.8rem", color: "#38bdf8", display: "block" }}>{f.description || "Pelunasan Piutang"}</strong>
                          <small style={{ fontSize: "0.7rem", color: "var(--tw-muted)" }}>{f.date ? new Date(f.date).toLocaleString("id-ID") : "-"}</small>
                        </div>
                        <span style={{ fontSize: "0.85rem", fontWeight: "bold", color: "#10b981" }}>+Rp {Number(f.amount || f.total || 0).toLocaleString("id-ID")}</span>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>

            {/* Kolom Pengeluaran / Modal Produk */}
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <h4 style={{ fontSize: "0.9rem", color: "#ef4444", margin: 0 }}>Akumulasi Modal Produk &amp; Pengeluaran</h4>
              <div style={{ maxHeight: "320px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "8px" }}>
                <div style={{ padding: "10px", background: "rgba(239, 68, 68, 0.05)", borderRadius: "8px", display: "flex", justifyContent: "space-between", alignItems: "center", border: "1px solid rgba(239, 68, 68, 0.2)" }}>
                  <div>
                    <strong style={{ fontSize: "0.8rem", color: "#fff", display: "block" }}>Total Modal Seluruh Produk</strong>
                    <small style={{ fontSize: "0.7rem", color: "var(--tw-muted)" }}>Berdasarkan (Harga Beli × Qty Stok)</small>
                  </div>
                  <span style={{ fontSize: "0.85rem", fontWeight: "bold", color: "#ef4444" }}>-Rp {totalModalProduk.toLocaleString("id-ID")}</span>
                </div>

                {productsList.slice(0, 8).map((p, idx) => {
                  const buy = Number(p.buyPrice ?? p.buyprice ?? 0);
                  const st = Number(p.stock ?? 0);
                  const subTotalModal = buy * st;
                  return (
                    <div key={`prod-${idx}`} style={{ padding: "8px 10px", background: "rgba(255,255,255,0.02)", borderRadius: "6px", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.8rem" }}>
                      <div>
                        <span style={{ color: "#fff", fontWeight: "bold" }}>{p.name}</span>
                        <small style={{ display: "block", color: "var(--tw-muted)", fontSize: "0.68rem" }}>Stok: {st} {p.unit || "pcs"} × Rp {buy.toLocaleString("id-ID")}</small>
                      </div>
                      <span style={{ color: "var(--tw-muted)", fontWeight: "600" }}>Rp {subTotalModal.toLocaleString("id-ID")}</span>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}