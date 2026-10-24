"use client";

import { useState, useEffect } from "react";

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

  const loadData = () => {
    const savedSales = localStorage.getItem("tw_sales_history");
    if (savedSales) {
      try {
        const parsed = JSON.parse(savedSales);
        // Normalisasi data agar konsisten dengan paymentMethod kasir POS
        const normalized = parsed.map((s: any) => {
          const method = s.paymentMethod || s.paymentType || "tunai";
          const isBon = method === "bon" || (s.pay === 0 && s.customerName && s.customerName !== "Umum");
          return {
            ...s,
            paymentMethod: isBon ? "bon" : "tunai"
          };
        });
        setSales(normalized);
      } catch (e) {
        setSales([]);
      }
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

  useEffect(() => {
    loadData();
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    const handleStorageChange = () => loadData();
    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  // Hitung Rekapitulasi Total Tunai vs Bon berdasarkan paymentMethod
  const totalCashSales = sales
    .filter((s) => s.paymentMethod === "tunai")
    .reduce((sum, s) => sum + (s.total || 0), 0);

  const totalBonSales = sales
    .filter((s) => s.paymentMethod === "bon")
    .reduce((sum, s) => sum + (s.total || 0), 0);

  // Fungsi Share Struk ke WhatsApp
  const handleShareWhatsApp = (sale: any) => {
    const isBon = sale.paymentMethod === "bon";
    let text = `*STRUK PENJUALAN - ${storeInfo.name.toUpperCase()}*\n`;
    text += `----------------------------------------\n`;
    text += `No. Invoice : ${sale.id}\n`;
    text += `Tanggal     : ${new Date(sale.date).toLocaleString("id-ID")}\n`;
    text += `Status Nota : ${isBon ? "BON / PIUTANG PELANGGAN" : "TUNAI (CASH)"}\n`;
    if (isBon && sale.customerName) {
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
      text += `Tunai Dibayar : Rp ${(sale.pay || 0).toLocaleString("id-ID")}\n`;
      text += `Kembalian   : Rp ${(sale.change || 0).toLocaleString("id-ID")}\n`;
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
          Transaksi <span>/</span> <strong>Rekapitulasi Penjualan &amp; Status Nota Terintegrasi</strong>
        </div>
        <div className="tw-topbar-right">
          <span className="tw-live-badge" style={{ backgroundColor: isOnline ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)", color: isOnline ? "#10b981" : "#ef4444" }}>
            {isOnline ? "ONLINE" : "OFFLINE"}
          </span>
        </div>
      </header>

      <div className="tw-content" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "20px" }}>
        
        {/* KARTU REKAPITULASI TUNAI VS BON */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px" }}>
          <div className="tw-card" style={{ display: "flex", flexDirection: "column", gap: "6px", borderLeft: "4px solid #10b981" }}>
            <span style={{ fontSize: "0.75rem", color: "var(--tw-muted)" }}>Total Penjualan Tunai (Cash)</span>
            <strong style={{ fontSize: "1.4rem", color: "#10b981" }}>Rp {totalCashSales.toLocaleString("id-ID")}</strong>
            <span style={{ fontSize: "0.7rem", color: "var(--tw-muted)" }}>Masuk langsung ke kas kasir</span>
          </div>

          <div className="tw-card" style={{ display: "flex", flexDirection: "column", gap: "6px", borderLeft: "4px solid #ef4444" }}>
            <span style={{ fontSize: "0.75rem", color: "var(--tw-muted)" }}>Total Penjualan Bon / Piutang</span>
            <strong style={{ fontSize: "1.4rem", color: "#ef4444" }}>Rp {totalBonSales.toLocaleString("id-ID")}</strong>
            <span style={{ fontSize: "0.7rem", color: "var(--tw-muted)" }}>Masuk ke catatan piutang pelanggan</span>
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
                    return (
                      <tr key={idx} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                        <td style={{ padding: "10px", verticalAlign: "top" }}>
                          <strong style={{ color: "#38bdf8", display: "block" }}>{sale.id}</strong>
                          <small style={{ color: "var(--tw-muted)", fontSize: "0.7rem" }}>{new Date(sale.date).toLocaleString("id-ID")}</small>
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

                        {/* STATUS NOTA VISUAL DARI PAYMENTMETHOD */}
                        <td style={{ padding: "10px", verticalAlign: "top" }}>
                          <span style={{ 
                            padding: "4px 10px", 
                            borderRadius: "6px", 
                            fontSize: "0.75rem", 
                            fontWeight: "900",
                            background: isBon ? "rgba(239, 68, 68, 0.2)" : "rgba(16, 185, 129, 0.2)", 
                            color: isBon ? "#ef4444" : "#10b981",
                            border: isBon ? "1px solid rgba(239, 68, 68, 0.4)" : "1px solid rgba(16, 185, 129, 0.4)",
                            display: "inline-block"
                          }}>
                            {isBon ? "🔴 NOTA: BON / PIUTANG" : "🟢 NOTA: TUNAI"}
                          </span>
                          {isBon && sale.customerName && (
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
                              <span style={{ color: "var(--tw-muted)" }}>Bayar: Rp {(sale.pay || 0).toLocaleString("id-ID")}</span>
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

      {/* MODAL PRATINJAU STRUK WARNA PUTIH & STATUS NOTA TERINTEGRASI */}
      {selectedSale && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.8)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 2000, padding: "20px" }}>
          <div style={{ background: "#ffffff", color: "#1e293b", border: "1px solid #cbd5e1", borderRadius: "12px", width: "100%", maxWidth: "400px", padding: "24px", display: "flex", flexDirection: "column", gap: "16px", boxShadow: "0 15px 35px rgba(0,0,0,0.5)" }}>
            
            {/* HEADER STRUK */}
            <div style={{ textAlign: "center", borderBottom: "2px dashed #cbd5e1", paddingBottom: "12px" }}>
              <h2 style={{ fontSize: "1.3rem", fontWeight: "900", color: "#0f172a", margin: "0 0 4px 0" }}>{storeInfo.name.toUpperCase()}</h2>
              <p style={{ fontSize: "0.78rem", fontWeight: "600", color: "#475569", margin: 0 }}>{storeInfo.address}</p>
              <p style={{ fontSize: "0.78rem", fontWeight: "600", color: "#475569", margin: "2px 0 0 0" }}>Telp: {storeInfo.phone}</p>
            </div>

            {/* DETAIL TRANSAKSI & STATUS NOTA VISUAL */}
            <div style={{ fontSize: "0.82rem", display: "flex", flexDirection: "column", gap: "6px", borderBottom: "1px solid #e2e8f0", paddingBottom: "10px" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontWeight: "600", color: "#64748b" }}>No. Invoice:</span>
                <strong style={{ color: "#0f172a" }}>{selectedSale.id}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontWeight: "600", color: "#64748b" }}>Waktu:</span>
                <span style={{ fontWeight: "600", color: "#0f172a" }}>{new Date(selectedSale.date).toLocaleString("id-ID")}</span>
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
                  {selectedSale.paymentMethod === "bon" ? "STATUS: BON / PIUTANG" : "STATUS: TUNAI"}
                </span>
              </div>
              {selectedSale.paymentMethod === "bon" && selectedSale.customerName && (
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontWeight: "600", color: "#64748b" }}>Nama Pelanggan:</span>
                  <strong style={{ color: "#2563eb" }}>{selectedSale.customerName}</strong>
                </div>
              )}
            </div>

            {/* DAFTAR ITEM BELANJA */}
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

            {/* TOTAL & PEMBAYARAN */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "0.85rem", background: "#f8fafc", padding: "10px", borderRadius: "8px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "900" }}>
                <span style={{ color: "#0f172a" }}>TOTAL BELANJA:</span>
                <span style={{ color: "#d97706", fontSize: "1.1rem" }}>Rp {(selectedSale.total || 0).toLocaleString("id-ID")}</span>
              </div>
              {selectedSale.paymentMethod === "tunai" ? (
                <>
                  <div style={{ display: "flex", justifyContent: "space-between", color: "#475569", fontWeight: "700", fontSize: "0.8rem" }}>
                    <span>Tunai Dibayar:</span>
                    <span>Rp {(selectedSale.pay || 0).toLocaleString("id-ID")}</span>
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

            {/* FOOTER STRUK */}
            <div style={{ textAlign: "center", borderTop: "2px dashed #cbd5e1", paddingTop: "10px" }}>
              <p style={{ fontSize: "0.8rem", fontWeight: "800", color: "#0f172a", margin: 0 }}>{storeInfo.footer}</p>
            </div>

            {/* TOMBOL AKSI MODAL */}
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