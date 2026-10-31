"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function PiutangPage() {
  const [debts, setDebts] = useState<any[]>([]);
  const [payModalData, setPayModalData] = useState<any>(null); // Data piutang yang akan dilunasi
  const [payAmount, setPayAmount] = useState<number | "">("");
  const [isOnline, setIsOnline] = useState(true);
  const [message, setMessage] = useState("");

  const loadDebts = async () => {
    try {
      const { data, error } = await supabase
        .from("tw_debts")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && data) {
        setDebts(data);
        localStorage.setItem("kasirq_piutang", JSON.stringify(data));
      } else {
        fallbackLoadLocal();
      }
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

    // Supabase Realtime Subscription untuk sinkronisasi piutang
    const channel = supabase
      .channel("public:tw_debts_full_sync")
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

  // Fungsi untuk menghitung sisa hari jatuh tempo (7 hari dari tanggal transaksi)
  const getDueDateStatus = (dateStr: string) => {
    const trxDate = new Date(dateStr);
    const dueDate = new Date(trxDate.getTime() + 7 * 24 * 60 * 60 * 1000); // +7 hari
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
    if (payNum > payModalData.remainingAmount) {
      alert("Nominal pelunasan melebihi sisa piutang!");
      return;
    }

    const newPaid = Number(payModalData.paidAmount || 0) + payNum;
    const newRemaining = Number(payModalData.amount || 0) - newPaid;
    const newStatus = newRemaining <= 0 ? "Lunas" : "Belum Lunas";

    // 1. Update status ke Supabase tabel tw_debts
    const { error: updateError } = await supabase
      .from("tw_debts")
      .update({
        paidAmount: newPaid,
        remainingAmount: newRemaining,
        status: newStatus,
      })
      .eq("id", payModalData.id);

    if (updateError) {
      alert("Gagal memperbarui piutang di Cloud: " + updateError.message);
      return;
    }

    // 2. Catat pemasukan pelunasan otomatis ke Supabase tabel tw_finances (untuk modul Keuangan)
    const financeRecord = {
      id: "INC-" + Date.now(),
      date: new Date().toISOString(),
      type: "Masuk",
      category: "Pelunasan Piutang / Bon",
      description: `Pelunasan bon dari ${payModalData.customerName} (Trx: ${payModalData.trxId})`,
      amount: payNum,
    };

    await supabase.from("tw_finances").insert([financeRecord]).catch(() => {});

    // 3. Perbarui state lokal & localStorage piutang
    const updatedDebts = debts.map((item) => {
      if (item.id === payModalData.id) {
        return {
          ...item,
          paidAmount: newPaid,
          remainingAmount: newRemaining,
          status: newStatus,
        };
      }
      return item;
    });

    setDebts(updatedDebts);
    localStorage.setItem("kasirq_piutang", JSON.stringify(updatedDebts));

    // 4. Sinkronisasi pencatatan ke localStorage keuangan
    const savedFin = JSON.parse(localStorage.getItem("tw_purchase_history") || "[]");
    localStorage.setItem("tw_purchase_history", JSON.stringify([financeRecord, ...savedFin]));

    window.dispatchEvent(new Event("storage"));

    setMessage(`✓ Pelunasan sebesar Rp ${payNum.toLocaleString("id-ID")} berhasil dicatat & masuk ke Laporan Keuangan!`);
    setPayModalData(null);
    setPayAmount("");
    setTimeout(() => setMessage(""), 4000);
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

        {message && (
          <div style={{ padding: "12px", background: "rgba(16, 185, 129, 0.15)", color: "#10b981", borderRadius: "8px", fontSize: "0.85rem", border: "1px solid rgba(16, 185, 129, 0.3)" }}>
            {message}
          </div>
        )}

        {/* MODAL / FORM PELUNASAN JIKA DIPILIH */}
        {payModalData && (
          <div className="tw-card" style={{ background: "rgba(56, 189, 248, 0.05)", border: "1px solid #38bdf8", display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 className="tw-card-title" style={{ margin: 0, color: "#38bdf8" }}>Form Pelunasan Bon: {payModalData.customerName}</h3>
              <button onClick={() => setPayModalData(null)} style={{ background: "transparent", border: "none", color: "#fff", cursor: "pointer", fontSize: "1rem" }}>✕</button>
            </div>
            <div style={{ fontSize: "0.85rem", color: "var(--tw-muted)" }}>
              Total Sisa Piutang: <strong style={{ color: "#ef4444" }}>Rp {payModalData.remainingAmount.toLocaleString("id-ID")}</strong>
            </div>
            <form onSubmit={handlePelunasanSubmit} style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              <input
                type="number"
                placeholder="Masukkan nominal bayar..."
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value === "" ? "" : Number(e.target.value))}
                style={{ flex: 1, padding: "8px", background: "rgba(255,255,255,0.03)", border: "1px solid var(--tw-border)", borderRadius: "8px", color: "#fff" }}
              />
              <button type="submit" className="tw-btn tw-btn-primary" style={{ padding: "8px 16px", fontWeight: "bold", cursor: "pointer" }}>
                Simpan Pelunasan
              </button>
            </form>
          </div>
        )}

        {/* TABEL DAFTAR PIUTANG / BON */}
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
                    const { dueDate, diffDays } = getDueDateStatus(item.date);
                    const isOverdue = diffDays < 0 && item.status !== "Lunas";
                    const isDueSoon = diffDays >= 0 && diffDays <= 2 && item.status !== "Lunas";

                    return (
                      <tr key={idx} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                        <td style={{ padding: "10px" }}>
                          <strong style={{ color: "#38bdf8", display: "block" }}>{item.trxId}</strong>
                          <small style={{ color: "var(--tw-muted)", fontSize: "0.7rem" }}>{item.date ? new Date(item.date).toLocaleString("id-ID") : "-"}</small>
                        </td>
                        <td style={{ padding: "10px", color: "#fff", fontWeight: "bold" }}>{item.customerName}</td>
                        <td style={{ padding: "10px", color: "#f59e0b" }}>Rp {(item.amount || 0).toLocaleString("id-ID")}</td>
                        <td style={{ padding: "10px", color: "#10b981" }}>Rp {(item.paidAmount || 0).toLocaleString("id-ID")}</td>
                        <td style={{ padding: "10px", color: "#ef4444", fontWeight: "bold" }}>Rp {(item.remainingAmount || 0).toLocaleString("id-ID")}</td>
                        <td style={{ padding: "10px" }}>
                          <div style={{ fontSize: "0.75rem", color: "#fff" }}>{dueDate.toLocaleDateString("id-ID")}</div>
                          {item.status !== "Lunas" && (
                            <span style={{ fontSize: "0.65rem", padding: "2px 6px", borderRadius: "4px", background: isOverdue ? "rgba(239, 68, 68, 0.2)" : isDueSoon ? "rgba(245, 158, 11, 0.2)" : "rgba(56, 189, 248, 0.1)", color: isOverdue ? "#ef4444" : isDueSoon ? "#f59e0b" : "#38bdf8" }}>
                              {isOverdue ? `Terlambat ${Math.abs(diffDays)} hari` : `${diffDays} hari lagi`}
                            </span>
                          )}
                        </td>
                        <td style={{ padding: "10px" }}>
                          <span style={{ padding: "3px 8px", background: item.status === "Lunas" ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.15)", color: item.status === "Lunas" ? "#10b981" : "#ef4444", borderRadius: "6px", fontSize: "0.75rem" }}>
                            {item.status}
                          </span>
                        </td>
                        <td style={{ padding: "10px", textAlign: "center" }}>
                          {item.status !== "Lunas" && (
                            <button
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