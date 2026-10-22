"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function PelangganPage() {
  const [storeName, setStoreName] = useState("KASIRQ STORE");
  const [isOnline, setIsOnline] = useState(true);
  const [customers, setCustomers] = useState<any[]>([]);

  // State untuk form Tambah Pelanggan
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const savedStore = localStorage.getItem("tw_store_name");
    if (savedStore) setStoreName(savedStore);

    const savedCustomers = localStorage.getItem("tw_customers");
    if (savedCustomers) {
      try {
        setCustomers(JSON.parse(savedCustomers));
      } catch (e) {
        setCustomers([]);
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

  const handleAddCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      alert("Nama dan No. Telepon pelanggan wajib diisi!");
      return;
    }

    const newCust = {
      id: Date.now(),
      name,
      phone,
      address: address || "-",
    };

    const updated = [newCust, ...customers];
    setCustomers(updated);
    localStorage.setItem("tw_customers", JSON.stringify(updated));

    setName("");
    setPhone("");
    setAddress("");
    setShowModal(false);
    setMessage("Pelanggan baru berhasil ditambahkan!");
    setTimeout(() => setMessage(""), 3000);
  };

  const handleDelete = (id: number) => {
    if (confirm("Yakin ingin menghapus pelanggan ini?")) {
      const updated = customers.filter((c) => c.id !== id);
      setCustomers(updated);
      localStorage.setItem("tw_customers", JSON.stringify(updated));
      setMessage("Pelanggan berhasil dihapus.");
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
          <Link href="/pelanggan" className="tw-nav-link tw-nav-active"><span className="tw-nav-icon">♧</span>Pelanggan</Link>
          <Link href="/supplier" className="tw-nav-link"><span className="tw-nav-icon">⇄</span>Supplier</Link>
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
            Manajemen Toko <span>/</span> <strong>Data Pelanggan</strong>
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
                  boxShadow: isOnline ? "0 0 8px #10b981" : "0 0 8px #10b981",
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

          {/* KARTU KONTROL & TOMBOL TAMBAH PELANGGAN */}
          <div className="tw-card" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <h3 className="tw-card-title">Daftar Pelanggan &amp; Member</h3>
              <p style={{ fontSize: "0.85rem", color: "var(--tw-muted)", margin: 0 }}>
                Kelola data pelanggan dan member setia toko Anda.
              </p>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="tw-btn tw-btn-primary"
              style={{ padding: "10px 20px", display: "flex", alignItems: "center", gap: "8px" }}
            >
              <span>+</span> Tambah Pelanggan Baru
            </button>
          </div>

          {/* TABEL DAFTAR PELANGGAN */}
          <div className="tw-card">
            <h4 style={{ fontSize: "1rem", color: "#ffffff", marginBottom: "16px" }}>Database Pelanggan</h4>
            {customers.length === 0 ? (
              <div style={{ padding: "40px", textAlign: "center", color: "var(--tw-muted)", border: "1px dashed var(--tw-border)", borderRadius: "10px" }}>
                Belum ada data pelanggan tersimpan. Klik tombol <strong>"Tambah Pelanggan Baru"</strong> di atas.
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.9rem" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--tw-border)", color: "var(--tw-muted)" }}>
                      <th style={{ padding: "10px" }}>Nama Pelanggan</th>
                      <th style={{ padding: "10px" }}>No. Telepon / WhatsApp</th>
                      <th style={{ padding: "10px" }}>Alamat</th>
                      <th style={{ padding: "10px", textAlign: "center" }}>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customers.map((c) => (
                      <tr key={c.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                        <td style={{ padding: "12px 10px", color: "#ffffff", fontWeight: "500" }}>{c.name}</td>
                        <td style={{ padding: "12px 10px", color: "#38bdf8" }}>{c.phone}</td>
                        <td style={{ padding: "12px 10px", color: "var(--tw-muted)" }}>{c.address}</td>
                        <td style={{ padding: "12px 10px", textAlign: "center" }}>
                          <button
                            onClick={() => handleDelete(c.id)}
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

      {/* MODAL FORM TAMBAH PELANGGAN */}
      {showModal && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div className="tw-card" style={{ width: "100%", maxWidth: "400px", background: "#0f172a", border: "1px solid var(--tw-border)" }}>
            <h3 className="tw-card-title" style={{ marginBottom: "16px" }}>Tambah Pelanggan Baru</h3>
            <form onSubmit={handleAddCustomer} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", color: "var(--tw-muted)", marginBottom: "4px" }}>Nama Lengkap</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Contoh: Budi Santoso" style={{ width: "100%" }} required />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", color: "var(--tw-muted)", marginBottom: "4px" }}>No. Telepon / WhatsApp</label>
                <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Contoh: 08123456789" style={{ width: "100%" }} required />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", color: "var(--tw-muted)", marginBottom: "4px" }}>Alamat (Opsional)</label>
                <textarea value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Alamat pelanggan..." rows={2} style={{ width: "100%" }} />
              </div>
              <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
                <button type="button" onClick={() => setShowModal(false)} className="tw-btn" style={{ flex: 1, backgroundColor: "rgba(255,255,255,0.1)", color: "#ffffff" }}>
                  Batal
                </button>
                <button type="submit" className="tw-btn tw-btn-primary" style={{ flex: 1 }}>
                  Simpan Pelanggan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}