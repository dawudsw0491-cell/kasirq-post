"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function PembelianPage() {
  const [storeName, setStoreName] = useState("KASIRQ STORE");
  const [isOnline, setIsOnline] = useState(true);
  const [purchases, setPurchases] = useState<any[]>([]);

  // State untuk form Tambah Pembelian (Input Bebas seperti semula)
  const [showModal, setShowModal] = useState(false);
  const [supplierName, setSupplierName] = useState("");
  const [itemName, setItemName] = useState("");
  const [qty, setQty] = useState<number | "">("");
  const [totalCost, setTotalCost] = useState<number | "">("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const savedStore = localStorage.getItem("tw_store_name");
    if (savedStore) setStoreName(savedStore);

    const savedPurchases = localStorage.getItem("tw_purchases");
    if (savedPurchases) {
      try {
        setPurchases(JSON.parse(savedPurchases));
      } catch (e) {
        setPurchases([]);
      }
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

  const handleAddPurchase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierName.trim() || !itemName.trim() || qty === "" || totalCost === "") {
      alert("Semua field form pembelian wajib diisi dengan benar!");
      return;
    }

    const newPurchase = {
      id: Date.now(),
      date: new Date().toLocaleDateString("id-ID"),
      supplierName,
      itemName,
      qty: Number(qty) || 0,
      totalCost: Number(totalCost) || 0,
    };

    const updated = [newPurchase, ...purchases];
    setPurchases(updated);
    localStorage.setItem("tw_purchases", JSON.stringify(updated));

    // Catat otomatis ke data keuangan jika ada
    const savedFin = localStorage.getItem("tw_financial_records");
    let finData = savedFin ? JSON.parse(savedFin) : [];
    finData.unshift({
      id: Date.now(),
      date: new Date().toLocaleDateString("id-ID"),
      description: `Pembelian/Restock ${itemName} dari ${supplierName}`,
      type: "OUT",
      amount: Number(totalCost) || 0,
    });
    localStorage.setItem("tw_financial_records", JSON.stringify(finData));

    // Reset form & tutup modal
    setSupplierName("");
    setItemName("");
    setQty("");
    setTotalCost("");
    setShowModal(false);
    setMessage("Transaksi pembelian berhasil dicatat!");
    setTimeout(() => setMessage(""), 3000);
  };

  const handleDelete = (id: number) => {
    if (confirm("Yakin ingin menghapus riwayat pembelian ini?")) {
      const updated = purchases.filter((p) => p.id !== id);
      setPurchases(updated);
      localStorage.setItem("tw_purchases", JSON.stringify(updated));
      setMessage("Riwayat pembelian berhasil dihapus.");
      setTimeout(() => setMessage(""), 3000);
    }
  };

  return (
    <main className="tw-dashboard" style={{ animation: "fadeIn 0.3s ease-in-out" }}>
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
          <Link href="/pembelian" className="tw-nav-link tw-nav-active"><span className="tw-nav-icon">↓</span>Pembelian</Link>
          <Link href="/penjualan" className="tw-nav-link"><span className="tw-nav-icon">↗</span>Penjualan</Link>
          <Link href="/keuangan" className="tw-nav-link"><span className="tw-nav-icon">💰</span>Keuangan</Link>
          <Link href="/pengaturan" className="tw-nav-link"><span className="tw-nav-icon">⚙</span>Pengaturan</Link>
        </nav>

        <div className="tw-sidebar-bottom">
          <div
            className="tw-status-dot"
            style={{
              backgroundColor: isOnline ? "#10b981" : "#ef4444",
              boxShadow: isOnline ? "0 0 8px #10b981" : "0 0 8px #ef4444",
            }}
          />
          <div>
            <strong>Sistem {storeName}</strong>
            <small>{isOnline ? "Online (Terhubung)" : "Offline (Terputus)"}</small>
          </div>
        </div>
      </aside>

      <div className="tw-main">
        <header className="tw-topbar">
          <div className="tw-breadcrumb">
            Transaksi <span>/</span> <strong>Data Pembelian Stok</strong>
          </div>
          
          {/* TOPBAR KANAN TANPA LOGO W, HANYA STATUS ONLINE/OFFLINE */}
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
              {isOnline ? "ONLINE" : "OFFLINE"}
            </span>
          </div>
        </header>

        <div className="tw-content" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {message && (
            <div style={{ padding: "12px", background: "rgba(16, 185, 129, 0.15)", color: "#38bdf8", border: "1px solid rgba(16, 185, 129, 0.3)", borderRadius: "10px" }}>
              ✓ {message}
            </div>
          )}

          {/* KARTU KONTROL & TOMBOL TAMBAH PEMBELIAN */}
          <div className="tw-card" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <h3 className="tw-card-title">Riwayat Pembelian &amp; Restock</h3>
              <p style={{ fontSize: "0.85rem", color: "var(--tw-muted)", margin: 0 }}>
                Catat pengadaan barang dan pembelian stok dari supplier.
              </p>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="tw-btn tw-btn-primary"
              style={{ padding: "10px 20px", display: "flex", alignItems: "center", gap: "8px" }}
            >
              <span>+</span> Catat Pembelian Baru
            </button>
          </div>

          {/* TABEL DAFTAR PEMBELIAN */}
          <div className="tw-card">
            <h4 style={{ fontSize: "1rem", color: "#ffffff", marginBottom: "16px" }}>Database Pembelian Stok</h4>
            {purchases.length === 0 ? (
              <div style={{ padding: "40px", textAlign: "center", color: "var(--tw-muted)", border: "1px dashed var(--tw-border)", borderRadius: "10px" }}>
                Belum ada data pembelian tersimpan. Klik tombol <strong>"Catat Pembelian Baru"</strong> di atas.
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.9rem" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--tw-border)", color: "var(--tw-muted)" }}>
                      <th style={{ padding: "10px" }}>Tanggal</th>
                      <th style={{ padding: "10px" }}>Supplier</th>
                      <th style={{ padding: "10px" }}>Nama Barang</th>
                      <th style={{ padding: "10px" }}>Jumlah (Qty)</th>
                      <th style={{ padding: "10px" }}>Total Biaya</th>
                      <th style={{ padding: "10px", textAlign: "center" }}>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {purchases.map((p) => (
                      <tr key={p.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                        <td style={{ padding: "12px 10px", color: "var(--tw-muted)" }}>{p.date}</td>
                        <td style={{ padding: "12px 10px", color: "#ffffff", fontWeight: "500" }}>{p.supplierName}</td>
                        <td style={{ padding: "12px 10px", color: "var(--tw-muted)" }}>{p.itemName}</td>
                        <td style={{ padding: "12px 10px" }}>{p.qty} unit</td>
                        <td style={{ padding: "12px 10px", color: "#38bdf8", fontWeight: "600" }}>Rp {p.totalCost.toLocaleString("id-ID")}</td>
                        <td style={{ padding: "12px 10px", textAlign: "center" }}>
                          <button
                            onClick={() => handleDelete(p.id)}
                            style={{ background: "transparent", border: "none", color: "#ef4444", cursor: "pointer", fontSize: "0.85rem", textDecoration: "underline" }}
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

      {/* MODAL FORM TAMBAH PEMBELIAN */}
      {showModal && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div className="tw-card" style={{ width: "100%", maxWidth: "420px", background: "#0f172a", border: "1px solid var(--tw-border)" }}>
            <h3 className="tw-card-title" style={{ marginBottom: "16px" }}>Catat Pembelian / Restock</h3>
            <form onSubmit={handleAddPurchase} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", color: "var(--tw-muted)", marginBottom: "4px" }}>Nama Supplier</label>
                <input type="text" value={supplierName} onChange={(e) => setSupplierName(e.target.value)} placeholder="Contoh: PT Distributor Jaya" style={{ width: "100%" }} required />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", color: "var(--tw-muted)", marginBottom: "4px" }}>Nama Barang</label>
                <input type="text" value={itemName} onChange={(e) => setItemName(e.target.value)} placeholder="Contoh: Kopi Bubuk 1Kg" style={{ width: "100%" }} required />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", color: "var(--tw-muted)", marginBottom: "4px" }}>Jumlah (Qty)</label>
                  <input type="number" value={qty} onChange={(e) => setQty(e.target.value === "" ? "" : Number(e.target.value))} placeholder="0" style={{ width: "100%" }} required />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", color: "var(--tw-muted)", marginBottom: "4px" }}>Total Biaya (Rp)</label>
                  <input type="number" value={totalCost} onChange={(e) => setTotalCost(e.target.value === "" ? "" : Number(e.target.value))} placeholder="0" style={{ width: "100%" }} required />
                </div>
              </div>
              <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
                <button type="button" onClick={() => setShowModal(false)} className="tw-btn" style={{ flex: 1, backgroundColor: "rgba(255,255,255,0.1)", color: "#ffffff" }}>
                  Batal
                </button>
                <button type="submit" className="tw-btn tw-btn-primary" style={{ flex: 1 }}>
                  Simpan Transaksi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}