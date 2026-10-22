"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function KasirPage() {
  const [storeName, setStoreName] = useState("KASIRQ STORE");
  const [isOnline, setIsOnline] = useState(true);
  const [products, setProducts] = useState<any[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [paymentAmount, setPaymentAmount] = useState<number | "">("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const savedStore = localStorage.getItem("tw_store_name");
    if (savedStore) setStoreName(savedStore);

    const savedProducts = localStorage.getItem("tw_products");
    if (savedProducts) {
      try {
        setProducts(JSON.parse(savedProducts));
      } catch (e) {
        setProducts([]);
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

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const addToCart = (product: any) => {
    if (product.stock <= 0) {
      alert("Stok produk ini habis!");
      return;
    }

    const exist = cart.find((item) => item.id === product.id);
    if (exist) {
      if (exist.qty >= product.stock) {
        alert("Jumlah melebihi stok yang tersedia!");
        return;
      }
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
            return newQty > 0 ? { ...item, qty: newQty } : null;
          }
          return item;
        })
        .filter(Boolean)
    );
  };

  const total = cart.reduce((acc, item) => acc + item.sellPrice * item.qty, 0);
  const change = Number(paymentAmount) >= total ? Number(paymentAmount) - total : 0;

  // Selesaikan Transaksi & Sinkronisasi Ke Laporan, Dashboard, & Keuangan
  const handleCheckout = () => {
    if (cart.length === 0) {
      alert("Keranjang belanja masih kosong!");
      return;
    }
    if (paymentAmount === "" || Number(paymentAmount) < total) {
      alert("Uang pembayaran kurang dari total belanja!");
      return;
    }

    // 1. Update Stok di master barang (tw_products)
    const updatedProducts = products.map((p) => {
      const cartItem = cart.find((c) => c.id === p.id);
      if (cartItem) {
        return { ...p, stock: Math.max(0, p.stock - cartItem.qty) };
      }
      return p;
    });

    setProducts(updatedProducts);
    localStorage.setItem("tw_products", JSON.stringify(updatedProducts));

    const transactionRecord = {
      id: Date.now(),
      date: new Date().toLocaleDateString("id-ID"),
      timestamp: new Date().toISOString(),
      items: cart,
      total,
      pay: Number(paymentAmount),
      change,
    };

    // 2. Simpan ke tw_sales_history (untuk Dashboard & Laporan Penjualan)
    const savedSales = localStorage.getItem("tw_sales_history");
    const salesData = savedSales ? JSON.parse(savedSales) : [];
    salesData.unshift(transactionRecord);
    localStorage.setItem("tw_sales_history", JSON.stringify(salesData));

    // 3. Simpan juga ke tw_sales_reports (jika modul laporan menggunakan key terpisah)
    const savedReports = localStorage.getItem("tw_sales_reports");
    const reportsData = savedReports ? JSON.parse(savedReports) : [];
    reportsData.unshift(transactionRecord);
    localStorage.setItem("tw_sales_reports", JSON.stringify(reportsData));

    // 4. Catat otomatis pemasukan kas ke modul keuangan (tw_financial_records)
    const savedFin = localStorage.getItem("tw_financial_records");
    let finData = savedFin ? JSON.parse(savedFin) : [];
    finData.unshift({
      id: Date.now(),
      date: new Date().toLocaleDateString("id-ID"),
      description: `Penjualan Kasir (${cart.length} item)`,
      type: "IN",
      amount: total,
    });
    localStorage.setItem("tw_financial_records", JSON.stringify(finData));

    // Trigger update lintas halaman secara real-time
    window.dispatchEvent(new Event("storage"));

    // Reset Form
    setCart([]);
    setPaymentAmount("");
    setMessage("Transaksi Berhasil & Laporan Penjualan Terupdate!");
    setTimeout(() => setMessage(""), 4000);
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
          <Link href="/kasir" className="tw-nav-link tw-nav-active"><span className="tw-nav-icon">▣</span>Kasir (POS)</Link>
        </nav>

        <div className="tw-nav-label">MANAJEMEN TOKO</div>
        <nav className="tw-nav">
          <Link href="/barang" className="tw-nav-link"><span className="tw-nav-icon">▦</span>Barang</Link>
          <Link href="/kategori" className="tw-nav-link"><span className="tw-nav-icon">◇</span>Kode Barang (SKU)</Link>
          <Link href="/pelanggan" className="tw-nav-link"><span className="tw-nav-icon">♧</span>Pelanggan</Link>
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
          <div className="tw-breadcrumb">Workspace <span>/</span> <strong>Kasir (POS) Transaksi</strong></div>
          <div className="tw-topbar-right">
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

        <div className="tw-content" style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "20px" }}>
          
          <div className="tw-card" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 className="tw-card-title">Pilih Produk</h3>
              <input
                type="text"
                placeholder="Cari produk..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ width: "220px", padding: "8px 12px", fontSize: "0.85rem" }}
              />
            </div>

            {filteredProducts.length === 0 ? (
              <div style={{ padding: "40px", textAlign: "center", color: "var(--tw-muted)", border: "1px dashed var(--tw-border)", borderRadius: "10px" }}>
                Tidak ada produk ditemukan. Pastikan stok barang aktif sudah ditambahkan di menu <strong>Barang</strong>.
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
                {filteredProducts.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => addToCart(p)}
                    style={{
                      padding: "14px",
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid var(--tw-border)",
                      borderRadius: "10px",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#0284c7")}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--tw-border)")}
                  >
                    <strong style={{ display: "block", color: "#ffffff", fontSize: "0.9rem", marginBottom: "4px" }}>{p.name}</strong>
                    <span style={{ fontSize: "0.8rem", color: "var(--tw-muted)", display: "block" }}>SKU: {p.skuCode}</span>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "10px" }}>
                      <span style={{ color: "#38bdf8", fontWeight: "600", fontSize: "0.9rem" }}>Rp {p.sellPrice.toLocaleString("id-ID")}</span>
                      <small style={{ color: p.stock > 0 ? "#10b981" : "#ef4444" }}>Stok: {p.stock}</small>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="tw-card" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <h3 className="tw-card-title">Keranjang Belanja</h3>

            {message && (
              <div style={{ padding: "10px", background: "rgba(16, 185, 129, 0.15)", color: "#10b981", borderRadius: "8px", fontSize: "0.85rem" }}>
                ✓ {message}
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "250px", overflowY: "auto" }}>
              {cart.length === 0 ? (
                <span style={{ color: "var(--tw-muted)", fontSize: "0.85rem", textAlign: "center", padding: "20px 0" }}>Keranjang kosong</span>
              ) : (
                cart.map((item) => (
                  <div key={item.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px", background: "rgba(255,255,255,0.02)", borderRadius: "6px" }}>
                    <div>
                      <strong style={{ fontSize: "0.85rem", color: "#ffffff", display: "block" }}>{item.name}</strong>
                      <small style={{ color: "var(--tw-muted)" }}>Rp {item.sellPrice.toLocaleString("id-ID")}</small>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <button onClick={() => updateQty(item.id, -1)} style={{ padding: "2px 8px", borderRadius: "4px" }}>-</button>
                      <span style={{ fontSize: "0.85rem" }}>{item.qty}</span>
                      <button onClick={() => updateQty(item.id, 1)} style={{ padding: "2px 8px", borderRadius: "4px" }}>+</button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <hr style={{ borderColor: "var(--tw-border)" }} />

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                <span>Total Belanja:</span>
                <strong style={{ fontSize: "1.2rem", color: "#38bdf8" }}>Rp {total.toLocaleString("id-ID")}</strong>
              </div>

              <div style={{ marginBottom: "8px" }}>
                <label style={{ display: "block", fontSize: "0.8rem", color: "var(--tw-muted)", marginBottom: "4px" }}>Uang Pembayaran (Rp)</label>
                <input
                  type="number"
                  placeholder="0"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value === "" ? "" : Number(e.target.value))}
                  style={{ width: "100%" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "16px" }}>
                <span>Kembalian:</span>
                <strong style={{ color: "#10b981" }}>Rp {change.toLocaleString("id-ID")}</strong>
              </div>

              <button
                onClick={handleCheckout}
                className="tw-btn tw-btn-primary"
                style={{ width: "100%", padding: "12px", fontWeight: "bold" }}
              >
                Bayar &amp; Simpan Laporan
              </button>
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}