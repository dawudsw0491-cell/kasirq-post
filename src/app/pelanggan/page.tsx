"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Customer {
  id: number;
  name: string;
  phone: string;
  address: string;
}

export default function PelangganPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [storeName, setStoreName] = useState("TOKO WIWID");

  // Form State
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  useEffect(() => {
    const savedName = localStorage.getItem("tw_store_name");
    if (savedName) setStoreName(savedName);

    const savedCustomers = localStorage.getItem("tw_customers");
    if (savedCustomers) {
      setCustomers(JSON.parse(savedCustomers));
    } else {
      const initialCustomers = [
        { id: 1, name: "Budi Santoso", phone: "081298765432", address: "Jl. Veteran No. 12" },
        { id: 2, name: "Siti Rahmawati", phone: "085643219876", address: "Gentan, Sukoharjo" },
      ];
      setCustomers(initialCustomers);
      localStorage.setItem("tw_customers", JSON.stringify(initialCustomers));
    }
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const newCustomer = {
      id: Date.now(),
      name,
      phone,
      address,
    };

    const updated = [newCustomer, ...customers];
    setCustomers(updated);
    localStorage.setItem("tw_customers", JSON.stringify(updated));

    setName("");
    setPhone("");
    setAddress("");
    setShowModal(false);
  };

  const handleDelete = (id: number) => {
    if (!confirm("Apakah Anda yakin ingin menghapus pelanggan ini?")) return;
    const updated = customers.filter((c) => c.id !== id);
    setCustomers(updated);
    localStorage.setItem("tw_customers", JSON.stringify(updated));
  };

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
          <Link href="/pelanggan" className="tw-nav-link tw-nav-active">
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
            Manajemen Toko <span>/</span> <strong>Data Pelanggan &amp; Member</strong>
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
          <div className="tw-card">
            <div className="tw-card-header" style={{ marginBottom: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 className="tw-card-title">Daftar Pelanggan / Member Toko</h2>
              <button className="tw-btn tw-btn-primary" onClick={() => setShowModal(true)}>
                + Tambah Pelanggan
              </button>
            </div>

            {customers.length === 0 ? (
              <p style={{ textAlign: "center", color: "var(--tw-muted)", padding: "20px" }}>Belum ada data pelanggan yang tersimpan.</p>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table className="tw-table" style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: "2px solid var(--tw-border)", textAlign: "left" }}>
                      <th style={{ padding: "10px" }}>Nama Pelanggan</th>
                      <th style={{ padding: "10px" }}>No. HP / WhatsApp</th>
                      <th style={{ padding: "10px" }}>Alamat</th>
                      <th style={{ padding: "10px", textAlign: "center" }}>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customers.map((c) => (
                      <tr key={c.id} style={{ borderBottom: "1px solid var(--tw-border)" }}>
                        <td style={{ padding: "10px", fontWeight: "bold" }}>{c.name}</td>
                        <td style={{ padding: "10px" }}>{c.phone}</td>
                        <td style={{ padding: "10px" }}>{c.address}</td>
                        <td style={{ padding: "10px", textAlign: "center" }}>
                          <button
                            className="tw-btn"
                            style={{ padding: "4px 8px", fontSize: "0.8rem", background: "#fee2e2", color: "#991b1b" }}
                            onClick={() => handleDelete(c.id)}
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

      {/* MODAL TAMBAH PELANGGAN */}
      {showModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }}>
          <div className="tw-card" style={{ background: "#fff", padding: "24px", maxWidth: "420px", width: "100%" }}>
            <h3 style={{ marginBottom: "16px" }}>Tambah Pelanggan Baru</h3>

            <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "4px" }}>Nama Lengkap</label>
                <input type="text" className="tw-input" style={{ width: "100%" }} value={name} onChange={(e) => setName(e.target.value)} required />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "4px" }}>No. HP / WhatsApp</label>
                <input type="text" className="tw-input" style={{ width: "100%" }} value={phone} onChange={(e) => setPhone(e.target.value)} required />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "4px" }}>Alamat</label>
                <input type="text" className="tw-input" style={{ width: "100%" }} value={address} onChange={(e) => setAddress(e.target.value)} />
              </div>

              <div style={{ display: "flex", gap: "10px", marginTop: "12px" }}>
                <button type="submit" className="tw-btn tw-btn-primary" style={{ flex: 1 }}>
                  Simpan Pelanggan ↗
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