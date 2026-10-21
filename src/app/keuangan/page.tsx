"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Transaction {
  id: number;
  type: "IN" | "OUT"; // IN = Pemasukan, OUT = Pengeluaran
  category: string;
  amount: number;
  description: string;
  date: string;
}

export default function KeuanganPage() {
  const [storeName, setStoreName] = useState("TOKO WIWID");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [showModal, setShowModal] = useState(false);

  // Form State
  const [type, setType] = useState<"IN" | "OUT">("OUT");
  const [category, setCategory] = useState("Operasional");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    const savedName = localStorage.getItem("tw_store_name");
    if (savedName) setStoreName(savedName);

    const savedFinance = localStorage.getItem("tw_finance");
    if (savedFinance) {
      setTransactions(JSON.parse(savedFinance));
    } else {
      const initialData: Transaction[] = [
        { id: 1, type: "OUT", category: "Listrik & Air", amount: 250000, description: "Bayar listrik toko bulan ini", date: new Date().toISOString() },
        { id: 2, type: "OUT", category: "Gaji", amount: 1500000, description: "Gaji karyawan kasir", date: new Date().toISOString() },
      ];
      setTransactions(initialData);
      localStorage.setItem("tw_finance", JSON.stringify(initialData));
    }
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const newTx: Transaction = {
      id: Date.now(),
      type,
      category,
      amount: parseFloat(amount) || 0,
      description,
      date: new Date().toISOString(),
    };

    const updated = [newTx, ...transactions];
    setTransactions(updated);
    localStorage.setItem("tw_finance", JSON.stringify(updated));

    setAmount("");
    setDescription("");
    setShowModal(false);
  };

  const handleDelete = (id: number) => {
    if (!confirm("Apakah Anda yakin ingin menghapus catatan transaksi ini?")) return;
    const updated = transactions.filter((t) => t.id !== id);
    setTransactions(updated);
    localStorage.setItem("tw_finance", JSON.stringify(updated));
  };

  // Perhitungan Keuangan
  const totalPemasukan = transactions
    .filter((t) => t.type === "IN")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalPengeluaran = transactions
    .filter((t) => t.type === "OUT")
    .reduce((sum, t) => sum + t.amount, 0);

  const arusKasBersih = totalPemasukan - totalPengeluaran;

  return (
    <main className="tw-dashboard">
      <aside className="tw-sidebar">
        <Link href="/" className="tw-brand">
          <span className="tw-brand-logo">w.</span>
          <span className="tw-brand-copy">
            <strong>{storeName}</strong>
            <small>RETAIL MANAGEMENT</small>
          </span>
        </Link>

        <div className="tw-nav-label">WORKSPACE</div>
        <nav className="tw-nav">
          <Link href="/" className="tw-nav-link">
            <span className="tw-nav-icon">⌂</span>
            Dashboard
          </Link>
          <Link href="/kasir" className="tw-nav-link">
            <span className="tw-nav-icon">▣</span>
            Kasir
          </Link>
        </nav>

        <div className="tw-nav-label">MANAJEMEN TOKO</div>
        <nav className="tw-nav">
          <Link href="/barang" className="tw-nav-link">
            <span className="tw-nav-icon">▦</span>
            Barang
          </Link>
          <Link href="/kategori" className="tw-nav-link">
            <span className="tw-nav-icon">◇</span>
            Kategori
          </Link>
          <Link href="/pelanggan" className="tw-nav-link">
            <span className="tw-nav-icon">♧</span>
            Pelanggan
          </Link>
          <Link href="/supplier" className="tw-nav-link">
            <span className="tw-nav-icon">⇄</span>
            Supplier
          </Link>
        </nav>

        <div className="tw-nav-label">TRANSAKSI &amp; SISTEM</div>
        <nav className="tw-nav">
          <Link href="/pembelian" className="tw-nav-link">
            <span className="tw-nav-icon">↓</span>
            Pembelian
          </Link>
          <Link href="/penjualan" className="tw-nav-link">
            <span className="tw-nav-icon">↗</span>
            Penjualan
          </Link>
          <Link href="/keuangan" className="tw-nav-link tw-nav-active">
            <span className="tw-nav-icon">💰</span>
            Keuangan
          </Link>
          <Link href="/pengaturan" className="tw-nav-link">
            <span className="tw-nav-icon">⚙</span>
            Pengaturan
          </Link>
        </nav>

        <div className="tw-sidebar-bottom">
          <div className="tw-status-dot" />
          <div>
            <strong>Sistem {storeName}</strong>
            <small>Workspace aktif</small>
          </div>
        </div>
      </aside>

      <div className="tw-main">
        <header className="tw-topbar">
          <div className="tw-breadcrumb">
            Transaksi &amp; Sistem <span>/</span> <strong>Arus Kas &amp; Finansial Toko</strong>
          </div>
          <div className="tw-topbar-right">
            <span className="tw-live-badge">
              <span className="tw-status-dot" />
              SISTEM AKTIF
            </span>
            <div className="tw-avatar">W</div>
          </div>
        </header>

        <div className="tw-content">
          {/* Ringkasan Finansial */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px", marginBottom: "20px" }}>
            <div className="tw-card">
              <span style={{ fontSize: "0.85rem", color: "var(--tw-muted)" }}>Lain-Lain (Pemasok/Pemasukan)</span>
              <h2 style={{ fontSize: "1.5rem", color: "#16a34a", margin: "8px 0 0 0" }}>
                +Rp {totalPemasukan.toLocaleString("id-ID")}
              </h2>
            </div>
            <div className="tw-card">
              <span style={{ fontSize: "0.85rem", color: "var(--tw-muted)" }}>Total Pengeluaran Operasional</span>
              <h2 style={{ fontSize: "1.5rem", color: "#dc2626", margin: "8px 0 0 0" }}>
                -Rp {totalPengeluaran.toLocaleString("id-ID")}
              </h2>
            </div>
            <div className="tw-card">
              <span style={{ fontSize: "0.85rem", color: "var(--tw-muted)" }}>Arus Kas Bersih (Saldo)</span>
              <h2 style={{ fontSize: "1.5rem", color: arusKasBersih >= 0 ? "#16a34a" : "#dc2626", margin: "8px 0 0 0" }}>
                Rp {arusKasBersih.toLocaleString("id-ID")}
              </h2>
            </div>
          </div>

          <div className="tw-card">
            <div className="tw-card-header" style={{ marginBottom: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 className="tw-card-title">Catatan Arus Kas &amp; Biaya Operasional</h2>
              <button className="tw-btn tw-btn-primary" onClick={() => setShowModal(true)}>
                + Catat Transaksi Keuangan
              </button>
            </div>

            {transactions.length === 0 ? (
              <p style={{ textAlign: "center", color: "var(--tw-muted)", padding: "20px" }}>Belum ada catatan transaksi keuangan.</p>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table className="tw-table" style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: "2px solid var(--tw-border)", textAlign: "left" }}>
                      <th style={{ padding: "10px" }}>Tanggal</th>
                      <th style={{ padding: "10px" }}>Jenis</th>
                      <th style={{ padding: "10px" }}>Kategori</th>
                      <th style={{ padding: "10px" }}>Keterangan</th>
                      <th style={{ padding: "10px", textAlign: "right" }}>Jumlah (Rp)</th>
                      <th style={{ padding: "10px", textAlign: "center" }}>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((t) => (
                      <tr key={t.id} style={{ borderBottom: "1px solid var(--tw-border)" }}>
                        <td style={{ padding: "10px", fontSize: "0.85rem" }}>
                          {new Date(t.date).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}
                        </td>
                        <td style={{ padding: "10px" }}>
                          <span
                            style={{
                              padding: "2px 8px",
                              borderRadius: "12px",
                              fontSize: "0.75rem",
                              fontWeight: "bold",
                              background: t.type === "IN" ? "#dcfce7" : "#fee2e2",
                              color: t.type === "IN" ? "#166534" : "#991b1b",
                            }}
                          >
                            {t.type === "IN" ? "PEMASUKAN" : "PENGELUARAN"}
                          </span>
                        </td>
                        <td style={{ padding: "10px", fontWeight: "bold" }}>{t.category}</td>
                        <td style={{ padding: "10px" }}>{t.description || "-"}</td>
                        <td
                          style={{
                            padding: "10px",
                            textAlign: "right",
                            fontWeight: "bold",
                            color: t.type === "IN" ? "#16a34a" : "#dc2626",
                          }}
                        >
                          {t.type === "IN" ? "+" : "-"}Rp {t.amount.toLocaleString("id-ID")}
                        </td>
                        <td style={{ padding: "10px", textAlign: "center" }}>
                          <button
                            className="tw-btn"
                            style={{ padding: "4px 8px", fontSize: "0.8rem", background: "#fee2e2", color: "#991b1b" }}
                            onClick={() => handleDelete(t.id)}
                          >
                            Hapus
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODAL CATAT TRANSAKSI KEUANGAN */}
      {showModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }}>
          <div className="tw-card" style={{ background: "#fff", padding: "24px", maxWidth: "420px", width: "100%" }}>
            <h3 style={{ marginBottom: "16px" }}>Catat Keuangan Baru</h3>

            <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "4px" }}>Jenis Transaksi</label>
                <select
                  className="tw-input"
                  style={{ width: "100%" }}
                  value={type}
                  onChange={(e) => setType(e.target.value as "IN" | "OUT")}
                >
                  <option value="OUT">Pengeluaran (Biaya)</option>
                  <option value="IN">Pemasukan Non-Penjualan</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "4px" }}>Kategori</label>
                <select
                  className="tw-input"
                  style={{ width: "100%" }}
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="Operasional">Operasional Toko</option>
                  <option value="Listrik &amp; Air">Listrik &amp; Air</option>
                  <option value="Gaji">Gaji Karyawan</option>
                  <option value="Sewa Tempat">Sewa Tempat</option>
                  <option value="Lain-lain">Lain-lain</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "4px" }}>Jumlah (Rp)</label>
                <input
                  type="number"
                  className="tw-input"
                  style={{ width: "100%" }}
                  placeholder="Misal: 150000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "4px" }}>Keterangan / Catatan</label>
                <input
                  type="text"
                  className="tw-input"
                  style={{ width: "100%" }}
                  placeholder="Contoh: Beli kertas struk &amp; kantong plastik"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div style={{ display: "flex", gap: "10px", marginTop: "12px" }}>
                <button type="submit" className="tw-btn tw-btn-primary" style={{ flex: 1 }}>
                  Simpan Catatan ↗
                </button>
                <button type="button" className="tw-btn tw-btn-secondary" onClick={() => setShowModal(false)}>
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}