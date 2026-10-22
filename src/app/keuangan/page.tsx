"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface FinancialRecord {
  id: number;
  type: "IN" | "OUT"; // Pemasukan atau Pengeluaran
  category: string;
  amount: number;
  description: string;
  createdAt: string;
}

export default function KeuanganPage() {
  const [storeName, setStoreName] = useState("KASIRQ STORE");
  const [records, setRecords] = useState<FinancialRecord[]>([]);
  
  // State Modal Tambah Catat Keuangan
  const [showModal, setShowModal] = useState(false);
  const [type, setType] = useState<"IN" | "OUT">("IN");
  const [category, setCategory] = useState("Penjualan Kasir");
  const [amount, setAmount] = useState<number | "">("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isOnline, setIsOnline] = useState(true);

  const fetchFinancials = () => {
    // Ambil data dari localStorage atau API
    const saved = localStorage.getItem("tw_financial_records");
    if (saved) {
      try {
        setRecords(JSON.parse(saved));
      } catch {
        setRecords([]);
      }
    } else {
      // Data dummy awal jika kosong
      const initial: FinancialRecord[] = [
        { id: 1, type: "IN", category: "Penjualan Kasir", amount: 26600, description: "Penjualan POS harian", createdAt: new Date().toISOString() },
        { id: 2, type: "OUT", category: "Operasional Toko", amount: 150000, description: "Beli kantong plastik & nota", createdAt: new Date().toISOString() }
      ];
      setRecords(initial);
      localStorage.setItem("tw_financial_records", JSON.stringify(initial));
    }
  };

  useEffect(() => {
    const savedStore = localStorage.getItem("tw_store_name");
    if (savedStore) setStoreName(savedStore);

    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    fetchFinancials();

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const handleAddRecord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) {
      alert("Masukkan nominal keuangan yang valid!");
      return;
    }

    setLoading(true);
    try {
      const newRecord: FinancialRecord = {
        id: Date.now(),
        type,
        category,
        amount: Number(amount),
        description: description || (type === "IN" ? "Pemasukan Lain" : "Pengeluaran Operasional"),
        createdAt: new Date().toISOString()
      };

      const updated = [newRecord, ...records];
      setRecords(updated);
      localStorage.setItem("tw_financial_records", JSON.stringify(updated));

      setMessage("Catatan keuangan berhasil ditambahkan!");
      setShowModal(false);
      setAmount("");
      setDescription("");
      setTimeout(() => setMessage(""), 3500);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id: number) => {
    if (!confirm("Hapus catatan keuangan ini?")) return;
    const updated = records.filter((r) => r.id !== id);
    setRecords(updated);
    localStorage.setItem("tw_financial_records", JSON.stringify(updated));
  };

  // Kalkulasi Total
  const totalIn = records.filter((r) => r.type === "IN").reduce((acc, r) => acc + r.amount, 0);
  const totalOut = records.filter((r) => r.type === "OUT").reduce((acc, r) => acc + r.amount, 0);
  const netBalance = totalIn - totalOut;

  return (
    <main className="tw-dashboard">
      <aside className="tw-sidebar">
        <Link href="/" className="tw-brand" style={{ transition: "all 0.2s ease" }}>
  <div
    style={{
      width: "38px",
      height: "38px",
      borderRadius: "10px",
      background: "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      boxShadow: "0 4px 12px rgba(2, 132, 199, 0.4)",
      border: "1px solid rgba(56, 189, 248, 0.4)",
    }}
  >
    {/* Ikon 3D POS Terminal Modern (SVG) */}
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 4H20V16H4V4Z" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="rgba(255,255,255,0.15)" />
      <path d="M8 8H16" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" />
      <path d="M8 12H12" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" />
      <path d="M8 20H16" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
      <path d="M12 16V20" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
    </svg>
  </div>
  <span className="tw-brand-copy">
    <strong>{storeName}</strong>
    <small>RETAIL MANAGEMENT</small>
  </span>
</Link>

        <div className="tw-nav-label">WORKSPACE</div>
        <nav className="tw-nav">
          <Link href="/" className="tw-nav-link"><span className="tw-nav-icon">⌂</span>Dashboard</Link>
          <Link href="/kasir" className="tw-nav-link"><span className="tw-nav-icon">▣</span>Kasir</Link>
        </nav>

        <div className="tw-nav-label">MANAJEMEN TOKO</div>
        <nav className="tw-nav">
          <Link href="/barang" className="tw-nav-link"><span className="tw-nav-icon">▦</span>Barang</Link>
          <Link href="/kategori" className="tw-nav-link"><span className="tw-nav-icon">◇</span>Kategori</Link>
          <Link href="/pelanggan" className="tw-nav-link"><span className="tw-nav-icon">♧</span>Pelanggan</Link>
          <Link href="/supplier" className="tw-nav-link"><span className="tw-nav-icon">⇄</span>Supplier</Link>
        </nav>

        <div className="tw-nav-label">TRANSAKSI &amp; SISTEM</div>
        <nav className="tw-nav">
          <Link href="/pembelian" className="tw-nav-link"><span className="tw-nav-icon">↓</span>Pembelian</Link>
          <Link href="/penjualan" className="tw-nav-link"><span className="tw-nav-icon">↗</span>Penjualan</Link>
          <Link href="/keuangan" className="tw-nav-link tw-nav-active"><span className="tw-nav-icon">💰</span>Keuangan</Link>
          <Link href="/pengaturan" className="tw-nav-link"><span className="tw-nav-icon">⚙</span>Pengaturan</Link>
        </nav>

        <div className="tw-sidebar-bottom">
          <div className="tw-status-dot" />
          <div><strong>Sistem {storeName}</strong><small>Workspace aktif</small></div>
        </div>
      </aside>

      <div className="tw-main">
        <header className="tw-topbar">
          <div className="tw-breadcrumb">Transaksi &amp; Sistem <span>/</span> <strong>Keuangan &amp; Arus Kas</strong></div>
          <div className="tw-topbar-right">
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
          </div>
        </header>

        <div className="tw-content">
          {message && (
            <div style={{ padding: "12px", background: "rgba(16, 185, 129, 0.15)", color: "#38bdf8", border: "1px solid rgba(16, 185, 129, 0.3)", borderRadius: "10px", marginBottom: "20px" }}>
              ✓ {message}
            </div>
          )}

          {/* 3 KARTU STATISTIK KEUANGAN (SOFT SOLID DESIGN) */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "24px" }}>
            <div className="tw-card">
              <span style={{ fontSize: "0.8rem", color: "var(--tw-muted)" }}>Total Pemasukan (In)</span>
              <strong style={{ fontSize: "1.4rem", display: "block", color: "#10b981", marginTop: "6px", fontWeight: "600" }}>
                Rp {totalIn.toLocaleString("id-ID")}
              </strong>
            </div>
            <div className="tw-card">
              <span style={{ fontSize: "0.8rem", color: "var(--tw-muted)" }}>Total Pengeluaran (Out)</span>
              <strong style={{ fontSize: "1.4rem", display: "block", color: "#ef4444", marginTop: "6px", fontWeight: "600" }}>
                Rp {totalOut.toLocaleString("id-ID")}
              </strong>
            </div>
            <div className="tw-card">
              <span style={{ fontSize: "0.8rem", color: "var(--tw-muted)" }}>Saldo Kas Bersih</span>
              <strong style={{ fontSize: "1.4rem", display: "block", color: "#38bdf8", marginTop: "6px", fontWeight: "600" }}>
                Rp {netBalance.toLocaleString("id-ID")}
              </strong>
            </div>
          </div>

          <div className="tw-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <div>
                <h3 className="tw-card-title">Arus Kas &amp; Riwayat Keuangan</h3>
                <p style={{ fontSize: "0.85rem", color: "var(--tw-muted)", margin: 0 }}>Kelola pemasukan dan pengeluaran operasional toko.</p>
              </div>
              <button
                onClick={() => setShowModal(true)}
                className="tw-btn tw-btn-primary"
                style={{ padding: "10px 18px", fontSize: "0.85rem" }}
              >
                + Tambah Catat Keuangan
              </button>
            </div>

            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--tw-border)", textAlign: "left" }}>
                  <th style={{ padding: "12px", color: "var(--tw-muted)", fontSize: "0.85rem" }}>Tanggal</th>
                  <th style={{ padding: "12px", color: "var(--tw-muted)", fontSize: "0.85rem" }}>Tipe</th>
                  <th style={{ padding: "12px", color: "var(--tw-muted)", fontSize: "0.85rem" }}>Kategori</th>
                  <th style={{ padding: "12px", color: "var(--tw-muted)", fontSize: "0.85rem" }}>Keterangan</th>
                  <th style={{ padding: "12px", color: "var(--tw-muted)", fontSize: "0.85rem" }}>Nominal</th>
                  <th style={{ padding: "12px", color: "var(--tw-muted)", fontSize: "0.85rem", textAlign: "right" }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {records.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: "24px", textAlign: "center", color: "var(--tw-muted)" }}>
                      Belum ada catatan keuangan.
                    </td>
                  </tr>
                ) : (
                  records.map((r) => (
                    <tr key={r.id} style={{ borderBottom: "1px solid var(--tw-border)" }}>
                      <td style={{ padding: "12px", fontSize: "0.85rem", color: "var(--tw-muted)" }}>
                        {new Date(r.createdAt).toLocaleDateString("id-ID")}
                      </td>
                      <td style={{ padding: "12px" }}>
                        <span style={{
                          background: r.type === "IN" ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.15)",
                          color: r.type === "IN" ? "#10b981" : "#ef4444",
                          padding: "4px 10px",
                          borderRadius: "6px",
                          fontSize: "0.75rem",
                          fontWeight: "600",
                          border: `1px solid ${r.type === "IN" ? "rgba(16, 185, 129, 0.3)" : "rgba(239, 68, 68, 0.3)"}`
                        }}>
                          {r.type === "IN" ? "Pemasukan" : "Pengeluaran"}
                        </span>
                      </td>
                      <td style={{ padding: "12px", fontWeight: "600", color: "#ffffff" }}>{r.category}</td>
                      <td style={{ padding: "12px", fontSize: "0.88rem", color: "#cbd5e1" }}>{r.description}</td>
                      <td style={{ padding: "12px", fontWeight: "600", color: r.type === "IN" ? "#10b981" : "#ef4444" }}>
                        {r.type === "IN" ? "+" : "-"} Rp {r.amount.toLocaleString("id-ID")}
                      </td>
                      <td style={{ padding: "12px", textAlign: "right" }}>
                        <button
                          onClick={() => handleDelete(r.id)}
                          style={{ color: "#ef4444", background: "none", border: "none", cursor: "pointer", fontWeight: "600", fontSize: "0.8rem" }}
                        >
                          Hapus
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* MODAL TAMBAH CATAT KEUANGAN (PRESISI & SERAGAM) */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0, 0, 0, 0.75)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: "16px" }}>
          <div className="tw-card" style={{ maxWidth: "480px", width: "100%", padding: "32px", borderRadius: "16px" }}>
            <h3 className="tw-card-title" style={{ marginBottom: "16px" }}>Tambah Catatan Keuangan</h3>
            <p style={{ fontSize: "0.85rem", color: "var(--tw-muted)", marginBottom: "20px" }}>Catat arus kas masuk atau keluar operasional toko dengan presisi.</p>

            <form onSubmit={handleAddRecord} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", color: "var(--tw-muted)", marginBottom: "6px" }}>Tipe Arus Kas</label>
                <select
                  value={type}
                  onChange={(e) => {
                    const val = e.target.value as "IN" | "OUT";
                    setType(val);
                    setCategory(val === "IN" ? "Penjualan Kasir" : "Operasional Toko");
                  }}
                  style={{ width: "100%" }}
                >
                  <option value="IN">Pemasukan (Cash In)</option>
                  <option value="OUT">Pengeluaran (Cash Out)</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.8rem", color: "var(--tw-muted)", marginBottom: "6px" }}>Kategori</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  style={{ width: "100%" }}
                >
                  {type === "IN" ? (
                    <>
                      <option value="Penjualan Kasir">Penjualan Kasir</option>
                      <option value="Modal Tambahan">Modal Tambahan</option>
                      <option value="Pemasukan Lain">Pemasukan Lain</option>
                    </>
                  ) : (
                    <>
                      <option value="Operasional Toko">Operasional Toko</option>
                      <option value="Belanja Stok Barang">Belanja Stok Barang</option>
                      <option value="Gaji Karyawan">Gaji Karyawan</option>
                      <option value="Biaya Lainnya">Biaya Lainnya</option>
                    </>
                  )}
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.8rem", color: "var(--tw-muted)", marginBottom: "6px" }}>Nominal (Rp)</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value === "" ? "" : Number(e.target.value))}
                  placeholder="Contoh: 50000"
                  style={{ width: "100%" }}
                  required
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.8rem", color: "var(--tw-muted)", marginBottom: "6px" }}>Keterangan / Catatan</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Keterangan transaksi..."
                  rows={2}
                  style={{ width: "100%" }}
                />
              </div>

              <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="tw-btn tw-btn-secondary"
                  style={{ flex: 1, padding: "12px" }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="tw-btn tw-btn-primary"
                  style={{ flex: 1, padding: "12px" }}
                >
                  {loading ? "Menyimpan..." : "Simpan Catatan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}