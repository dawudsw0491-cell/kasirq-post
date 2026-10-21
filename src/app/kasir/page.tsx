"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Product {
  id: number;
  sku: string;
  name: string;
  price: number;
  stock: number;
}

interface CartItem extends Product {
  qty: number;
}

export default function KasirPage() {
  const [storeName, setStoreName] = useState("TOKO WIWID");
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("TUNAI");
  const [paidAmount, setPaidAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [lastInvoice, setLastInvoice] = useState<any>(null);

  const fetchProducts = async () => {
    try {
      const res = await fetch("/api/products");
      const json = await res.json();
      if (json.success) setProducts(json.data || []);
    } catch (err) {
      console.error("Gagal mengambil data produk:", err);
    }
  };

  useEffect(() => {
    fetchProducts();
    const savedName = localStorage.getItem("tw_store_name");
    if (savedName) setStoreName(savedName);
  }, []);

  const addToCart = (product: Product) => {
    if (product.stock <= 0) return alert("Stok barang habis!");

    const existing = cart.find((item) => item.id === product.id);
    if (existing) {
      if (existing.qty >= product.stock) return alert("Jumlah melebihi stok yang tersedia!");
      setCart(
        cart.map((item) =>
          item.id === product.id ? { ...item, qty: item.qty + 1 } : item
        )
      );
    } else {
      setCart([...cart, { ...product, qty: 1 }]);
    }
  };

  const updateQty = (id: number, delta: number) => {
    setCart(
      cart
        .map((item) => {
          if (item.id === id) {
            const newQty = item.qty + delta;
            if (newQty > item.stock) {
              alert("Jumlah melebihi stok yang tersedia!");
              return item;
            }
            return { ...item, qty: newQty };
          }
          return item;
        })
        .filter((item) => item.qty > 0)
    );
  };

  const totalAmount = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const paidVal = parseFloat(paidAmount) || 0;
  const changeAmount = paidVal - totalAmount;

  const handleCheckout = async () => {
    if (cart.length === 0) return alert("Keranjang belanja masih kosong!");
    if (paymentMethod === "TUNAI" && paidVal < totalAmount) {
      return alert("Jumlah pembayaran tunai kurang!");
    }

    setSubmitting(true);

    const payload = {
      totalAmount,
      paidAmount: paymentMethod === "TUNAI" ? paidVal : totalAmount,
      changeAmount: paymentMethod === "TUNAI" ? changeAmount : 0,
      paymentMethod,
      items: cart.map((i) => ({
        productId: i.id,
        qty: i.qty,
        price: i.price,
      })),
    };

    try {
      const res = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setLastInvoice({
          ...json.data,
          items: cart,
          storeName,
        });
        setCart([]);
        setPaidAmount("");
        fetchProducts();
      } else {
        alert("Gagal memproses transaksi: " + json.error);
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setSubmitting(false);
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
          <Link href="/kasir" className="tw-nav-link tw-nav-active">
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
          <Link href="/keuangan" className="tw-nav-link">
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
            Workspace <span>/</span> <strong>Kasir Point of Sale (POS)</strong>
          </div>
          <div className="tw-topbar-right">
            <span className="tw-live-badge">
              <span className="tw-status-dot" />
              SISTEM AKTIF
            </span>
            <div className="tw-avatar">W</div>
          </div>
        </header>

        <div className="tw-content" style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "20px" }}>
          {/* SISI KIRI: KATALOG BARANG */}
          <div className="tw-card" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
              <input
                type="text"
                placeholder="Cari barang / scan barcode..."
                className="tw-input"
                style={{ flex: 1 }}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                autoFocus
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "12px", maxHeight: "calc(100vh - 240px)", overflowY: "auto" }}>
              {filteredProducts.map((p) => (
                <div
                  key={p.id}
                  onClick={() => addToCart(p)}
                  style={{
                    border: "1px solid var(--tw-border)",
                    borderRadius: "8px",
                    padding: "12px",
                    cursor: p.stock > 0 ? "pointer" : "not-allowed",
                    opacity: p.stock > 0 ? 1 : 0.5,
                    background: "#fff",
                    transition: "all 0.2s ease",
                  }}
                >
                  <small style={{ color: "var(--tw-muted)", fontSize: "0.75rem" }}>{p.sku}</small>
                  <h4 style={{ margin: "4px 0", fontSize: "0.95rem" }}>{p.name}</h4>
                  <div style={{ fontWeight: "bold", color: "var(--tw-primary)", fontSize: "0.9rem" }}>
                    Rp {p.price.toLocaleString("id-ID")}
                  </div>
                  <small style={{ color: p.stock <= 5 ? "#dc2626" : "inherit" }}>
                    Stok: {p.stock}
                  </small>
                </div>
              ))}
            </div>
          </div>

          {/* SISI KANAN: KERANJANG & PEMBAYARAN */}
          <div className="tw-card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div>
              <h3 className="tw-card-title" style={{ marginBottom: "16px" }}>Keranjang Penjualan</h3>

              {cart.length === 0 ? (
                <p style={{ textAlign: "center", color: "var(--tw-muted)", padding: "40px 0" }}>
                  Keranjang kosong. Pilih barang di sebelah kiri.
                </p>
              ) : (
                <div style={{ maxHeight: "280px", overflowY: "auto", marginBottom: "16px" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <tbody>
                      {cart.map((item) => (
                        <tr key={item.id} style={{ borderBottom: "1px solid var(--tw-border)" }}>
                          <td style={{ padding: "8px 0" }}>
                            <strong>{item.name}</strong>
                            <div style={{ fontSize: "0.8rem", color: "var(--tw-muted)" }}>
                              Rp {item.price.toLocaleString("id-ID")}
                            </div>
                          </td>
                          <td style={{ padding: "8px 0", textAlign: "right" }}>
                            <button
                              className="tw-btn"
                              style={{ padding: "2px 8px", marginRight: "4px" }}
                              onClick={() => updateQty(item.id, -1)}
                            >
                              -
                            </button>
                            <span style={{ margin: "0 6px", fontWeight: "bold" }}>{item.qty}</span>
                            <button
                              className="tw-btn"
                              style={{ padding: "2px 8px" }}
                              onClick={() => updateQty(item.id, 1)}
                            >
                              +
                            </button>
                          </td>
                          <td style={{ padding: "8px 0", textAlign: "right", fontWeight: "bold" }}>
                            Rp {(item.price * item.qty).toLocaleString("id-ID")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div style={{ paddingTop: "16px", borderTop: "2px solid var(--tw-border)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px", fontSize: "1.2rem", fontWeight: "bold" }}>
                <span>TOTAL:</span>
                <span style={{ color: "var(--tw-primary)" }}>Rp {totalAmount.toLocaleString("id-ID")}</span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", marginBottom: "4px" }}>Metode Bayar</label>
                  <select
                    className="tw-input"
                    style={{ width: "100%" }}
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  >
                    <option value="TUNAI">Tunai / Cash</option>
                    <option value="QRIS">QRIS / E-Wallet</option>
                    <option value="DEBIT">Kartu Debit / EDC</option>
                  </select>
                </div>

                {paymentMethod === "TUNAI" && (
                  <div>
                    <label style={{ display: "block", fontSize: "0.8rem", marginBottom: "4px" }}>Nominal Uang (Rp)</label>
                    <input
                      type="number"
                      className="tw-input"
                      style={{ width: "100%" }}
                      placeholder="0"
                      value={paidAmount}
                      onChange={(e) => setPaidAmount(e.target.value)}
                    />
                  </div>
                )}
              </div>

              {paymentMethod === "TUNAI" && paidVal > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px", fontSize: "0.95rem", fontWeight: "bold", color: changeAmount >= 0 ? "#16a34a" : "#dc2626" }}>
                  <span>Kembalian:</span>
                  <span>Rp {changeAmount >= 0 ? changeAmount.toLocaleString("id-ID") : 0}</span>
                </div>
              )}

              <button
                className="tw-btn tw-btn-primary"
                style={{ width: "100%", padding: "14px", fontSize: "1.05rem" }}
                onClick={handleCheckout}
                disabled={submitting || cart.length === 0}
              >
                {submitting ? "Memproses Transaksi..." : "Proses Bayar & Selesai ↗"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}