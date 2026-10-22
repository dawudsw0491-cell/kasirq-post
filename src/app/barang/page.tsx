"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

export default function BarangPage() {
  const [storeName, setStoreName] = useState("KASIRQ STORE");
  const [isOnline, setIsOnline] = useState(true);
  const [products, setProducts] = useState<any[]>([]);
  const [masterSkuList, setMasterSkuList] = useState<any[]>([]);

  const [showModal, setShowModal] = useState(false);
  const [selectedSkuId, setSelectedSkuId] = useState("");
  const [skuCode, setSkuCode] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [buyPrice, setBuyPrice] = useState<number | "">("");
  const [sellPrice, setSellPrice] = useState<number | "">("");
  const [addedStock, setAddedStock] = useState<number | "">("");
  const [message, setMessage] = useState("");

  // Fungsi Sinkronisasi Data Real-time dari Master SKU
  const syncData = useCallback(() => {
    const savedStore = localStorage.getItem("tw_store_name");
    if (savedStore) setStoreName(savedStore);

    const savedSku = localStorage.getItem("tw_master_sku");
    let activeSkuCodes: string[] = [];

    if (savedSku) {
      try {
        const parsed = JSON.parse(savedSku);
        // 1. Ambil HANYA Master SKU yang berstatus AKTIF
        const activeOnly = parsed.filter((s: any) => s.isActive !== false);
        setMasterSkuList(activeOnly);
        activeSkuCodes = activeOnly.map((s: any) => s.skuCode);
      } catch (e) {
        setMasterSkuList([]);
      }
    }

    // 2. Filter Tabel Inventaris Produk secara Real-Time (Sembunyikan produk jika SKU-nya Nonaktif)
    const savedProducts = localStorage.getItem("tw_products");
    if (savedProducts) {
      try {
        const parsedProducts = JSON.parse(savedProducts);
        const activeProducts = parsedProducts.filter((p: any) => activeSkuCodes.includes(p.skuCode));
        setProducts(activeProducts);
      } catch (e) {
        setProducts([]);
      }
    }
  }, []);

  useEffect(() => {
    syncData();

    // Event Listener Real-time
    const handleStorageChange = () => syncData();
    window.addEventListener("storage", handleStorageChange);

    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [syncData]);

  const handleSkuSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const skuId = e.target.value;
    setSelectedSkuId(skuId);

    const found = masterSkuList.find((s) => String(s.id) === skuId);
    if (found) {
      setSkuCode(found.skuCode);
      setName(found.name);
      setCategory(found.category);
      setBuyPrice(found.buyPrice);
      setSellPrice(found.sellPrice);
    } else {
      setSkuCode("");
      setName("");
      setCategory("");
      setBuyPrice("");
      setSellPrice("");
    }
  };

  const handleAddProductStock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSkuId || addedStock === "") {
      alert("Pilih barang dari registrasi Kode Barang dan masukkan stok tambahan!");
      return;
    }

    const stockNum = Number(addedStock) || 0;
    
    // Ambil produk utuh dari storage agar data tidak hilang
    const savedProducts = localStorage.getItem("tw_products");
    let allProducts = savedProducts ? JSON.parse(savedProducts) : [];

    const existingIndex = allProducts.findIndex((p: any) => p.skuCode === skuCode);

    if (existingIndex >= 0) {
      allProducts[existingIndex] = {
        ...allProducts[existingIndex],
        stock: allProducts[existingIndex].stock + stockNum,
        buyPrice: Number(buyPrice),
        sellPrice: Number(sellPrice),
      };
    } else {
      const newProduct = {
        id: Date.now(),
        skuCode,
        name,
        category,
        buyPrice: Number(buyPrice) || 0,
        sellPrice: Number(sellPrice) || 0,
        stock: stockNum,
      };
      allProducts = [newProduct, ...allProducts];
    }

    localStorage.setItem("tw_products", JSON.stringify(allProducts));
    syncData(); // Re-sync tampilan

    setSelectedSkuId("");
    setSkuCode("");
    setName("");
    setCategory("");
    setBuyPrice("");
    setSellPrice("");
    setAddedStock("");
    setShowModal(false);
    setMessage("Stok barang berhasil diperbarui!");
    setTimeout(() => setMessage(""), 3000);
  };

  const handleDelete = (id: number) => {
    if (confirm("Yakin ingin menghapus produk ini dari daftar inventaris?")) {
      const savedProducts = localStorage.getItem("tw_products");
      if (savedProducts) {
        const allProducts = JSON.parse(savedProducts);
        const updated = allProducts.filter((p: any) => p.id !== id);
        localStorage.setItem("tw_products", JSON.stringify(updated));
        syncData();
      }
      setMessage("Produk berhasil dihapus dari inventaris.");
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
          <Link href="/kasir" className="tw-nav-link"><span className="tw-nav-icon">▣</span>Kasir (POS)</Link>
        </nav>

        <div className="tw-nav-label">MANAJEMEN TOKO</div>
        <nav className="tw-nav">
          <Link href="/barang" className="tw-nav-link tw-nav-active"><span className="tw-nav-icon">▦</span>Barang</Link>
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
          <div className="tw-breadcrumb">
            Manajemen Toko <span>/</span> <strong>Master Inventaris Barang</strong>
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
                  boxShadow: isOnline ? "0 0 8px #10b981" : "0 0 8px #ef4444",
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

          <div className="tw-card" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <h3 className="tw-card-title">Manajemen Inventaris Stok</h3>
              <p style={{ fontSize: "0.85rem", color: "var(--tw-muted)", margin: 0 }}>
                Daftar otomatis ter-update secara <strong>real-time</strong> sesuai status keaktifan di Kode Barang.
              </p>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="tw-btn tw-btn-primary"
              style={{ padding: "10px 20px", display: "flex", alignItems: "center", gap: "8px" }}
            >
              <span>+</span> Tambah Stok Barang
            </button>
          </div>

          <div className="tw-card">
            <h4 style={{ fontSize: "1rem", color: "#ffffff", marginBottom: "16px" }}>Daftar Stok Produk Aktif</h4>
            {products.length === 0 ? (
              <div style={{ padding: "40px", textAlign: "center", color: "var(--tw-muted)", border: "1px dashed var(--tw-border)", borderRadius: "10px" }}>
                Tidak ada produk aktif. Pastikan Kode Barang terkait berstatus <strong>Aktif</strong> di menu Kode Barang (SKU).
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.9rem" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--tw-border)", color: "var(--tw-muted)" }}>
                      <th style={{ padding: "10px" }}>Kode SKU</th>
                      <th style={{ padding: "10px" }}>Nama Barang</th>
                      <th style={{ padding: "10px" }}>Kategori</th>
                      <th style={{ padding: "10px" }}>Harga Beli</th>
                      <th style={{ padding: "10px" }}>Harga Jual</th>
                      <th style={{ padding: "10px" }}>Total Stok</th>
                      <th style={{ padding: "10px", textAlign: "center" }}>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((p) => (
                      <tr key={p.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                        <td style={{ padding: "12px 10px", color: "#38bdf8", fontWeight: "bold" }}>{p.skuCode}</td>
                        <td style={{ padding: "12px 10px", color: "#ffffff", fontWeight: "500" }}>{p.name}</td>
                        <td style={{ padding: "12px 10px", color: "var(--tw-muted)" }}>{p.category}</td>
                        <td style={{ padding: "12px 10px" }}>Rp {p.buyPrice.toLocaleString("id-ID")}</td>
                        <td style={{ padding: "12px 10px", color: "#38bdf8", fontWeight: "600" }}>Rp {p.sellPrice.toLocaleString("id-ID")}</td>
                        <td style={{ padding: "12px 10px" }}>
                          <span style={{ padding: "4px 8px", background: p.stock > 5 ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.15)", color: p.stock > 5 ? "#10b981" : "#ef4444", borderRadius: "6px", fontSize: "0.8rem", fontWeight: "bold" }}>
                            {p.stock} unit
                          </span>
                        </td>
                        <td style={{ padding: "12px 10px", textAlign: "center" }}>
                          <button
                            onClick={() => handleDelete(p.id)}
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

      {showModal && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div className="tw-card" style={{ width: "100%", maxWidth: "450px", background: "#0f172a", border: "1px solid var(--tw-border)" }}>
            <h3 className="tw-card-title" style={{ marginBottom: "16px" }}>Tambah Stok Produk</h3>
            <form onSubmit={handleAddProductStock} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", color: "var(--tw-muted)", marginBottom: "4px" }}>Pilih Barang (Hanya SKU Aktif)</label>
                <select value={selectedSkuId} onChange={handleSkuSelect} style={{ width: "100%" }} required>
                  <option value="">-- Pilih Produk Terdaftar --</option>
                  {masterSkuList.map((s) => (
                    <option key={s.id} value={s.id}>
                      [{s.skuCode}] - {s.name} ({s.category})
                    </option>
                  ))}
                </select>
                {masterSkuList.length === 0 && (
                  <small style={{ color: "#ef4444", fontSize: "0.75rem", display: "block", marginTop: "4px" }}>
                    Tidak ada Kode Barang aktif. Aktifkan SKU terlebih dahulu di menu Kode Barang (SKU).
                  </small>
                )}
              </div>

              {selectedSkuId && (
                <>
                  <div style={{ padding: "10px", background: "rgba(2, 132, 199, 0.1)", borderRadius: "8px", border: "1px solid rgba(2, 132, 199, 0.2)", fontSize: "0.85rem" }}>
                    <div style={{ color: "#38bdf8", fontWeight: "bold" }}>Kode SKU: {skuCode}</div>
                    <div style={{ color: "#ffffff" }}>Kategori: {category}</div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "0.8rem", color: "var(--tw-muted)", marginBottom: "4px" }}>Harga Modal (Auto)</label>
                      <input type="number" value={buyPrice} readOnly style={{ width: "100%", background: "rgba(255,255,255,0.05)" }} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.8rem", color: "var(--tw-muted)", marginBottom: "4px" }}>Harga Jual (Auto)</label>
                      <input type="number" value={sellPrice} readOnly style={{ width: "100%", background: "rgba(255,255,255,0.05)" }} />
                    </div>
                  </div>
                </>
              )}

              <div>
                <label style={{ display: "block", fontSize: "0.8rem", color: "var(--tw-muted)", marginBottom: "4px" }}>Jumlah Stok yang Ditambahkan</label>
                <input type="number" value={addedStock} onChange={(e) => setAddedStock(e.target.value === "" ? "" : Number(e.target.value))} placeholder="0" style={{ width: "100%" }} required />
              </div>

              <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
                <button type="button" onClick={() => setShowModal(false)} className="tw-btn" style={{ flex: 1, backgroundColor: "rgba(255,255,255,0.1)", color: "#ffffff" }}>
                  Batal
                </button>
                <button type="submit" className="tw-btn tw-btn-primary" style={{ flex: 1 }} disabled={!selectedSkuId}>
                  Simpan Stok
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}