"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function PenjualanPage() {
  const [sales, setSales] = useState<any[]>([]);
  const [storeInfo, setStoreInfo] = useState({
    name: "Toko Wiwid",
    address: "Jl. Gatot Subroto No. 88, Solo",
    phone: "081234567890",
    header: "Selamat Datang di Toko Wiwid",
    footer: "Terima Kasih Atas Kunjungan Anda!",
  });
  
  // State Modal Struk / Receipt Preview
  const [selectedSale, setSelectedSale] = useState<any>(null);
  const [isOnline, setIsOnline] = useState(true);

  const loadData = async () => {
    try {
      // 1. Ambil data penjualan dari tw_sales_history
      const { data: salesData, error: salesError } = await supabase
        .from("tw_sales_history")
        .select("*")
        .order("created_at", { ascending: false });

      // 2. Ambil data piutang dari tw_debts untuk cek status pelunasan terkini
      const { data: debtData } = await supabase.from("tw_debts").select("*");

      if (!salesError && salesData) {
        processAndSetSales(salesData, debtData || []);
        localStorage.setItem("tw_sales_history", JSON.stringify(salesData));
        if (debtData) {
          localStorage.setItem("kasirq_piutang", JSON.stringify(debtData));
        }
      } else {
        fallbackLoadLocal();
      }
    } catch (e) {
      fallbackLoadLocal();
    }

    const sName = localStorage.getItem("tw_store_name");
    const sAddr = localStorage.getItem("tw_store_address");
    const sPhone = localStorage.getItem("tw_store_phone");
    if (sName || sAddr || sPhone) {
      setStoreInfo({
        name: sName || "Toko Wiwid",
        address: sAddr || "Jl. Gatot Subroto No. 88, Solo",
        phone: sPhone || "081234567890",
        header: "Selamat Datang di " + (sName || "Toko Wiwid"),
        footer: "Terima Kasih Atas Kunjungan Anda!",
      });
    }
  };

  const processAndSetSales = (parsedSales: any[], parsedDebts: any[]) => {
    const normalized = parsedSales.map((s: any) => {
      const statusText = (s.status || "").toLowerCase();
      const isBon = statusText.includes("bon") || statusText.includes("piutang") || statusText.includes("unpaid");
      const isTransfer = statusText.includes("transfer");

      // Cek apakah transaksi bon ini sudah dilunasi di tabel tw_debts
      const matchingDebt = parsedDebts.find((d: any) => d.trxid === s.id || d.trxId === s.id || d.id === s.id);
      const isPaidOff = matchingDebt && (matchingDebt.status === "Terbayar" || matchingDebt.status === "Lunas" || Number(matchingDebt.remainingamount ?? matchingDebt.remainingAmount ?? 0) <= 0);

      let resolvedMethod = "tunai";
      if (isBon) {
        resolvedMethod = isPaidOff ? "terbayar" : "bon";
      } else if (isTransfer) {
        resolvedMethod = "transfer";
      }

      return {
        ...s,
        paymentMethod: resolvedMethod
      };
    });
    setSales(normalized);
  };

  const fallbackLoadLocal = () => {
    const savedSales = localStorage.getItem("tw_sales_history");
    const savedDebts = localStorage.getItem("kasirq_piutang");
    if (savedSales) {
      try {
        const parsedSales = JSON.parse(savedSales);
        const parsedDebts = savedDebts ? JSON.parse(savedDebts) : [];
        processAndSetSales(parsedSales, parsedDebts);
      } catch (e) {
        setSales([]);
      }
    }
  };

  useEffect(() => {
    loadData();
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    const handleStorageChange = () => loadData();
    window.addEventListener("storage", handleStorageChange);

    // Supabase Realtime Subscription untuk riwayat penjualan & piutang
    const channelSales = supabase
      .channel("public:tw_sales_history_penjualan_v2")
      .on("postgres_changes", { event: "*", schema: "public", table: "tw_sales_history" }, () => {
        loadData();
      })
      .subscribe();

    const channelDebts = supabase
      .channel("public:tw_debts_penjualan_sync")
      .on("postgres_changes", { event: "*", schema: "public", table: "tw_debts" }, () => {
        loadData();
      })
      .subscribe();

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("storage", handleStorageChange);
      supabase.removeChannel(channelSales);
      supabase.removeChannel(channelDebts);
    };
  }, []);

  // Hitung Rekapitulasi Berdasarkan paymentMethod (Tunai, Transfer, dan yang sudah Terbayar masuk kas masuk)
  const totalCashSales = sales
    .filter((s) => s.paymentMethod === "tunai" || s.paymentMethod === "transfer" || s.paymentMethod === "terbayar")
    .reduce((sum, s) => sum + (s.total || 0), 0);

  const totalBonSales = sales
    .filter((s) => s.paymentMethod === "bon")
    .reduce((sum, s) => sum + (s.total || 0), 0);

  // Fungsi Share Struk ke WhatsApp
  const handleShareWhatsApp = (sale: any) => {
    const isBon = sale.paymentMethod === "bon";
    const isTerbayar = sale.paymentMethod === "terbayar";
    let text = `*STRUK PENJUALAN - ${storeInfo.name.toUpperCase()}*\n`;
    text += `----------------------------------------\n`;
    text += `No. Invoice : ${sale.id}\n`;
    text += `Tanggal     : ${new Date(sale.date).toLocaleString("id-ID")}\n`;
    text += `Status Nota : ${isBon ? "BON / PIUTANG PELANGGAN" : isTerbayar ? "LUNAS (TERBAYAR)" : "LUNAS (TUNAI/TRANSFER)"}\n`;
    if (sale.customerName) {
      text += `Pelanggan   : ${sale.customerName}\n`;
    }
    text += `----------------------------------------\n`;
    text += `*RILIS ITEM BELANJA:*\n`;
    
    sale.items?.forEach((it: any) => {
      text += `• ${it.name} (${it.qty}x @Rp ${(it.sellPrice || 0).toLocaleString("id-ID")}) = Rp ${(it.qty * it.sellPrice).toLocaleString("id-ID")}\n`;
    });

    text += `----------------------------------------\n`;
    text += `*TOTAL TAGIHAN : Rp ${(sale.total || 0).toLocaleString("id-ID")}*\n`;
    if (!isBon) {
      text += `Pembayaran  : Rp ${(sale.pay || (isTerbayar ? sale.total : 0)).toLocaleString("id-ID")}\n`;
      text += `Keterangan  : Lunas / Terbayar\n`;
    } else {
      text += `Keterangan  : Masuk Catatan Piutang Toko\n`;
    }
    text += `----------------------------------------\n`;
    text += `${storeInfo.footer}\n`;
    text += `Terima kasih telah berbelanja di ${storeInfo.name}!`;

    const encoded = encodeURIComponent(text);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, "_blank");
  };

  return (
    <div className="tw-main" style={{ animation: "fadeIn 0.3s ease-in-out", width: "100%", boxSizing: "border-box" }}>
      <header className="tw-topbar">
        <div className="tw-breadcrumb">
          <strong>PENJUALAN &amp; STATUS NOTA</strong>
        </div>
        <div className="tw-topbar-right">
          <span className="tw-live-badge" style={{ backgroundColor: isOnline ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)", color: isOnline ? "#10b981" : "#ef4444" }}>
            {isOnline ? "ONLINE (SUPABASE)" : "OFFLINE"}
          </span>
        </div>
      </header>

      <div className="tw-content" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "20px" }}>
        
        {/* KARTU REKAPITULASI TUNAI VS BON */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px" }}>
          <div className="tw-card" style={{ display: "flex", flexDirection: "column", gap: "6px", borderLeft: "4px solid #10b981" }}>
            <span style={{ fontSize: "0.75rem", color: "var(--tw-muted)" }}>Total Penjualan Tunai / Lunas</span>
            <strong style={{ fontSize: "1.4rem", color: "#10b981" }}>Rp {totalCashSales.toLocaleString("id-ID")}</strong>
            <span style={{ fontSize: "0.7rem", color: "var(--tw-muted)" }}>Termasuk kas masuk &amp; bon terbayar</span>
          </div>

          <div className="tw-card" style={{ display: "flex", flexDirection: "column", gap: "6px", borderLeft: "4px solid #ef4444" }}>
            <span style={{ fontSize: "0.75rem", color: "var(--tw-muted)" }}>Total Penjualan Bon / Piutang Aktif</span>
            <strong style={{ fontSize: "1.4rem", color: "#ef4444" }}>Rp {totalBonSales.toLocaleString("id-ID")}</strong>
            <span style={{ fontSize: "0.7rem", color: "var(--tw-muted)" }}>Belum dilunasi pelanggan</span>
          </div>

          <div className="tw-card" style={{ display: "flex", flexDirection: "column", gap: "6px", borderLeft: "4px solid #f59e0b" }}>
            <span style={{ fontSize: "0.75rem", color: "var(--tw-muted)" }}>Akumulasi Seluruh Penjualan</span>
            <strong style={{ fontSize: "1.4rem", color: "#f59e0b" }}>Rp {(totalCashSales + totalBonSales).toLocaleString("id-ID")}</strong>
            <span style={{ fontSize: "0.7rem", color: "var(--tw-muted)" }}>Dari {sales.length} total transaksi</span>
          </div>
        </div>

        {/* TABEL RIWAYAT TRANSAKSI */}
        <div className="tw-card" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 className="tw-card-title" style={{ margin: 0 }}>Daftar Riwayat Transaksi Kasir</h3>
          </div>

          <div style={{ overflowX: "auto", maxHeight: "480px", overflowY: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.82rem", textAlign: "left" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--tw-border)", color: "var(--tw-muted)" }}>
                  <th style={{ padding: "10px" }}>ID Trx &amp; Waktu</th>
                  <th style={{ padding: "10px" }}>Detail Barang Terjual</th>
                  <th style={{ padding: "10px" }}>Status Nota (Kasir)</th>
                  <th style={{ padding: "10px" }}>Rincian Pembayaran</th>
                  <th style={{ padding: "10px", textAlign: "right" }}>Aksi Struk</th>
                </tr>
              </thead>
              <tbody>
                {sales.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: "40px", textAlign: "center", color: "var(--tw-muted)" }}>
                      Belum ada riwayat transaksi penjualan dari mesin kasir.
                    </td>
                  </tr>
                ) : (
                  sales.map((sale, idx) => {
                    const isBon = sale.paymentMethod === "bon";
                    const isTerbayar = sale.paymentMethod === "terbayar";
                    const isTransfer = sale.paymentMethod === "transfer";
                    
                    return (
                      <tr key={idx} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                        <td style={{ padding: "10px", verticalAlign: "top" }}>
                          <strong style={{ color: "#38bdf8", display: "block" }}>{sale.id}</strong>
                          <small style={{ color: "var(--tw-muted)", fontSize: "0.7rem" }}>{sale.date ? new Date(sale.date).toLocaleString("id-ID") : "-"}</small>
                        </td>

                        <td style={{ padding: "10px", verticalAlign: "top" }}>
                          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                            {sale.items && sale.items.map((it: any, i: number) => (
                              <div key={i} style={{ color: "#fff", fontSize: "0.8rem" }}>
                                • {it.name} <span style={{ color: "var(--tw-muted)" }}>({it.qty}x @Rp {(it.sellPrice || 0).toLocaleString("id-ID")})</span>
                              </div>
                            ))}
                          </div>
                        </td>

                        {/* STATUS NOTA VISUAL */}
                        <td style={{ padding: "10px", verticalAlign: "top" }}>
                          <span style={{ 
                            padding: "4px 10px", 
                            borderRadius: "6px", 
                            fontSize: "0.75rem", 
                            fontWeight: "900",
                            background: isBon ? "rgba(239, 68, 68, 0.2)" : isTerbayar ? "rgba(16, 185, 129, 0.2)" : isTransfer ? "rgba(56, 189, 248, 0.2)" : "rgba(16, 185, 129, 0.2)", 
                            color: isBon ? "#ef4444" : isTerbayar ? "#10b981" : isTransfer ? "#38bdf8" : "#10b981",
                            border: isBon ? "1px solid rgba(239, 68, 68, 0.4)" : isTerbayar ? "1px solid rgba(16, 185, 129, 0.4)" : isTransfer ? "1px solid rgba(56, 189, 248, 0.4)" : "1px solid rgba(16, 185, 129, 0.4)",
                            display: "inline-block"
                          }}>
                            {isBon ? "🔴 NOTA: BON / PIUTANG" : isTerbayar ? "🟢 NOTA: TERBAYAR (LUNAS)" : isTransfer ? "🔵 NOTA: TRANSFER" : "🟢 NOTA: TUNAI"}
                          </span>
                          {sale.customerName && (
                            <div style={{ fontSize: "0.75rem", color: "#38bdf8", marginTop: "6px", fontWeight: "bold" }}>
                              Pelanggan: {sale.customerName}
                            </div>
                          )}
                        </td>

                        <td style={{ padding: "10px", verticalAlign: "top", fontSize: "0.78rem" }}>
                          {isBon ? (
                            <div style={{ color: "#ef4444", fontWeight: "bold" }}>
                              Masuk Piutang: Rp {(sale.total || 0).toLocaleString("id-ID")}
                            </div>
                          ) : (
                            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                              <span style={{ color: "var(--tw-muted)" }}>Bayar: Rp {(sale.pay || (isTerbayar ? sale.total : 0)).toLocaleString("id-ID")}</span>
                              <span style={{ color: "#10b981" }}>Kembali: Rp {(sale.change || 0).toLocaleString("id-ID")}</span>
                              <strong style={{ color: "#f59e0b" }}>Total: Rp {(sale.total || 0).toLocaleString("id-ID")}</strong>
                            </div>
                          )}
                        </td>

                        <td style={{ padding: "10px", verticalAlign: "top", textAlign: "right" }}>
                          <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
                            <button
                              onClick={() => setSelectedSale(sale)}
                              style={{ padding: "6px 10px", background: "rgba(2, 132, 199, 0.2)", color: "#38bdf8", border: "1px solid rgba(2, 132, 199, 0.4)", borderRadius: "6px", cursor: "pointer", fontSize: "0.75rem", fontWeight: "bold" }}
                            >
                              📄 Lihat Struk
                            </button>
                            <button
                              onClick={() => handleShareWhatsApp(sale)}
                              style={{ padding: "6px 10px", background: "rgba(16, 185, 129, 0.2)", color: "#10b981", border: "1px solid rgba(16, 185, 129, 0.4)", borderRadius: "6px", cursor: "pointer", fontSize: "0.75rem", fontWeight: "bold" }}
                            >
                              💬 WA
                            </button>
                          </div>
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

      {/* MODAL PRATINJAU STRUK */}
      {selectedSale && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.8)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 2000, padding: "20px" }}>
          <div style={{ background: "#ffffff", color: "#1e293b", border: "1px solid #cbd5e1", borderRadius: "12px", width: "100%", maxWidth: "400px", padding: "24px", display: "flex", flexDirection: "column", gap: "16px", boxShadow: "0 15px 35px rgba(0,0,0,0.5)" }}>
            
            <div style={{ textAlign: "center", borderBottom: "2px dashed #cbd5e1", paddingBottom: "12px" }}>
              <h2 style={{ fontSize: "1.3rem", fontWeight: "900", color: "#0f172a", margin: "0 0 4px 0" }}>{storeInfo.name.toUpperCase()}</h2>
              <p style={{ fontSize: "0.78rem", fontWeight: "600", color: "#475569", margin: 0 }}>{storeInfo.address}</p>
              <p style={{ fontSize: "0.78rem", fontWeight: "600", color: "#475569", margin: "2px 0 0 0" }}>Telp: {storeInfo.phone}</p>
            </div>

            <div style={{ fontSize: "0.82rem", display: "flex", flexDirection: "column", gap: "6px", borderBottom: "1px solid #e2e8f0", paddingBottom: "10px" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontWeight: "600", color: "#64748b" }}>No. Invoice:</span>
                <strong style={{ color: "#0f172a" }}>{selectedSale.id}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontWeight: "600", color: "#64748b" }}>Waktu:</span>
                <span style={{ fontWeight: "600", color: "#0f172a" }}>{selectedSale.date ? new Date(selectedSale.date).toLocaleString("id-ID") : "-"}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontWeight: "600", color: "#64748b" }}>Status Nota:</span>
                <span style={{ 
                  padding: "3px 10px", 
                  borderRadius: "6px", 
                  fontSize: "0.78rem", 
                  fontWeight: "900", 
                  background: selectedSale.paymentMethod === "bon" ? "#fee2e2" : "#d1fae5", 
                  color: selectedSale.paymentMethod === "bon" ? "#dc2626" : "#059669" 
                }}>
                  {selectedSale.paymentMethod === "bon" ? "STATUS: BON / PIUTANG" : "STATUS: LUNAS / TERBAYAR"}
                </span>
              </div>
              {selectedSale.customerName && (
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontWeight: "600", color: "#64748b" }}>Nama Pelanggan:</span>
                  <strong style={{ color: "#2563eb" }}>{selectedSale.customerName}</strong>
                </div>
              )}
            </div>

            <div style={{ borderBottom: "2px dashed #cbd5e1", paddingBottom: "10px", maxHeight: "180px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "8px" }}>
              {selectedSale.items?.map((it: any, i: number) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem" }}>
                  <div>
                    <div style={{ color: "#0f172a", fontWeight: "800" }}>{it.name}</div>
                    <div style={{ fontSize: "0.72rem", fontWeight: "600", color: "#64748b" }}>{it.qty} x @Rp {(it.sellPrice || 0).toLocaleString("id-ID")}</div>
                  </div>
                  <div style={{ color: "#0f172a", fontWeight: "900", alignSelf: "center" }}>
                    Rp {(it.qty * it.sellPrice).toLocaleString("id-ID")}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "0.85rem", background: "#f8fafc", padding: "10px", borderRadius: "8px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "900" }}>
                <span style={{ color: "#0f172a" }}>TOTAL BELANJA:</span>
                <span style={{ color: "#d97706", fontSize: "1.1rem" }}>Rp {(selectedSale.total || 0).toLocaleString("id-ID")}</span>
              </div>
              {selectedSale.paymentMethod !== "bon" ? (
                <>
                  <div style={{ display: "flex", justifyContent: "space-between", color: "#475569", fontWeight: "700", fontSize: "0.8rem" }}>
                    <span>Bayar:</span>
                    <span>Rp {(selectedSale.pay || selectedSale.total || 0).toLocaleString("id-ID")}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", color: "#059669", fontWeight: "900", fontSize: "0.8rem" }}>
                    <span>Kembalian:</span>
                    <span>Rp {(selectedSale.change || 0).toLocaleString("id-ID")}</span>
                  </div>
                </>
              ) : (
                <div style={{ textAlign: "center", color: "#dc2626", fontSize: "0.78rem", fontWeight: "900", marginTop: "2px" }}>
                  * TRANSAKSI MASUK KE MODUL PIUTANG PELANGGAN
                </div>
              )}
            </div>

            <div style={{ textAlign: "center", borderTop: "2px dashed #cbd5e1", paddingTop: "10px" }}>
              <p style={{ fontSize: "0.8rem", fontWeight: "800", color: "#0f172a", margin: 0 }}>{storeInfo.footer}</p>
            </div>

            <div style={{ display: "flex", gap: "10px", marginTop: "4px" }}>
              <button
                onClick={() => handleShareWhatsApp(selectedSale)}
                style={{ flex: 1, padding: "12px", background: "#10b981", color: "#fff", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", fontSize: "0.85rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", boxShadow: "0 4px 12px rgba(16, 185, 129, 0.3)" }}
              >
                <span>💬</span> Share WhatsApp
              </button>
              <button
                onClick={() => setSelectedSale(null)}
                style={{ padding: "12px 18px", background: "#e2e8f0", color: "#0f172a", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", fontSize: "0.85rem" }}
              >
                Tutup
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}