"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function PiutangPage() {
  const [debts, setDebts] = useState<any[]>([]);
  const [payModalData, setPayModalData] = useState<any>(null);
  const [payAmount, setPayAmount] = useState<number | "">("");
  const [isOnline, setIsOnline] = useState(true);
  const [successNotice, setSuccessNotice] = useState("");

  const loadDebts = async () => {
    try {
      let fetchedDebts: any[] = [];

      const { data: debtData, error: debtError } = await supabase
        .from("tw_debts")
        .select("*")
        .order("created_at", { ascending: false });

      if (!debtError && debtData) {
        fetchedDebts = debtData;
      } else {
        const savedDebts = localStorage.getItem("kasirq_piutang");
        fetchedDebts = savedDebts ? JSON.parse(savedDebts) : [];
      }

      const { data: salesData } = await supabase.from("tw_sales_history").select("*");
      if (salesData) {
        const bonSales = salesData.filter((s: any) => {
          const st = (s.status || "").toLowerCase();
          return st.includes("bon") || st.includes("piutang") || st.includes("unpaid");
        });

        for (const sale of bonSales) {
          const exists = fetchedDebts.some((d: any) => d.trxid === sale.id || d.trxId === sale.id || d.id === sale.id);
          if (!exists) {
            const newDebt = {
              id: "PIU-" + (sale.id ? sale.id.replace("TRX-", "") : Date.now()),
              trxid: sale.id,
              customername: sale.customerName || sale.customername || "Pelanggan Bon",
              amount: sale.total || 0,
              paidamount: 0,
              remainingamount: sale.total || 0,
              date: sale.date || sale.created_at || new Date().toISOString(),
              status: "Belum Lunas",
            };
            try {
              await supabase.from("tw_debts").insert([newDebt]);
            } catch (err) {
              console.error("Gagal insert otomatis:", err);
            }
            fetchedDebts.unshift(newDebt);
          }
        }
      }

      setDebts([...fetchedDebts]);
      localStorage.setItem("kasirq_piutang", JSON.stringify(fetchedDebts));
    } catch (e) {
      fallbackLoadLocal();
    }
  };

  const fallbackLoadLocal = () => {
    const savedDebts = localStorage.getItem("kasirq_piutang");
    if (savedDebts) {
      try {
        setDebts(JSON.parse(savedDebts));
      } catch (e) {
        setDebts([]);
      }
    }
  };

  useEffect(() => {
    loadDebts();

    const savedMsg = sessionStorage.getItem("piutang_success_msg");
    if (savedMsg) {
      setSuccessNotice(savedMsg);
      sessionStorage.removeItem("piutang_success_msg");
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

  const getDueDateStatus = (dateStr: string) => {
    const trxDate = new Date(dateStr);
    const dueDate = new Date(trxDate.getTime() + 7 * 24 * 60 * 60 * 1000);
    const today = new Date();
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return { dueDate, diffDays };
  };

  const handlePelunasanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payModalData || payAmount === "" || Number(payAmount) <= 0) {
      alert("Masukkan nominal pelunasan yang valid!");
      return;
    }

    const payNum = Number(payAmount);
    const currentRemaining = Number(payModalData.remainingamount ?? payModalData.remainingAmount ?? payModalData.amount ?? 0);
    const currentPaid = Number(payModalData.paidamount ?? payModalData.paidAmount ?? 0);
    const totalAmount = Number(payModalData.amount ?? 0);

    if (payNum > currentRemaining) {
      alert("Nominal pelunasan melebihi sisa piutang!");
      return;
    }

    const newPaid = currentPaid + payNum;
    const newRemaining = totalAmount - newPaid;
    const newStatus = newRemaining <= 0 ? "Terbayar" : "Belum Lunas";

    const { error: updateError } = await supabase
      .from("tw_debts")
      .update({
        paidamount: newPaid,
        remainingamount: newRemaining,
        status: newStatus,
      })
      .eq("id", payModalData.id);

    if (updateError) {
      alert("Gagal memperbarui piutang di Cloud: " + updateError.message);
      return;
    }

    const custName = payModalData.customername || payModalData.customerName || "Pelanggan";
    const tId = payModalData.trxid || payModalData.trxId || payModalData.id;

    try {
      const financeRecord = {
        id: "INC-" + Date.now(),
        date: new Date().toISOString(),
        type: "Masuk",
        category: "Pelunasan Piutang / Bon",
        description: `Pelunasan bon dari ${custName} (Trx: ${tId})`,
        amount: payNum,
      };
      await supabase.from("tw_finances").insert([financeRecord]);

      const savedFin = JSON.parse(localStorage.getItem("tw_purchase_history") || "[]");
      localStorage.setItem("tw_purchase_history", JSON.stringify([financeRecord, ...savedFin]));
    } catch (err) {
      console.error("Gagal catat keuangan:", err);
    }

    const msg = `✓ Pelunasan piutang Rp ${payNum.toLocaleString("id-ID")} untuk ${custName} berhasil disimpan! Status: ${newStatus}.`;
    sessionStorage.setItem("piutang_success_msg", msg);
    
    window.location.reload();
  };

  return (
    <div className="tw-main" style={{ animation: "fadeIn 0.3s ease-in-out", width: "100%", boxSizing: "border-box", position: "relative" }}>
      
      {successNotice && (
        <div style={{
          position: "fixed",
          top: "20px",
          right: "20px",
          left: "20px",
          zIndex: 9999,
          padding: "14px 20px",
          background: "#059669",
          color: "#ffffff",
          borderRadius: "10px",
          fontSize: "0.9rem",
          fontWeight: "600",
          boxShadow: "0 10px 25px rgba(5, 150, 105, 0.3)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          border: "1px solid #A7F3D0"
        }}>
          <span>{successNotice}</span>
          <button onClick={() => setSuccessNotice("")} style={{ background: "transparent", border: "none", color: "#fff", cursor: "pointer", fontSize: "1rem", fontWeight: "600" }}>✕</button>
        </div>
      )}

      {/* TOPBAR DENGAN CARD HEADER SOLID ELEGAN */}
      <header className="tw-topbar" style={{ background: "transparent", borderBottom: "none", padding: "16px 24px 0 24px" }}>
        <div className="tw-header-card" style={{ width: "100%", backgroundColor: "#FFFFFF", border: "1px solid #CBD5E1", borderRadius: "10px", padding: "12px 20px", boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div className="tw-breadcrumb">
            <strong style={{ color: "#0F172A", fontSize: "0.95rem", fontWeight: "700" }}>MANAJEMEN PIUTANG &amp; PELUNASAN</strong>
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

        {payModalData && (
          <div className="tw-card" style={{ backgroundColor: "#FFFFFF", border: "1px solid #CBD5E1", borderRadius: "12px", padding: "18px", display: "flex", flexDirection: "column", gap: "14px", boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 className="tw-card-title" style={{ margin: 0, color: "#0F172A", fontSize: "1rem", fontWeight: "600" }}>Form Pelunasan Bon: {payModalData.customername || payModalData.customerName}</h3>
              <button type="button" onClick={() => setPayModalData(null)} style={{ background: "transparent", border: "none", color: "#64748B", cursor: "pointer", fontSize: "1rem", fontWeight: "600" }}>✕</button>
            </div>
            <div style={{ fontSize: "0.85rem", color: "#475569", fontWeight: "500" }}>
              Total Sisa Piutang: <span style={{ color: "#DC2626", fontWeight: "600" }}>Rp {Number(payModalData.remainingamount ?? payModalData.remainingAmount ?? payModalData.amount ?? 0).toLocaleString("id-ID")}</span>
            </div>
            <form onSubmit={handlePelunasanSubmit} style={{ display: "flex", gap: "12px", alignItems: "center" }}>
              <input
                type="number"
                placeholder="Masukkan nominal bayar..."
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value === "" ? "" : Number(e.target.value))}
                style={{ flex: 1, padding: "8px 12px", background: "#FFFFFF", border: "1px solid #CBD5E1", borderRadius: "8px", color: "#0F172A", fontSize: "0.85rem", fontWeight: "500" }}
              />
              <button 
                type="submit" 
                className="tw-btn tw-btn-primary" 
                style={{ padding: "9px 16px", fontWeight: "600", cursor: "pointer", background: "#059669", border: "none", color: "#fff", borderRadius: "8px", fontSize: "0.85rem" }}
              >
                Simpan Pelunasan
              </button>
            </form>
          </div>
        )}

        <div className="tw-card" style={{ backgroundColor: "#FFFFFF", border: "1px solid #CBD5E1", borderRadius: "12px", padding: "18px", display: "flex", flexDirection: "column", gap: "16px", boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)" }}>
          <h3 className="tw-card-title" style={{ margin: 0, color: "#0F172A", fontSize: "1rem", fontWeight: "600" }}>Daftar Piutang Pelanggan [{debts.length}]</h3>

          <div style={{ overflowX: "auto", maxHeight: "500px", overflowY: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem", textAlign: "left" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #E2E8F0", color: "#334155" }}>
                  <th style={{ padding: "10px", fontWeight: "600" }}>ID Trx / Tanggal Bon</th>
                  <th style={{ padding: "10px", fontWeight: "600" }}>Nama Pelanggan</th>
                  <th style={{ padding: "10px", fontWeight: "600" }}>Total Piutang</th>
                  <th style={{ padding: "10px", fontWeight: "600" }}>Sudah Dibayar</th>
                  <th style={{ padding: "10px", fontWeight: "600" }}>Sisa Piutang</th>
                  <th style={{ padding: "10px", fontWeight: "600" }}>Jatuh Tempo (7 Hari)</th>
                  <th style={{ padding: "10px", fontWeight: "600" }}>Status</th>
                  <th style={{ padding: "10px", textAlign: "center", fontWeight: "600" }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {debts.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ padding: "40px", textAlign: "center", color: "#64748B", fontSize: "0.85rem", fontWeight: "500" }}>
                      Belum ada catatan bon atau piutang pelanggan. Transaksi bon dari kasir akan muncul otomatis di sini.
                    </td>
                  </tr>
                ) : (
                  debts.map((item, idx) => {
                    const dateVal = item.date || item.created_at;
                    const { dueDate, diffDays } = getDueDateStatus(dateVal);
                    const isPaidOff = item.status === "Terbayar" || item.status === "Lunas";
                    const isOverdue = diffDays < 0 && !isPaidOff;
                    const isDueSoon = diffDays >= 0 && diffDays <= 2 && !isPaidOff;
                    
                    const tId = item.trxid || item.trxId || item.id;
                    const cName = item.customername || item.customerName || "Pelanggan";
                    const amt = Number(item.amount || 0);
                    const paid = Number(item.paidamount ?? item.paidAmount ?? 0);
                    const rem = Number(item.remainingamount ?? item.remainingAmount ?? amt);

                    return (
                      <tr key={idx} style={{ borderBottom: "1px solid #F1F5F9", transition: "background 0.2s" }}>
                        <td style={{ padding: "10px" }}>
                          <span style={{ color: "#0284C7", display: "block", fontSize: "0.8rem", fontWeight: "600" }}>{tId}</span>
                          <span style={{ color: "#64748B", fontSize: "0.75rem", fontWeight: "500" }}>{dateVal ? new Date(dateVal).toLocaleString("id-ID") : "-"}</span>
                        </td>
                        <td style={{ padding: "10px", color: "#0F172A", fontWeight: "600" }}>{cName}</td>
                        <td style={{ padding: "10px", color: "#D97706", fontWeight: "600" }}>Rp {amt.toLocaleString("id-ID")}</td>
                        <td style={{ padding: "10px", color: "#059669", fontWeight: "600" }}>Rp {paid.toLocaleString("id-ID")}</td>
                        <td style={{ padding: "10px", color: "#DC2626", fontWeight: "600" }}>Rp {rem.toLocaleString("id-ID")}</td>
                        <td style={{ padding: "10px" }}>
                          <div style={{ fontSize: "0.8rem", color: "#0F172A", fontWeight: "500" }}>{dueDate.toLocaleDateString("id-ID")}</div>
                          {!isPaidOff && (
                            <span style={{ fontSize: "0.7rem", fontWeight: "600", padding: "2px 6px", borderRadius: "4px", display: "inline-block", marginTop: "3px", background: isOverdue ? "#FEE2E2" : isDueSoon ? "#FEF3C7" : "#E0F2FE", color: isOverdue ? "#991B1B" : isDueSoon ? "#B45309" : "#0369A1" }}>
                              {isOverdue ? `Terlambat ${Math.abs(diffDays)} hari` : `${diffDays} hari lagi`}
                            </span>
                          )}
                        </td>
                        <td style={{ padding: "10px" }}>
                          <span style={{ padding: "3px 8px", background: isPaidOff ? "#D1FAE5" : "#FEE2E2", color: isPaidOff ? "#065F46" : "#991B1B", borderRadius: "6px", fontSize: "0.75rem", fontWeight: "600" }}>
                            {isPaidOff ? "Terbayar" : "Belum Lunas"}
                          </span>
                        </td>
                        <td style={{ padding: "10px", textAlign: "center" }}>
                          {!isPaidOff && (
                            <button
                              type="button"
                              onClick={() => setPayModalData(item)}
                              style={{ padding: "4px 10px", background: "#059669", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "0.75rem", fontWeight: "600" }}
                            >
                              Lunasi
                            </button>
                          )}
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
  );
}