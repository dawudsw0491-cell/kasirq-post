"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function PiutangPage() {
  const [debts, setDebts] = useState<any[]>([]);
  const [payModalData, setPayModalData] = useState<any>(null);
  const [payAmount, setPayAmount] = useState<number | "">("");
  const [isOnline, setIsOnline] = useState(true);
  const [message, setMessage] = useState("");

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
            await supabase.from("tw_debts").insert([newDebt]).catch(() => {});
            fetchedDebts.unshift(newDebt);
          }
        }
      }

      setDebts(fetchedDebts);
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
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    const handleStorageChange = () => loadDebts();
    window.addEventListener("storage", handleStorageChange);

    const channel = supabase
      .channel("public:tw_debts_autosync_v7")
      .on("postgres_changes", { event: "*", schema: "public", table: "tw_debts" }, () => {
        loadDebts();
      })
      .subscribe();

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("storage", handleStorageChange);
      supabase.removeChannel(channel);
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

  const handlePelunasanSubmit = async () => {
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

    const financeRecord = {
      id: "INC-" + Date.now(),
      date: new Date().toISOString(),
      type: "Masuk",
      category: "Pelunasan Piutang / Bon",
      description: `Pelunasan bon dari ${custName} (Trx: ${tId})`,
      amount: payNum,
    };

    await supabase.from("tw_finances").insert([financeRecord]).catch(() => {});

    const updatedDebts = debts.map((item) => {
      if (item.id === payModalData.id) {
        return {
          ...item,
          paidamount: newPaid,
          remainingamount: newRemaining,
          status: newStatus,
        };
      }
      return item;
    });

    setDebts(updatedDebts);
    localStorage.setItem("kasirq_piutang", JSON.stringify(updatedDebts));

    const savedFin = JSON.parse(localStorage.getItem("tw_purchase_history") || "[]");
    localStorage.setItem("tw_purchase_history", JSON.stringify([financeRecord, ...savedFin]));

    window.dispatchEvent(new Event("storage"));

    // Tutup modal terlebih dahulu agar tidak menumpuk
    setPayModalData(null);
    setPayAmount("");

    // Set notice sukses yang jelas dan tampil di bagian atas halaman
    const successText = `✓ Berhasil! Pelunasan piutang Rp ${payNum.toLocaleString("id-ID")} untuk ${custName} telah disimpan. Status: ${newStatus}.`;
    setMessage(successText);

    // Auto-hide setelah 6 detik (atau bisa ditutup manual)
    setTimeout(() => {
      setMessage("");
    }, 6000);

    loadDebts();
  };

  return (
    <div className="tw-main" style={{ animation: "fadeIn 0.3s ease-in-out", width: "100%", boxSizing: "border-box" }}>
      <header className="tw-topbar">
        <div className="tw-breadcrumb">
          <strong>MANAJEMEN PIUTANG &amp; PELUNASAN</strong>
        </div>
        <div className="tw-topbar-right">
          <span className="tw-live-badge" style={{ backgroundColor: isOnline ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)", color: isOnline ? "#10b981" : "#ef4444" }}>
            {isOnline ? "ONLINE (SUPABASE)" : "OFFLINE"}
          </span>
        </div>
      </header>

      <div className="tw-content" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "20px" }}>

        {/* NOTICE / BANNER NOTIFIKASI SUKSES (PERSIS SEPERTI DI KASIR) */}
        {message && (
          <div style={{ padding: "14px 18px", background: "rgba(16, 185, 129, 0.15)", color: "#10b981", borderRadius: "10px", fontSize: "0.9rem", border: "1px solid rgba(16, 185, 129, 0.4)", fontWeight: "bold", boxShadow: "0 4px 12px rgba(16, 185, 129, 0.2)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span>{message}</span>
            <button onClick={() => setMessage("")} style={{ background: "transparent", border: "none", color: "#10b981", cursor: "pointer", fontSize: "1.1rem", fontWeight: "bold" }}>✕</button>
          </div>
        )}

        {payModalData && (
          <div className="tw-card" style={{ background: "rgba(56, 189, 248, 0.05)", border: "1px solid #38bdf8", display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 className="tw-card-title" style={{ margin: 0, color: "#38bdf8" }}>Form Pelunasan Bon: {payModalData.customername || payModalData.customerName}</h3>
              <button type="button" onClick={() => setPayModalData(null)} style={{ background: "transparent", border: "none", color: "#fff", cursor: "pointer", fontSize: "1rem" }}>✕</button>
            </div>
            <div style={{ fontSize: "0.85rem", color: "var(--tw-muted)" }}>
              Total Sisa Piutang: <strong style={{ color: "#ef4444" }}>Rp {Number(payModalData.remainingamount ?? payModalData.remainingAmount ?? payModalData.amount ?? 0).toLocaleString("id-ID")}</strong>
            </div>
            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              <input
                type="number"
                placeholder="Masukkan nominal bayar..."
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value === "" ? "" : Number(e.target.value))}
                style={{ flex: 1, padding: "8px", background: "rgba(255,255,255,0.03)", border: "1px solid var(--tw-border)", borderRadius: "8px", color: "#fff" }}
              />
              <button 
                type="button" 
                onClick={handlePelunasanSubmit} 
                className="tw-btn tw-btn-primary" 
                style={{ padding: "10px 20px", fontWeight: "bold", cursor: "pointer", background: "#10b981", border: "none", color: "#fff", borderRadius: "6px" }}
              >
                Simpan Pelunasan
              </button>
            </div>
          </div>
        )}

        <div className="tw-card" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <h3 className="tw-card-title" style={{ margin: 0 }}>Daftar Piutang Pelanggan ({debts.length})</h3>

          <div style={{ overflowX: "auto", maxHeight: "500px", overflowY: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem", textAlign: "left" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--tw-border)", color: "var(--tw-muted)" }}>
                  <th style={{ padding: "10px" }}>ID Trx / Tanggal Bon</th>
                  <th style={{ padding: "10px" }}>Nama Pelanggan</th>
                  <th style={{ padding: "10px" }}>Total Piutang</th>
                  <th style={{ padding: "10px" }}>Sudah Dibayar</th>
                  <th style={{ padding: "10px" }}>Sisa Piutang</th>
                  <th style={{ padding: "10px" }}>Jatuh Tempo (7 Hari)</th>
                  <th style={{ padding: "10px" }}>Status</th>
                  <th style={{ padding: "10px", textAlign: "center" }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {debts.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ padding: "40px", textAlign: "center", color: "var(--tw-muted)" }}>
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
                      <tr key={idx} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                        <td style={{ padding: "10px" }}>
                          <strong style={{ color: "#38bdf8", display: "block" }}>{tId}</strong>
                          <small style={{ color: "var(--tw-muted)", fontSize: "0.7rem" }}>{dateVal ? new Date(dateVal).toLocaleString("id-ID") : "-"}</small>
                        </td>
                        <td style={{ padding: "10px", color: "#fff", fontWeight: "bold" }}>{cName}</td>
                        <td style={{ padding: "10px", color: "#f59e0b" }}>Rp {amt.toLocaleString("id-ID")}</td>
                        <td style={{ padding: "10px", color: "#10b981" }}>Rp {paid.toLocaleString("id-ID")}</td>
                        <td style={{ padding: "10px", color: "#ef4444", fontWeight: "bold" }}>Rp {rem.toLocaleString("id-ID")}</td>
                        <td style={{ padding: "10px" }}>
                          <div style={{ fontSize: "0.75rem", color: "#fff" }}>{dueDate.toLocaleDateString("id-ID")}</div>
                          {!isPaidOff && (
                            <span style={{ fontSize: "0.65rem", padding: "2px 6px", borderRadius: "4px", background: isOverdue ? "rgba(239, 68, 68, 0.2)" : isDueSoon ? "rgba(245, 158, 11, 0.2)" : "rgba(56, 189, 248, 0.1)", color: isOverdue ? "#ef4444" : isDueSoon ? "#f59e0b" : "#38bdf8" }}>
                              {isOverdue ? `Terlambat ${Math.abs(diffDays)} hari` : `${diffDays} hari lagi`}
                            </span>
                          )}
                        </td>
                        <td style={{ padding: "10px" }}>
                          <span style={{ padding: "3px 8px", background: isPaidOff ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.15)", color: isPaidOff ? "#10b981" : "#ef4444", borderRadius: "6px", fontSize: "0.75rem" }}>
                            {isPaidOff ? "Terbayar" : "Belum Lunas"}
                          </span>
                        </td>
                        <td style={{ padding: "10px", textAlign: "center" }}>
                          {!isPaidOff && (
                            <button
                              type="button"
                              onClick={() => setPayModalData(item)}
                              style={{ padding: "4px 10px", background: "#10b981", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "0.75rem", fontWeight: "bold" }}
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