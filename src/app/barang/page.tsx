"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Product {
  id: number;
  sku: string;
  name: string;
  price: number;
  costPrice: number;
  stock: number;
  category?: { name: string } | null;
}

export default function BarangPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // State Form Input
  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    price: "",
    costPrice: "",
    stock: "0",
  });

  // Fetch Data Barang dari API
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/products");
      const json = await res.json();
      if (json.success) {
        setProducts(json.data);
      } else {
        console.error("Gagal mengambil data:", json.error);
      }
    } catch (err) {
      console.error("Error jaringan:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Handle Submit Form Tambah Barang
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const json = await res.json();

      if (res.ok && json.success) {
        setShowModal(false);
        setFormData({ name: "", sku: "", price: "", costPrice: "", stock: "0" });
        fetchProducts();
      } else {
        alert("Gagal menambah barang: " + (json.error || "Terjadi kesalahan pada server"));
      }
    } catch (err: any) {
      alert("Terjadi kesalahan jaringan: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Hapus Barang
  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus "${name}"?`)) return;

    try {
      const res = await fetch(`/api/products?id=${id}`, {
        method: "DELETE",
      });

      const json = await res.json();

      if (res.ok && json.success) {
        fetchProducts();
      } else {
        alert("Gagal menghapus barang: " + (json.error || "Terjadi kesalahan"));
      }
    } catch (err: any) {
      alert("Terjadi kesalahan jaringan: " + err.message);
    }
  };

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
          <Link href="/barang" className="tw-nav-link tw-nav-active">
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
            Workspace <span>/</span> <strong>Barang</strong>
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
                <h2 className="tw-card-title">Daftar Barang &amp; Inventaris</h2>
                <p style={{ fontSize: "0.85rem", color: "var(--tw-muted)" }}>
                  Kelola produk, harga jual, dan stok barang toko Anda.
                </p>
              </div>
              <button
                className="tw-btn tw-btn-primary"
                onClick={() => setShowModal(true)}
              >
                + Tambah Barang
              </button>
            </div>

            <div className="tw-filter-bar">
              <input
                type="text"
                placeholder="Cari nama barang atau SKU..."
                className="tw-input"
                style={{ flex: 1, minWidth: "240px" }}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="tw-table-container">
              <table className="tw-table">
                <thead>
                  <tr>
                    <th>SKU / Kode</th>
                    <th>Nama Produk</th>
                    <th>Kategori</th>
                    <th>Harga Jual</th>
                    <th>Stok</th>
                    <th style={{ textAlign: "center" }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: "center", padding: "20px" }}>
                        Memuat data barang...
                      </td>
                    </tr>
                  ) : filteredProducts.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        style={{
                          textAlign: "center",
                          padding: "30px",
                          color: "var(--tw-muted)",
                        }}
                      >
                        Belum ada data barang. Silakan klik + Tambah Barang.
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map((p) => (
                      <tr key={p.id}>
                        <td><strong>{p.sku}</strong></td>
                        <td>{p.name}</td>
                        <td>{p.category?.name || "-"}</td>
                        <td>Rp {p.price.toLocaleString("id-ID")}</td>
                        <td>
                          <span
                            className={`tw-badge ${
                              p.stock > 0 ? "tw-badge-success" : "tw-badge-danger"
                            }`}
                          >
                            {p.stock} Unit
                          </span>
                        </td>
                        <td style={{ textAlign: "center" }}>
                          <button
                            className="tw-btn tw-btn-danger"
                            style={{ padding: "4px 10px", fontSize: "0.75rem" }}
                            onClick={() => handleDelete(p.id, p.name)}
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

          {/* Pop-up Modal Form Tambah Barang */}
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
              <div
                className="tw-card"
                style={{ width: "450px", marginBottom: 0, background: "#fff" }}
              >
                <div className="tw-card-header">
                  <h3 className="tw-card-title">Tambah Barang Baru</h3>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    style={{
                      border: "none",
                      background: "none",
                      cursor: "pointer",
                      fontSize: "1.2rem",
                    }}
                  >
                    ✕
                  </button>
                </div>
                <form onSubmit={handleSubmit}>
                  <div style={{ marginBottom: "12px" }}>
                    <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "4px" }}>
                      Nama Barang *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Kopi Susu Aren"
                      className="tw-input"
                      style={{ width: "100%" }}
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  <div style={{ marginBottom: "12px" }}>
                    <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "4px" }}>
                      SKU / Kode Barang
                    </label>
                    <input
                      type="text"
                      className="tw-input"
                      placeholder="Opsional (Otomatis jika kosong)"
                      style={{ width: "100%" }}
                      value={formData.sku}
                      onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "4px" }}>
                        Harga Beli (Modal)
                      </label>
                      <input
                        type="number"
                        placeholder="0"
                        className="tw-input"
                        style={{ width: "100%" }}
                        value={formData.costPrice}
                        onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "4px" }}>
                        Harga Jual *
                      </label>
                      <input
                        type="number"
                        required
                        placeholder="15000"
                        className="tw-input"
                        style={{ width: "100%" }}
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      />
                    </div>
                  </div>
                  <div style={{ marginBottom: "20px" }}>
                    <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "4px" }}>
                      Stok Awal
                    </label>
                    <input
                      type="number"
                      className="tw-input"
                      style={{ width: "100%" }}
                      value={formData.stock}
                      onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    />
                  </div>
                  <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                    <button
                      type="button"
                      className="tw-btn tw-btn-secondary"
                      onClick={() => setShowModal(false)}
                      disabled={submitting}
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="tw-btn tw-btn-primary"
                      disabled={submitting}
                    >
                      {submitting ? "Menyimpan..." : "Simpan Barang"}
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