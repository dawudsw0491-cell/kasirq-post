"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Customer {
  id: number;
  name: string;
  phone?: string;
  address?: string;
}

export default function PelangganPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: "", phone: "", address: "" });
  const [submitting, setSubmitting] = useState(false);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/customers");
      const json = await res.json();
      if (json.success) setCustomers(json.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setShowModal(false);
        setFormData({ name: "", phone: "", address: "" });
        fetchCustomers();
      } else {
        alert("Gagal: " + json.error);
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Hapus pelanggan "${name}"?`)) return;
    try {
      const res = await fetch(`/api/customers?id=${id}`, { method: "DELETE" });
      const json = await res.json();
      if (res.ok && json.success) fetchCustomers();
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  return (
    <main className="tw-dashboard">
      <aside className="tw-sidebar">
        <Link href="/" className="tw-brand">
          <span className="tw-brand-logo">w.</span>
          <span className="tw-brand-copy">
            <strong>TOKO WIWID</strong>
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

        <div className="tw-nav-label">TRANSAKSI</div>
        <nav className="tw-nav">
          <Link href="/pembelian" className="tw-nav-link">
            <span className="tw-nav-icon">↓</span>
            Pembelian
          </Link>
          <Link href="/penjualan" className="tw-nav-link">
            <span className="tw-nav-icon">↗</span>
            Penjualan
          </Link>
        </nav>

        <div className="tw-sidebar-bottom">
          <div className="tw-status-dot" />
          <div>
            <strong>Sistem Toko Wiwid</strong>
            <small>Workspace aktif</small>
          </div>
        </div>
      </aside>

      <div className="tw-main">
        <header className="tw-topbar">
          <div className="tw-breadcrumb">
            Workspace <span>/</span> <strong>Pelanggan</strong>
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
            <div className="tw-card-header">
              <div>
                <h2 className="tw-card-title">Daftar Pelanggan / Member</h2>
                <p style={{ fontSize: "0.85rem", color: "var(--tw-muted)" }}>
                  Kelola database pelanggan setia toko Anda.
                </p>
              </div>
              <button className="tw-btn tw-btn-primary" onClick={() => setShowModal(true)}>
                + Tambah Pelanggan
              </button>
            </div>

            <div className="tw-table-container">
              <table className="tw-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Nama Pelanggan</th>
                    <th>No. Telepon / WA</th>
                    <th>Alamat</th>
                    <th style={{ textAlign: "center" }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: "center", padding: "20px" }}>
                        Memuat data pelanggan...
                      </td>
                    </tr>
                  ) : customers.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: "center", padding: "30px", color: "var(--tw-muted)" }}>
                        Belum ada data pelanggan.
                      </td>
                    </tr>
                  ) : (
                    customers.map((c) => (
                      <tr key={c.id}>
                        <td>#{c.id}</td>
                        <td><strong>{c.name}</strong></td>
                        <td>{c.phone || "-"}</td>
                        <td>{c.address || "-"}</td>
                        <td style={{ textAlign: "center" }}>
                          <button
                            className="tw-btn tw-btn-danger"
                            style={{ padding: "4px 10px", fontSize: "0.75rem" }}
                            onClick={() => handleDelete(c.id, c.name)}
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

          {/* Modal Tambah Pelanggan */}
          {showModal && (
            <div
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: "rgba(0,0,0,0.5)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 999,
              }}
            >
              <div className="tw-card" style={{ width: "400px", marginBottom: 0, background: "#fff" }}>
                <div className="tw-card-header">
                  <h3 className="tw-card-title">Tambah Pelanggan Baru</h3>
                  <button type="button" onClick={() => setShowModal(false)} style={{ border: "none", background: "none", cursor: "pointer", fontSize: "1.2rem" }}>
                    ✕
                  </button>
                </div>
                <form onSubmit={handleSubmit}>
                  <div style={{ marginBottom: "12px" }}>
                    <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "4px" }}>Nama *</label>
                    <input
                      type="text"
                      required
                      className="tw-input"
                      style={{ width: "100%" }}
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  <div style={{ marginBottom: "12px" }}>
                    <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "4px" }}>No. Telepon / WA</label>
                    <input
                      type="text"
                      className="tw-input"
                      style={{ width: "100%" }}
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                  <div style={{ marginBottom: "20px" }}>
                    <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "4px" }}>Alamat</label>
                    <textarea
                      className="tw-input"
                      style={{ width: "100%", height: "60px" }}
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    />
                  </div>
                  <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                    <button type="button" className="tw-btn tw-btn-secondary" onClick={() => setShowModal(false)} disabled={submitting}>
                      Batal
                    </button>
                    <button type="submit" className="tw-btn tw-btn-primary" disabled={submitting}>
                      {submitting ? "Menyimpan..." : "Simpan Pelanggan"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          <footer className="tw-footer">
            <span>© {new Date().getFullYear()} Toko Wiwid</span>
            <span>Made for better business.</span>
          </footer>
        </div>
      </div>
    </main>
  );
}