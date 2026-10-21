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
  // 1. DEKLARASI STATE UTAMA (HARUS DI BAGIAN PALING ATAS KOMPONEN)
  const [storeName, setStoreName] = useState("TOKO WIWID");
  const [storeAddress, setStoreAddress] = useState("Jl. Utama Retail No. 1");
  const [storePhone, setStorePhone] = useState("0812-3456-7890");
  const [receiptFooter, setReceiptFooter] = useState("Terima Kasih Atas Kunjungan Anda!");
  const [paperSize, setPaperSize] = useState("58mm");
  const [taxRate, setTaxRate] = useState(0);
  const [enableTax, setEnableTax] = useState(false);

  // 2. STATE INTERAKSI KASIR & BARANG
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Tunai");
  const [payAmount, setPayAmount] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [completedSale, setCompletedSale] = useState<any>(null);
  const [showQrisModal, setShowQrisModal] = useState(false);

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

    // Memuat Pengaturan dari LocalStorage
    const savedName = localStorage.getItem("tw_store_name");
    const savedAddress = localStorage.getItem("tw_store_address");
    const savedPhone = localStorage.getItem("tw_store_phone");
    const savedFooter = localStorage.getItem("tw_receipt_footer");
    const savedPaper = localStorage.getItem("tw_paper_size");
    const savedEnableTax = localStorage.getItem("tw_enable_tax");
    const savedTaxRate = localStorage.getItem("tw_tax_rate");
    const savedTheme = localStorage.getItem("tw_theme_mode");

    if (savedName) setStoreName(savedName);
    if (savedAddress) setStoreAddress(savedAddress);
    if (savedPhone) setStorePhone(savedPhone);
    if (savedFooter) setReceiptFooter(savedFooter);
    if (savedPaper) setPaperSize(savedPaper);
    if (savedEnableTax === "true") setEnableTax(true);
    if (savedTaxRate) setTaxRate(parseFloat(savedTaxRate) || 0);

    if (savedTheme === "dark") {
      document.body.classList.add("dark-mode");
      document.documentElement.classList.add("dark");
    } else {
      document.body.classList.remove("dark-mode");
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const addToCart = (product: Product) => {
    if (product.stock <= 0) return alert("Stok barang habis!");
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        if (existing.qty + 1 > product.stock) {
          alert("Jumlah melebihi stok tersedia.");
          return prev;
        }
        return prev.map((item) => (item.id === product.id ? { ...item, qty: item.qty + 1 } : item));
      }
      return [...prev, { ...product, qty: 1 }];
    });
  };

  const updateQty = (id: number, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const newQty = item.qty + delta;
            if (newQty > item.stock) {
              alert("Jumlah melebihi stok tersedia.");
              return item;
            }
            return newQty > 0 ? { ...item, qty: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const subtotalAmount = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const taxAmount = enableTax ? (subtotalAmount * taxRate) / 100 : 0;
  const totalAmount = subtotalAmount + taxAmount;

  // Kalkulasi Nilai Bayar & Kembalian
  const effectivePayAmount = paymentMethod === "Tunai" ? (parseFloat(payAmount) || 0) : totalAmount;
  const changeAmount = effectivePayAmount - totalAmount;

  const handlePaymentMethodChange = (method: string) => {
    setPaymentMethod(method);
    if (method !== "Tunai") {
      setPayAmount(totalAmount.toString());
    } else {
      setPayAmount("");
    }
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return alert("Keranjang belanja masih kosong!");
    if (effectivePayAmount < totalAmount) return alert("Uang pembayaran kurang!");

    setSubmitting(true);
    try {
      const res = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart,
          totalAmount,
          payAmount: effectivePayAmount,
          changeAmount,
          paymentMethod,
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setCompletedSale(json.data);
        setCart([]);
        setPayAmount("");
        setShowQrisModal(false);
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
            Workspace <span>/</span> <strong>Kasir (POS)</strong>
          </div>
          <div className="tw-topbar-right">
            <span className="tw-live-badge">
              <span className="tw-status-dot" />
              KASIR ONLINE
            </span>
            <div className="tw-avatar">W</div>
          </div>
        </header>

        <div className="tw-content" style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: "20px" }}>
          {/* Katalog Produk */}
          <div className="tw-card">
            <div className="tw-card-header">
              <h2 className="tw-card-title">Katalog Barang</h2>
              <input
                type="text"
                placeholder="Cari nama barang / SKU..."
                className="tw-input"
                style={{ width: "220px" }}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "12px" }}>
              {loading ? (
                <p>Memuat produk...</p>
              ) : (
                filteredProducts.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => addToCart(p)}
                    style={{
                      border: "1px solid var(--tw-border)",
                      borderRadius: "8px",
                      padding: "12px",
                      cursor: "pointer",
                      background: "var(--tw-card-bg)",
                    }}
                  >
                    <div style={{ fontSize: "0.75rem", color: "var(--tw-muted)" }}>{p.sku}</div>
                    <strong style={{ display: "block", fontSize: "0.95rem", margin: "4px 0" }}>{p.name}</strong>
                    <div style={{ color: "var(--tw-primary)", fontWeight: "bold" }}>Rp {p.price.toLocaleString("id-ID")}</div>
                    <small style={{ color: p.stock > 0 ? "green" : "red" }}>Stok: {p.stock}</small>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Keranjang Transaksi Kasir */}
          <div className="tw-card" style={{ display: "flex", flexDirection: "column" }}>
            <h3 className="tw-card-title" style={{ marginBottom: "15px" }}>Keranjang Belanja</h3>

            <div style={{ minHeight: "180px", maxHeight: "260px", overflowY: "auto", borderBottom: "1px solid var(--tw-border)", marginBottom: "15px" }}>
              {cart.length === 0 ? (
                <p style={{ textAlign: "center", color: "var(--tw-muted)", marginTop: "40px" }}>Keranjang belanja kosong</p>
              ) : (
                cart.map((item) => (
                  <div key={item.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                    <div>
                      <strong>{item.name}</strong>
                      <div style={{ fontSize: "0.8rem", color: "var(--tw-muted)" }}>
                        Rp {item.price.toLocaleString("id-ID")} x {item.qty}
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <button className="tw-btn" style={{ padding: "2px 8px" }} onClick={() => updateQty(item.id, -1)}>-</button>
                      <span>{item.qty}</span>
                      <button className="tw-btn" style={{ padding: "2px 8px" }} onClick={() => updateQty(item.id, 1)}>+</button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {enableTax && (
              <div style={{ fontSize: "0.85rem", display: "flex", justifyContent: "space-between", marginBottom: "6px", color: "var(--tw-muted)" }}>
                <span>Pajak ({taxRate}%):</span>
                <span>Rp {taxAmount.toLocaleString("id-ID")}</span>
              </div>
            )}

            <div style={{ fontSize: "1.1rem", fontWeight: "bold", display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
              <span>Total:</span>
              <span style={{ color: "var(--tw-primary)" }}>Rp {totalAmount.toLocaleString("id-ID")}</span>
            </div>

            {/* Pilihan Metode Pembayaran */}
            <div style={{ marginBottom: "12px" }}>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "4px" }}>Metode Pembayaran</label>
              <select
                className="tw-input"
                style={{ width: "100%" }}
                value={paymentMethod}
                onChange={(e) => handlePaymentMethodChange(e.target.value)}
              >
                <option value="Tunai">💵 Tunai (Cash)</option>
                <option value="QRIS">📱 QRIS / Barcode Scan</option>
                <option value="Debit">💳 Kartu Debit / EDC</option>
              </select>
            </div>

            {/* Nominal Bayar */}
            <div style={{ marginBottom: "12px" }}>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "4px" }}>Nominal Bayar (Rp)</label>
              <input
                type="number"
                placeholder="0"
                className="tw-input"
                style={{ width: "100%" }}
                disabled={paymentMethod !== "Tunai"}
                value={paymentMethod === "Tunai" ? payAmount : totalAmount}
                onChange={(e) => setPayAmount(e.target.value)}
              />
            </div>

            {paymentMethod === "Tunai" && parseFloat(payAmount) > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "15px", fontWeight: "bold", color: changeAmount >= 0 ? "green" : "red" }}>
                <span>Kembalian:</span>
                <span>Rp {changeAmount.toLocaleString("id-ID")}</span>
              </div>
            )}

            {paymentMethod === "QRIS" && cart.length > 0 && (
              <button
                className="tw-btn"
                style={{ width: "100%", padding: "10px", marginBottom: "10px", background: "#0284c7", color: "#fff" }}
                onClick={() => setShowQrisModal(true)}
              >
                🔍 Tampilkan QRIS Barcode
              </button>
            )}

            <button
              className="tw-btn tw-btn-primary"
              style={{ width: "100%", padding: "12px" }}
              disabled={submitting || cart.length === 0}
              onClick={handleCheckout}
            >
              {submitting ? "Memproses..." : "Selesaikan Transaksi ↗"}
            </button>
          </div>
        </div>
      </div>

      {/* MODAL BARCODE QRIS (STANDAR ASPI UNIVERSAL) */}
      {showQrisModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }}>
          <div className="tw-card" style={{ background: "#fff", color: "#000", padding: "24px", maxWidth: "340px", width: "100%", textAlign: "center" }}>
            <h3 style={{ marginBottom: "8px" }}>QRIS Pembayaran</h3>
            <p style={{ fontSize: "0.85rem", color: "#64748b", marginBottom: "16px" }}>{storeName}</p>
            
            <div style={{ background: "#f8fafc", padding: "16px", borderRadius: "12px", border: "2px dashed #cbd5e1", marginBottom: "16px" }}>
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=00020101021126640016ID.CO.QRIS.WWW01189360091430000000000303UMI51440014ID.A20260000000020202000303UMI5204541153033605802ID5910${encodeURIComponent(storeName.substring(0, 10))}%206005SOLO6304`}
                alt="QRIS Barcode Universal"
                style={{ width: "180px", height: "180px", margin: "0 auto", display: "block" }}
              />
            </div>

            <div style={{ fontSize: "1.2rem", fontWeight: "bold", color: "#4f46e5", marginBottom: "16px" }}>
              Total: Rp {totalAmount.toLocaleString("id-ID")}
            </div>

            <div style={{ display: "flex", gap: "10px" }}>
              <button className="tw-btn tw-btn-primary" style={{ flex: 1 }} onClick={handleCheckout} disabled={submitting}>
                {submitting ? "Memproses..." : "Konfirmasi Lunas ↗"}
              </button>
              <button className="tw-btn tw-btn-secondary" onClick={() => setShowQrisModal(false)}>
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL STRUK THERMAL PASCA TRANSAKSI */}
      {completedSale && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }}>
          <div className="tw-card" style={{ background: "#fff", color: "#000", padding: "20px", maxWidth: paperSize === "80mm" ? "380px" : "320px", width: "100%" }}>
            <div id="thermal-receipt" className="receipt-container" style={{ width: paperSize === "80mm" ? "340px" : "280px" }}>
              <div className="receipt-header">
                <h2>{storeName}</h2>
                <p>{storeAddress}</p>
                <p>Telp/WA: {storePhone}</p>
              </div>

              <p style={{ margin: "4px 0" }}>No: {completedSale.invoiceNo}</p>
              <p style={{ margin: "4px 0" }}>Tgl: {new Date(completedSale.createdAt).toLocaleString("id-ID")}</p>
              <p style={{ margin: "4px 0", fontWeight: "bold" }}>Metode: {completedSale.paymentMethod || paymentMethod}</p>
              <div className="receipt-divider" />

              <table className="receipt-table">
                <tbody>
                  {completedSale.items.map((item: any) => (
                    <tr key={item.id}>
                      <td colSpan={2}>
                        {item.product.name}<br />
                        <small>{item.qty} x Rp {item.price.toLocaleString("id-ID")}</small>
                      </td>
                      <td className="num">Rp {item.subtotal.toLocaleString("id-ID")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="receipt-divider" />

              <div className="receipt-row">
                <span>TOTAL:</span>
                <strong>Rp {completedSale.totalAmount.toLocaleString("id-ID")}</strong>
              </div>
              <div className="receipt-row">
                <span>BAYAR ({completedSale.paymentMethod || paymentMethod}):</span>
                <span>Rp {completedSale.payAmount.toLocaleString("id-ID")}</span>
              </div>
              {completedSale.changeAmount > 0 && (
                <div className="receipt-row">
                  <span>KEMBALI:</span>
                  <span>Rp {completedSale.changeAmount.toLocaleString("id-ID")}</span>
                </div>
              )}

              <div className="receipt-footer">
                <p>{receiptFooter}</p>
              </div>
            </div>

            <div style={{ display: "flex", gap: "10px", marginTop: "15px" }}>
              <button className="tw-btn tw-btn-primary" style={{ flex: 1 }} onClick={() => window.print()}>
                🖨️ Cetak Struk ({paperSize})
              </button>
              <button className="tw-btn tw-btn-secondary" onClick={() => setCompletedSale(null)}>
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}