"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Product {
  id: number;
  sku: string;
  name: string;
  stock: number;
}

export default function PembelianPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [qtyToAdd, setQtyToAdd] = useState("10");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/products");
      const json = await res.json();
      if (json.success) setProducts(json.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleRestock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId) return alert("Pilih produk terlebih dahulu!");

    setSubmitting(true);
    try {
      const res = await fetch("/api/purchases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: selectedProductId,
          qtyToAdd,
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        alert("Stok berhasil ditambahkan!");
        setSelectedProductId("");
        setQtyToAdd("10");
        fetchProducts();
      } else {
        alert("Gagal: " + json.error);
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setSubmitting(false);
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
          <Link href="/pembelian" className="tw-nav-link tw-nav-active">
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
            Workspace <span>/</span> <strong>Pembelian &amp; Restock</strong>
          </div>
          <div className="tw-topbar-right">
            <span className="tw-live-badge">
              <span className="tw-status-dot" />
              SISTEM AKTIF
            </span>
            <div className="tw-avatar">W</div>
          </div>
        </header>

        <div className="tw-content" style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: "20px" }}>
          <div className="tw-card">
            <div className="tw-card-header">
              <h2 className="tw-card-title">Stok Barang Saat Ini</h2>
            </div>
            <div className="tw-table-container">
              <table className="tw-table">
                <thead>
                  <tr>
                    <th>SKU</th>
                    <th>Nama Barang</th>
                    <th>Stok Tersedia</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={3} style={{ textAlign: "center", padding: "20px" }}>
                        Memuat data barang...
                      </td>
                    </tr>
                  ) : (
                    products.map((p) => (
                      <tr key={p.id}>
                        <td><strong>{p.sku}</strong></td>
                        <td>{p.name}</td>
                        <td>
                          <span className={`tw-badge ${p.stock > 0 ? "tw-badge-success" : "tw-badge-danger"}`}>
                            {p.stock} Unit
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="tw-card" style={{ height: "fit-content" }}>
            <h3 className="tw-card-title" style={{ marginBottom: "15px" }}>Form Restock Barang</h3>
            <form onSubmit={handleRestock}>
              <div style={{ marginBottom: "12px" }}>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "4px" }}>
                  Pilih Produk *
                </label>
                <select
                  required
                  className="tw-input"
                  style={{ width: "100%" }}
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                >
                  <option value="">-- Pilih Barang --</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Stok: {p.stock})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "4px" }}>
                  Jumlah Tambahan Stok *
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  className="tw-input"
                  style={{ width: "100%" }}
                  value={qtyToAdd}
                  onChange={(e) => setQtyToAdd(e.target.value)}
                />
              </div>

              <button
                type="submit"
                className="tw-btn tw-btn-primary"
                style={{ width: "100%", padding: "10px" }}
                disabled={submitting}
              >
                {submitting ? "Memproses..." : "+ Tambah Stok Masuk"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}