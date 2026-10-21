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

interface PurchaseItem {
  productId: number;
  productName: string;
  qty: number;
  costPrice: number;
  subtotal: number;
}

export default function PembelianPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [storeName, setStoreName] = useState("TOKO WIWID");
  const [supplierName, setSupplierName] = useState("");
  const [invoiceNo, setInvoiceNo] = useState("");
  const [cart, setCart] = useState<PurchaseItem[]>([]);
  
  // Selection state
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [qtyInput, setQtyInput] = useState<string>("1");
  const [costInput, setCostInput] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const fetchProducts = async () => {
    try {
      const res = await fetch("/api/products");
      const json = await res.json();
      if (json.success) setProducts(json.data || []);
    } catch (err) {
      console.error("Gagal memuat produk:", err);
    }
  };

  useEffect(() => {
    fetchProducts();
    setInvoiceNo(`PO-${Date.now().toString().slice(-6)}`);
    const savedName = localStorage.getItem("tw_store_name");
    if (savedName) setStoreName(savedName);
  }, []);

  const handleProductChange = (idStr: string) => {
    setSelectedProductId(idStr);
    const prod = products.find((p) => p.id === parseInt(idStr));
    if (prod) {
      setCostInput(prod.costPrice ? prod.costPrice.toString() : prod.price.toString());
    }
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId) return alert("Pilih barang terlebih dahulu!");
    
    const prod = products.find((p) => p.id === parseInt(selectedProductId));
    if (!prod) return;

    const qty = parseInt(qtyInput) || 1;
    const costPrice = parseFloat(costInput) || 0;
    const subtotal = qty * costPrice;

    const newItem: PurchaseItem = {
      productId: prod.id,
      productName: prod.name,
      qty,
      costPrice,
      subtotal,
    };

    setCart([...cart, newItem]);
    setSelectedProductId("");
    setQtyInput("1");
    setCostInput("");
  };

  const handleRemoveItem = (index: number) => {
    const updated = [...cart];
    updated.splice(index, 1);
    setCart(updated);
  };

  const totalPembelian = cart.reduce((sum, item) => sum + item.subtotal, 0);

  const handleSubmitPurchase = async () => {
    if (cart.length === 0) return alert("Keranjang pembelian masih kosong!");
    setSubmitting(true);

    try {
      // Menambah stok barang di database per item
      for (const item of cart) {
        const prod = products.find((p) => p.id === item.productId);
        if (prod) {
          await fetch(`/api/products/${item.productId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              sku: prod.sku,
              name: prod.name,
              price: prod.price,
              costPrice: item.costPrice,
              stock: prod.stock + item.qty,
            }),
          });
        }
      }

      setSuccessMessage(`Berhasil mencatat stok masuk! (${cart.length} item diperbarui)`);
      setCart([]);
      setSupplierName("");
      setInvoiceNo(`PO-${Date.now().toString().slice(-6)}`);
      fetchProducts();
      setTimeout(() => setSuccessMessage(""), 4000);
    } catch (err: any) {
      alert("Gagal memproses pembelian: " + err.message);
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
          <Link href="/pembelian" className="tw-nav-link tw-nav-active">
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
            Transaksi &amp; Sistem <span>/</span> <strong>Restok &amp; Pembelian Barang</strong>
          </div>
          <div className="tw-topbar-right">
            <span className="tw-live-badge">
              <span className="tw-status-dot" />
              SISTEM AKTIF
            </span>
            <div className="tw-avatar">W</div>
          </div>
        </header>

        <div className="tw-content" style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: "20px" }}>
          {/* Form Input Item Restok */}
          <div className="tw-card">
            <h2 className="tw-card-title" style={{ marginBottom: "16px" }}>Input Barang Masuk</h2>

            {successMessage && (
              <div style={{ background: "#dcfce7", color: "#166534", padding: "10px 14px", borderRadius: "8px", marginBottom: "16px", fontWeight: "bold" }}>
                {successMessage}
              </div>
            )}

            <form onSubmit={handleAddItem} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "4px" }}>Pilih Barang</label>
                <select
                  className="tw-input"
                  style={{ width: "100%" }}
                  value={selectedProductId}
                  onChange={(e) => handleProductChange(e.target.value)}
                  required
                >
                  <option value="">-- Pilih Produk --</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Stok: {p.stock})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "4px" }}>Jumlah Restok (Qty)</label>
                  <input
                    type="number"
                    className="tw-input"
                    style={{ width: "100%" }}
                    value={qtyInput}
                    onChange={(e) => setQtyInput(e.target.value)}
                    min="1"
                    required
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "4px" }}>Harga Beli / HPP (Rp)</label>
                  <input
                    type="number"
                    className="tw-input"
                    style={{ width: "100%" }}
                    value={costInput}
                    onChange={(e) => setCostInput(e.target.value)}
                    required
                  />
                </div>
              </div>

              <button type="submit" className="tw-btn tw-btn-primary" style={{ marginTop: "8px", padding: "10px" }}>
                + Tambah ke Daftar Restok
              </button>
            </form>
          </div>

          {/* Daftar Ringkasan Pembelian */}
          <div className="tw-card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div>
              <div className="tw-card-header" style={{ marginBottom: "16px" }}>
                <h2 className="tw-card-title">Faktur Pembelian ({invoiceNo})</h2>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", color: "var(--tw-muted)", marginBottom: "4px" }}>No. Faktur / PO</label>
                  <input type="text" className="tw-input" style={{ width: "100%" }} value={invoiceNo} onChange={(e) => setInvoiceNo(e.target.value)} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", color: "var(--tw-muted)", marginBottom: "4px" }}>Nama Supplier</label>
                  <input type="text" className="tw-input" style={{ width: "100%" }} placeholder="Contoh: PT. Indomarco" value={supplierName} onChange={(e) => setSupplierName(e.target.value)} />
                </div>
              </div>

              {cart.length === 0 ? (
                <p style={{ textAlign: "center", color: "var(--tw-muted)", padding: "30px 0" }}>Belum ada item barang yang dimasukkan.</p>
              ) : (
                <table className="tw-table" style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: "2px solid var(--tw-border)", textAlign: "left" }}>
                      <th style={{ padding: "8px" }}>Barang</th>
                      <th style={{ padding: "8px", textAlign: "right" }}>Qty</th>
                      <th style={{ padding: "8px", textAlign: "right" }}>Harga Beli</th>
                      <th style={{ padding: "8px", textAlign: "right" }}>Subtotal</th>
                      <th style={{ padding: "8px", textAlign: "center" }}>#</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cart.map((item, idx) => (
                      <tr key={idx} style={{ borderBottom: "1px solid var(--tw-border)" }}>
                        <td style={{ padding: "8px", fontWeight: 600 }}>{item.productName}</td>
                        <td style={{ padding: "8px", textAlign: "right" }}>{item.qty}</td>
                        <td style={{ padding: "8px", textAlign: "right" }}>Rp {item.costPrice.toLocaleString("id-ID")}</td>
                        <td style={{ padding: "8px", textAlign: "right", fontWeight: "bold" }}>Rp {item.subtotal.toLocaleString("id-ID")}</td>
                        <td style={{ padding: "8px", textAlign: "center" }}>
                          <button style={{ border: "none", background: "none", color: "#dc2626", cursor: "pointer", fontWeight: "bold" }} onClick={() => handleRemoveItem(idx)}>
                            &times;
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div style={{ marginTop: "20px", paddingTop: "16px", borderTop: "2px solid var(--tw-border)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <span style={{ fontSize: "1rem", fontWeight: "bold" }}>Total Pembelian:</span>
                <span style={{ fontSize: "1.4rem", fontWeight: "bold", color: "var(--tw-primary)" }}>
                  Rp {totalPembelian.toLocaleString("id-ID")}
                </span>
              </div>

              <button
                type="button"
                className="tw-btn tw-btn-primary"
                style={{ width: "100%", padding: "12px", fontSize: "1rem" }}
                onClick={handleSubmitPurchase}
                disabled={submitting || cart.length === 0}
              >
                {submitting ? "Memproses Restok..." : "Simpan Restok & Tambah Stok Barang ↗"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}