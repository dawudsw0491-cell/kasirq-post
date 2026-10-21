"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Product {
  id: number;
  sku: string;
  name: string;
  price: number;
  costPrice?: number;
  stock: number;
}

export default function BarangPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [storeName, setStoreName] = useState("TOKO WIWID");

  // Form State
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [sku, setSku] = useState("");
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [costPrice, setCostPrice] = useState("");
  const [stock, setStock] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/products");
      const json = await res.json();
      if (json.success) setProducts(json.data);
    } catch (err) {
      console.error("Gagal mengambil data produk:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    const savedName = localStorage.getItem("tw_store_name");
    if (savedName) setStoreName(savedName);
  }, []);

  const openAddModal = () => {
    setEditingProduct(null);
    setSku(`BRG-${Math.floor(1000 + Math.random() * 9000)}`);
    setName("");
    setPrice("");
    setCostPrice("");
    setStock("10");
    setShowModal(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setSku(product.sku);
    setName(product.name);
    setPrice(product.price.toString());
    setCostPrice(product.costPrice ? product.costPrice.toString() : "");
    setStock(product.stock.toString());
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const payload = {
      sku,
      name,
      price: parseFloat(price) || 0,
      costPrice: parseFloat(costPrice) || 0,
      stock: parseInt(stock) || 0,
    };

    try {
      const url = editingProduct ? `/api/products/${editingProduct.id}` : "/api/products";
      const method = editingProduct ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setShowModal(false);
        fetchProducts();
      } else {
        alert("Gagal menyimpan data: " + json.error);
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Apakah Anda yakin ingin menghapus barang ini?")) return;

    try {
      const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (res.ok && json.success) {
        fetchProducts();
      } else {
        alert("Gagal menghapus produk: " + json.error);
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const lowStockCount = products.filter((p) => p.stock <= 5).length;

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
            Manajemen Toko <span>/</span> <strong>Stok &amp; Data Barang</strong>
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
          {/* Ringkasan Statistik Stok */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "20px" }}>
            <div className="tw-card">
              <span style={{ fontSize: "0.85rem", color: "var(--tw-muted)" }}>Total Item Produk</span>
              <h2 style={{ fontSize: "1.5rem", margin: "8px 0 0 0" }}>{products.length} Barang</h2>
            </div>
            <div className="tw-card">
              <span style={{ fontSize: "0.85rem", color: "var(--tw-muted)" }}>Stok Kritis (&le; 5 pcs)</span>
              <h2 style={{ fontSize: "1.5rem", color: lowStockCount > 0 ? "#dc2626" : "#16a34a", margin: "8px 0 0 0" }}>
                {lowStockCount} Item
              </h2>
            </div>
          </div>

          <div className="tw-card">
            <div className="tw-card-header" style={{ marginBottom: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <input
                type="text"
                placeholder="Cari nama barang / SKU..."
                className="tw-input"
                style={{ width: "260px" }}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button className="tw-btn tw-btn-primary" onClick={openAddModal}>
                + Tambah Barang Baru
              </button>
            </div>

            {loading ? (
              <p>Memuat data barang...</p>
            ) : filteredProducts.length === 0 ? (
              <p style={{ textAlign: "center", color: "var(--tw-muted)", padding: "20px" }}>Tidak ada data barang yang ditemukan.</p>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table className="tw-table" style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: "2px solid var(--tw-border)", textAlign: "left" }}>
                      <th style={{ padding: "10px" }}>SKU</th>
                      <th style={{ padding: "10px" }}>Nama Barang</th>
                      <th style={{ padding: "10px", textAlign: "right" }}>Harga Jual</th>
                      <th style={{ padding: "10px", textAlign: "right" }}>Stok</th>
                      <th style={{ padding: "10px", textAlign: "center" }}>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map((p) => (
                      <tr key={p.id} style={{ borderBottom: "1px solid var(--tw-border)" }}>
                        <td style={{ padding: "10px", fontWeight: "bold" }}>{p.sku}</td>
                        <td style={{ padding: "10px" }}>{p.name}</td>
                        <td style={{ padding: "10px", textAlign: "right", fontWeight: "bold", color: "var(--tw-primary)" }}>
                          Rp {p.price.toLocaleString("id-ID")}
                        </td>
                        <td style={{ padding: "10px", textAlign: "right" }}>
                          <span
                            style={{
                              padding: "2px 8px",
                              borderRadius: "12px",
                              fontSize: "0.8rem",
                              fontWeight: "bold",
                              background: p.stock <= 5 ? "#fee2e2" : "#dcfce7",
                              color: p.stock <= 5 ? "#991b1b" : "#166534",
                            }}
                          >
                            {p.stock} pcs
                          </span>
                        </td>
                        <td style={{ padding: "10px", textAlign: "center" }}>
                          <button
                            className="tw-btn"
                            style={{ padding: "4px 8px", marginRight: "6px", fontSize: "0.8rem" }}
                            onClick={() => openEditModal(p)}
                          >
                            Edit
                          </button>
                          <button
                            className="tw-btn"
                            style={{ padding: "4px 8px", fontSize: "0.8rem", background: "#fee2e2", color: "#991b1b" }}
                            onClick={() => handleDelete(p.id)}
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

      {/* MODAL TAMBAH / EDIT BARANG */}
      {showModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }}>
          <div className="tw-card" style={{ background: "#fff", padding: "24px", maxWidth: "420px", width: "100%" }}>
            <h3 style={{ marginBottom: "16px" }}>{editingProduct ? "Edit Data Barang" : "Tambah Barang Baru"}</h3>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "4px" }}>Kode SKU / Barcode</label>
                <input type="text" className="tw-input" style={{ width: "100%" }} value={sku} onChange={(e) => setSku(e.target.value)} required />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "4px" }}>Nama Barang</label>
                <input type="text" className="tw-input" style={{ width: "100%" }} value={name} onChange={(e) => setName(e.target.value)} required />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "4px" }}>Harga Jual (Rp)</label>
                <input type="number" className="tw-input" style={{ width: "100%" }} value={price} onChange={(e) => setPrice(e.target.value)} required />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "4px" }}>Jumlah Stok</label>
                <input type="number" className="tw-input" style={{ width: "100%" }} value={stock} onChange={(e) => setStock(e.target.value)} required />
              </div>

              <div style={{ display: "flex", gap: "10px", marginTop: "12px" }}>
                <button type="submit" className="tw-btn tw-btn-primary" style={{ flex: 1 }} disabled={submitting}>
                  {submitting ? "Memproses..." : "Simpan Barang ↗"}
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