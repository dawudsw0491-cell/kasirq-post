"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function SupplierPage() {
  const [storeName, setStoreName] = useState("KASIRQ STORE");
  const [isOnline, setIsOnline] = useState(true);
  const [suppliers, setSuppliers] = useState<any[]>([]);

  // State untuk form Tambah Supplier
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const savedStore = localStorage.getItem("tw_store_name");
    if (savedStore) setStoreName(savedStore);

    const savedSuppliers = localStorage.getItem("tw_suppliers");
    if (savedSuppliers) {
      try {
        setSuppliers(JSON.parse(savedSuppliers));
      } catch (e) {
        setSuppliers([]);
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

  const handleAddSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      alert("Nama supplier dan No. Telepon wajib diisi!");
      return;
    }

    const newSup = {
      id: Date.now(),
      name,
      contact: contact || "-",
      phone,
      address: address || "-",
    };

    const updated = [newSup, ...suppliers];
    setSuppliers(updated);
    localStorage.setItem("tw_suppliers", JSON.stringify(updated));

    setName("");
    setContact("");
    setPhone("");
    setAddress("");
    setShowModal(false);
    setMessage("Supplier baru berhasil ditambahkan!");
    setTimeout(() => setMessage(""), 3000);
  };

  const handleDelete = (id: number) => {
    if (confirm("Yakin ingin menghapus supplier ini?")) {
      const updated = suppliers.filter((s) => s.id !== id);
      setSuppliers(updated);
      localStorage.setItem("tw_suppliers", JSON.stringify(updated));
      setMessage("Supplier berhasil dihapus.");
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
          <Link href="/supplier" className="tw-nav-link tw-nav-active"><span className="tw-nav-icon">⇄</span>Supplier</Link>
        </nav>

        <div className="tw-nav-label">TRANSAKSI &amp; SISTEM</div>
        <nav className="tw-nav">
          <Link href="/pembelian" className="tw-nav-link"><span className="tw-nav-icon">↓</span>Pembelian</Link>
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
            Manajemen Toko <span>/</span> <strong>Data Supplier</strong>
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

          {/* KARTU KONTROL & TOMBOL TAMBAH SUPPLIER */}
          <div className="tw-card" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <h3 className="tw-card-title">Daftar Supplier / Pemasok</h3>
              <p style={{ fontSize: "0.85rem", color: "var(--tw-muted)", margin: 0 }}>
                Kelola daftar vendor dan distributor produk toko Anda.
              </p>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="tw-btn tw-btn-primary"
              style={{ padding: "10px 20px", display: "flex", alignItems: "center", gap: "8px" }}
            >
              <span>+</span> Tambah Supplier Baru
            </button>
          </div>

          {/* TABEL DAFTAR SUPPLIER */}
          <div className="tw-card">
            <h4 style={{ fontSize: "1rem", color: "#ffffff", marginBottom: "16px" }}>Database Supplier</h4>
            {suppliers.length === 0 ? (
              <div style={{ padding: "40px", textAlign: "center", color: "var(--tw-muted)", border: "1px dashed var(--tw-border)", borderRadius: "10px" }}>
                Belum ada data supplier tersimpan. Klik tombol <strong>"Tambah Supplier Baru"</strong> di atas.
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.9rem" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--tw-border)", color: "var(--tw-muted)" }}>
                      <th style={{ padding: "10px" }}>Nama Supplier / Toko</th>
                      <th style={{ padding: "10px" }}>Kontak Person</th>
                      <th style={{ padding: "10px" }}>No. Telepon / WA</th>
                      <th style={{ padding: "10px" }}>Alamat</th>
                      <th style={{ padding: "10px", textAlign: "center" }}>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {suppliers.map((s) => (
                      <tr key={s.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                        <td style={{ padding: "12px 10px", color: "#ffffff", fontWeight: "500" }}>{s.name}</td>
                        <td style={{ padding: "12px 10px", color: "var(--tw-muted)" }}>{s.contact}</td>
                        <td style={{ padding: "12px 10px", color: "#38bdf8" }}>{s.phone}</td>
                        <td style={{ padding: "12px 10px", color: "var(--tw-muted)" }}>{s.address}</td>
                        <td style={{ padding: "12px 10px", textAlign: "center" }}>
                          <button
                            onClick={() => handleDelete(s.id)}
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

      {/* MODAL FORM TAMBAH SUPPLIER */}
      {showModal && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div className="tw-card" style={{ width: "100%", maxWidth: "420px", background: "#0f172a", border: "1px solid var(--tw-border)" }}>
            <h3 className="tw-card-title" style={{ marginBottom: "16px" }}>Tambah Supplier Baru</h3>
            <form onSubmit={handleAddSupplier} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", color: "var(--tw-muted)", marginBottom: "4px" }}>Nama Supplier / Perusahaan</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Contoh: PT Distributor Jaya" style={{ width: "100%" }} required />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", color: "var(--tw-muted)", marginBottom: "4px" }}>Kontak Person</label>
                  <input type="text" value={contact} onChange={(e) => setContact(e.target.value)} placeholder="Contoh: Bpk. Andi" style={{ width: "100%" }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", color: "var(--tw-muted)", marginBottom: "4px" }}>No. Telepon / WA</label>
                  <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Contoh: 08123456789" style={{ width: "100%" }} required />
                </div>
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", color: "var(--tw-muted)", marginBottom: "4px" }}>Alamat (Opsional)</label>
                <textarea value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Alamat supplier..." rows={2} style={{ width: "100%" }} />
              </div>
              <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
                <button type="button" onClick={() => setShowModal(false)} className="tw-btn" style={{ flex: 1, backgroundColor: "rgba(255,255,255,0.1)", color: "#ffffff" }}>
                  Batal
                </button>
                <button type="submit" className="tw-btn tw-btn-primary" style={{ flex: 1 }}>
                  Simpan Supplier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}