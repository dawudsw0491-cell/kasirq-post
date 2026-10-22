"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function KodeBarangPage() {
  const [storeName, setStoreName] = useState("KASIRQ STORE");
  const [isOnline, setIsOnline] = useState(true);
  const [skuList, setSkuList] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);

  // Form Modal Kode Barang / Master SKU
  const [showModal, setShowModal] = useState(false);
  const [categoryType, setCategoryType] = useState("Retail");
  const [customCategory, setCustomCategory] = useState("");
  const [skuName, setSkuName] = useState("");
  const [autoSkuCode, setAutoSkuCode] = useState("");
  const [selectedSupplier, setSelectedSupplier] = useState("");
  const [buyPrice, setBuyPrice] = useState<number | "">("");
  const [sellPrice, setSellPrice] = useState<number | "">("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const savedStore = localStorage.getItem("tw_store_name");
    if (savedStore) setStoreName(savedStore);

    const savedSku = localStorage.getItem("tw_master_sku");
    if (savedSku) {
      try {
        setSkuList(JSON.parse(savedSku));
      } catch (e) {
        setSkuList([]);
      }
    }

    const savedSuppliers = localStorage.getItem("tw_suppliers");
    if (savedSuppliers) {
      try {
        setSuppliers(JSON.parse(savedSuppliers));
      } catch (e) {
        setSuppliers([]);
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

  const generateNextSkuCode = () => {
    const nextNumber = skuList.length + 1;
    return `SKU-${String(nextNumber).padStart(4, "0")}`;
  };

  const handleOpenModal = () => {
    setAutoSkuCode(generateNextSkuCode());
    setShowModal(true);
  };

  const handleAddSku = (e: React.FormEvent) => {
    e.preventDefault();
    if (!skuName.trim() || buyPrice === "" || sellPrice === "") {
      alert("Mohon lengkapi Nama Barang/SKU, Harga Modal, dan Harga Jual!");
      return;
    }

    const finalCategory = categoryType === "Custom" ? customCategory || "Umum" : categoryType;

    const newSkuItem = {
      id: Date.now(),
      skuCode: autoSkuCode,
      name: skuName,
      category: finalCategory,
      supplier: selectedSupplier || "Umum",
      buyPrice: Number(buyPrice) || 0,
      sellPrice: Number(sellPrice) || 0,
      isActive: true,
    };

    const updatedSku = [newSkuItem, ...skuList];
    setSkuList(updatedSku);
    localStorage.setItem("tw_master_sku", JSON.stringify(updatedSku));

    // Memicu Custom Storage Event untuk Sinkronisasi Real-Time
    window.dispatchEvent(new Event("storage"));

    setCategoryType("Retail");
    setCustomCategory("");
    setSkuName("");
    setSelectedSupplier("");
    setBuyPrice("");
    setSellPrice("");
    setShowModal(false);
    setMessage(`Kode Barang ${autoSkuCode} berhasil diregistrasi!`);
    setTimeout(() => setMessage(""), 3000);
  };

  // Toggle Status Aktif / Nonaktif
  const handleToggleActive = (id: number) => {
    const updated = skuList.map((s) => {
      if (s.id === id) {
        return { ...s, isActive: s.isActive === false ? true : false };
      }
      return s;
    });

    setSkuList(updated);
    localStorage.setItem("tw_master_sku", JSON.stringify(updated));

    // Trigger Real-Time Sync
    window.dispatchEvent(new Event("storage"));

    setMessage("Status keaktifan Kode Barang berhasil diperbarui.");
    setTimeout(() => setMessage(""), 3000);
  };

  // Hapus Permanen
  const handleDeletePermanent = (id: number, code: string) => {
    if (confirm(`Yakin ingin HAPUS PERMANEN Kode Barang ${code}? Data tidak dapat dikembalikan.`)) {
      const updated = skuList.filter((s) => s.id !== id);
      setSkuList(updated);
      localStorage.setItem("tw_master_sku", JSON.stringify(updated));

      // Hapus juga dari produk jika ada
      const savedProducts = localStorage.getItem("tw_products");
      if (savedProducts) {
        try {
          const products = JSON.parse(savedProducts);
          const filtered = products.filter((p: any) => p.skuCode !== code);
          localStorage.setItem("tw_products", JSON.stringify(filtered));
        } catch (e) {}
      }

      // Trigger Real-Time Sync
      window.dispatchEvent(new Event("storage"));

      setMessage(`Kode Barang ${code} berhasil dihapus permanen.`);
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
          <Link href="/barang" className="tw-nav-link"><span className="tw-nav-icon">▦</span>Barang</Link>
          <Link href="/kategori" className="tw-nav-link tw-nav-active"><span className="tw-nav-icon">◇</span>Kode Barang (SKU)</Link>
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
            Manajemen Toko <span>/</span> <strong>Registrasi Master Kode Barang (SKU)</strong>
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
              <h3 className="tw-card-title">Registrasi Kode Barang &amp; Master SKU</h3>
              <p style={{ fontSize: "0.85rem", color: "var(--tw-muted)", margin: 0 }}>
                Gunakan tombol <strong>Nonaktifkan</strong> untuk menyembunyikan produk sementara, atau <strong>Hapus</strong> untuk menghapus permanen.
              </p>
            </div>
            <button
              onClick={handleOpenModal}
              className="tw-btn tw-btn-primary"
              style={{ padding: "10px 20px", display: "flex", alignItems: "center", gap: "8px" }}
            >
              <span>+</span> Registrasi Kode Barang Baru
            </button>
          </div>

          <div className="tw-card">
            <h4 style={{ fontSize: "1rem", color: "#ffffff", marginBottom: "16px" }}>Database Master SKU Terdaftar</h4>
            {skuList.length === 0 ? (
              <div style={{ padding: "40px", textAlign: "center", color: "var(--tw-muted)", border: "1px dashed var(--tw-border)", borderRadius: "10px" }}>
                Belum ada Kode Barang terdaftar.
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.9rem" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--tw-border)", color: "var(--tw-muted)" }}>
                      <th style={{ padding: "10px" }}>Kode SKU</th>
                      <th style={{ padding: "10px" }}>Nama Barang / SKU</th>
                      <th style={{ padding: "10px" }}>Kategori</th>
                      <th style={{ padding: "10px" }}>Status</th>
                      <th style={{ padding: "10px" }}>Harga Modal</th>
                      <th style={{ padding: "10px" }}>Harga Jual</th>
                      <th style={{ padding: "10px", textAlign: "center" }}>Aksi Kontrol</th>
                    </tr>
                  </thead>
                  <tbody>
                    {skuList.map((s) => {
                      const activeState = s.isActive !== false;
                      return (
                        <tr key={s.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", opacity: activeState ? 1 : 0.6 }}>
                          <td style={{ padding: "12px 10px", color: "#38bdf8", fontWeight: "bold" }}>{s.skuCode}</td>
                          <td style={{ padding: "12px 10px", color: "#ffffff", fontWeight: "500" }}>{s.name}</td>
                          <td style={{ padding: "12px 10px", color: "var(--tw-muted)" }}>{s.category}</td>
                          <td style={{ padding: "12px 10px" }}>
                            <span style={{ padding: "4px 8px", background: activeState ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.15)", color: activeState ? "#10b981" : "#ef4444", borderRadius: "6px", fontSize: "0.75rem", fontWeight: "bold" }}>
                              {activeState ? "AKTIF" : "NONAKTIF"}
                            </span>
                          </td>
                          <td style={{ padding: "12px 10px" }}>Rp {s.buyPrice.toLocaleString("id-ID")}</td>
                          <td style={{ padding: "12px 10px", color: "#10b981", fontWeight: "600" }}>Rp {s.sellPrice.toLocaleString("id-ID")}</td>
                          <td style={{ padding: "12px 10px", textAlign: "center", display: "flex", justifyContent: "center", gap: "8px" }}>
                            <button
                              onClick={() => handleToggleActive(s.id)}
                              style={{
                                background: activeState ? "rgba(234, 179, 8, 0.2)" : "rgba(16, 185, 129, 0.2)",
                                border: `1px solid ${activeState ? "#eab308" : "#10b981"}`,
                                color: activeState ? "#eab308" : "#10b981",
                                cursor: "pointer",
                                fontSize: "0.75rem",
                                padding: "4px 10px",
                                borderRadius: "6px",
                                fontWeight: "600",
                              }}
                            >
                              {activeState ? "Nonaktifkan" : "Aktifkan"}
                            </button>
                            <button
                              onClick={() => handleDeletePermanent(s.id, s.skuCode)}
                              style={{
                                background: "rgba(239, 68, 68, 0.2)",
                                border: "1px solid #ef4444",
                                color: "#ef4444",
                                cursor: "pointer",
                                fontSize: "0.75rem",
                                padding: "4px 10px",
                                borderRadius: "6px",
                                fontWeight: "600",
                              }}
                            >
                              Hapus
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {showModal && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div className="tw-card" style={{ width: "100%", maxWidth: "460px", background: "#0f172a", border: "1px solid var(--tw-border)" }}>
            <h3 className="tw-card-title" style={{ marginBottom: "16px" }}>Form Registrasi Kode Barang (SKU)</h3>
            <form onSubmit={handleAddSku} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", color: "var(--tw-muted)", marginBottom: "4px" }}>Kode SKU (Otomatis)</label>
                <input type="text" value={autoSkuCode} readOnly style={{ width: "100%", background: "rgba(255,255,255,0.05)", color: "#38bdf8", fontWeight: "bold" }} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", color: "var(--tw-muted)", marginBottom: "4px" }}>Nama Barang / SKU</label>
                <input type="text" value={skuName} onChange={(e) => setSkuName(e.target.value)} placeholder="Contoh: Aqua 600ml Botol" style={{ width: "100%" }} required />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", color: "var(--tw-muted)", marginBottom: "4px" }}>Jenis Kategori</label>
                  <select value={categoryType} onChange={(e) => setCategoryType(e.target.value)} style={{ width: "100%" }}>
                    <option value="Retail">Retail</option>
                    <option value="Grosir">Grosir</option>
                    <option value="Custom">-- Custom Kategori --</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", color: "var(--tw-muted)", marginBottom: "4px" }}>Supplier SKU</label>
                  <select value={selectedSupplier} onChange={(e) => setSelectedSupplier(e.target.value)} style={{ width: "100%" }}>
                    <option value="">-- Pilih Supplier --</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.name}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              {categoryType === "Custom" && (
                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", color: "var(--tw-muted)", marginBottom: "4px" }}>Kategori Custom</label>
                  <input type="text" value={customCategory} onChange={(e) => setCustomCategory(e.target.value)} placeholder="Nama kategori baru..." style={{ width: "100%" }} required />
                </div>
              )}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", color: "var(--tw-muted)", marginBottom: "4px" }}>Harga Modal (Rp)</label>
                  <input type="number" value={buyPrice} onChange={(e) => setBuyPrice(e.target.value === "" ? "" : Number(e.target.value))} placeholder="0" style={{ width: "100%" }} required />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", color: "var(--tw-muted)", marginBottom: "4px" }}>Harga Jual (Rp)</label>
                  <input type="number" value={sellPrice} onChange={(e) => setSellPrice(e.target.value === "" ? "" : Number(e.target.value))} placeholder="0" style={{ width: "100%" }} required />
                </div>
              </div>
              <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
                <button type="button" onClick={() => setShowModal(false)} className="tw-btn" style={{ flex: 1, backgroundColor: "rgba(255,255,255,0.1)", color: "#ffffff" }}>
                  Batal
                </button>
                <button type="submit" className="tw-btn tw-btn-primary" style={{ flex: 1 }}>
                  Registrasi Kode SKU
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}