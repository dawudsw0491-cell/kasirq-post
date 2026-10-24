"use client";

import { useState, useEffect } from "react";

export default function BarangPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isOnline, setIsOnline] = useState(true);

  const loadProducts = () => {
    const saved = localStorage.getItem("tw_products");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setProducts(parsed.filter((p: any) => p.isActive !== false && p.status !== "inactive"));
      } catch (e) {
        setProducts([]);
      }
    }
  };

  useEffect(() => {
    loadProducts();
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    const handleStorageChange = () => loadProducts();
    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  const filteredProducts = products.filter(
    (p) =>
      p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.skuCode?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="tw-main" style={{ animation: "fadeIn 0.3s ease-in-out", width: "100%", boxSizing: "border-box" }}>
      <header className="tw-topbar">
        <div className="tw-breadcrumb">
          <strong>Monitoring Inventaris &amp; Saldo Stok Global</strong>
        </div>
        <div className="tw-topbar-right">
          <span className="tw-live-badge" style={{ backgroundColor: isOnline ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)", color: isOnline ? "#10b981" : "#ef4444" }}>
            {isOnline ? "ONLINE" : "OFFLINE"}
          </span>
        </div>
      </header>

      <div className="tw-content" style={{ padding: "20px" }}>
        
        <div className="tw-card" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
            <div>
              <h3 className="tw-card-title" style={{ margin: 0 }}>Daftar Stok Produk Aktif ({filteredProducts.length})</h3>
              <span style={{ fontSize: "0.75rem", color: "var(--tw-muted)" }}>Stok bertambah otomatis dari menu Pembelian dan berkurang otomatis dari menu Kasir</span>
            </div>
            
            <div>
              <input
                type="text"
                placeholder="Cari barang / SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ padding: "6px 10px", borderRadius: "8px", border: "1px solid var(--tw-border)", background: "rgba(255,255,255,0.03)", color: "#fff", fontSize: "0.8rem", width: "220px" }}
              />
            </div>
          </div>

          <div style={{ overflowX: "auto", maxHeight: "550px", overflowY: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem", textAlign: "left" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--tw-border)", color: "var(--tw-muted)" }}>
                  <th style={{ padding: "12px" }}>SKU</th>
                  <th style={{ padding: "12px" }}>Nama Barang</th>
                  <th style={{ padding: "12px" }}>Kategori</th>
                  <th style={{ padding: "12px" }}>Harga Retail</th>
                  <th style={{ padding: "12px" }}>Harga Grosir</th>
                  <th style={{ padding: "12px" }}>Qty Stok Real-time</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: "40px", textAlign: "center", color: "var(--tw-muted)" }}>
                      Belum ada produk aktif yang tersedia. Silakan daftarkan di menu Kode Barang.
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((p, idx) => (
                    <tr key={idx} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                      <td style={{ padding: "12px", fontWeight: "bold", color: "#38bdf8" }}>{p.skuCode}</td>
                      <td style={{ padding: "12px", color: "#fff" }}>{p.name}</td>
                      <td style={{ padding: "12px", color: "var(--tw-muted)" }}>{p.category || "Umum"}</td>
                      <td style={{ padding: "12px", color: "#10b981" }}>Rp {(p.retailPrice || p.sellPrice || 0).toLocaleString("id-ID")}</td>
                      <td style={{ padding: "12px", color: "#f59e0b" }}>Rp {(p.wholesalePrice || 0).toLocaleString("id-ID")}</td>
                      <td style={{ padding: "12px", fontWeight: "bold" }}>
                        <span style={{ padding: "4px 10px", background: Number(p.stock) <= 5 ? "rgba(239, 68, 68, 0.2)" : "rgba(16, 185, 129, 0.15)", color: Number(p.stock) <= 5 ? "#ef4444" : "#10b981", borderRadius: "6px" }}>
                          {p.stock || 0} unit
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}