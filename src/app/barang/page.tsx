"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function BarangPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [isOnline, setIsOnline] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editData, setEditData] = useState<any>(null);

  // Form State
  const [skuCode, setSkuCode] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Umum");
  const [buyPrice, setBuyPrice] = useState<number | "">("");
  const [retailPrice, setRetailPrice] = useState<number | "">("");
  const [wholesalePrice, setWholesalePrice] = useState<number | "">("");
  const [stock, setStock] = useState<number | "">("");
  const [unit, setUnit] = useState("kg");

  const loadProducts = async () => {
    try {
      const { data, error } = await supabase
        .from("tw_products")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && data) {
        setProducts(data);
        localStorage.setItem("tw_products", JSON.stringify(data));
      } else {
        fallbackLoadLocal();
      }
    } catch (e) {
      fallbackLoadLocal();
    }
  };

  const fallbackLoadLocal = () => {
    const saved = localStorage.getItem("tw_products");
    if (saved) {
      try {
        setProducts(JSON.parse(saved));
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

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const handleOpenAdd = () => {
    setEditData(null);
    setSkuCode("TW-" + Math.floor(100000 + Math.random() * 900000));
    setName("");
    setCategory("Umum");
    setBuyPrice("");
    setRetailPrice("");
    setWholesalePrice("");
    setStock("");
    setUnit("kg");
    setModalOpen(true);
  };

  const handleOpenEdit = (prod: any) => {
    setEditData(prod);
    setSkuCode(prod.skuCode || "");
    setName(prod.name || "");
    setCategory(prod.category || "Umum");
    setBuyPrice(prod.buyPrice || "");
    setRetailPrice(prod.retailPrice || prod.sellPrice || "");
    setWholesalePrice(prod.wholesalePrice || "");
    setStock(prod.stock || "");
    setUnit(prod.unit || "kg");
    setModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert("Nama barang wajib diisi!");
      return;
    }

    const payload = {
      skuCode: skuCode || "TW-" + Date.now(),
      name: name.trim(),
      category: category.trim(),
      buyPrice: Number(buyPrice) || 0,
      retailPrice: Number(retailPrice) || 0,
      wholesalePrice: Number(wholesalePrice) || 0,
      stock: Number(stock) || 0,
      unit: unit.trim() || "kg",
      status: "active",
      updated_at: new Date().toISOString()
    };

    if (editData) {
      // Update
      const { error } = await supabase
        .from("tw_products")
        .update(payload)
        .eq("skuCode", editData.skuCode);

      if (error) {
        alert("Gagal memperbarui produk: " + error.message);
        return;
      }
    } else {
      // Insert
      const { error } = await supabase.from("tw_products").insert([{ ...payload, created_at: new Date().toISOString() }]);
      if (error) {
        alert("Gagal menambah produk: " + error.message);
        return;
      }
    }

    setModalOpen(false);
    loadProducts();
  };

  const handleDelete = async (sku: string) => {
    if (!confirm("Yakin ingin menghapus produk ini?")) return;

    const { error } = await supabase.from("tw_products").delete().eq("skuCode", sku);
    if (error) {
      alert("Gagal menghapus: " + error.message);
      return;
    }
    loadProducts();
  };

  const filteredProducts = products.filter((p) =>
    (p.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.skuCode || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="tw-main" style={{ animation: "fadeIn 0.3s ease-in-out", width: "100%", boxSizing: "border-box" }}>
      
      {/* TOPBAR DENGAN CARD HEADER SOLID ELEGAN */}
      <header className="tw-topbar" style={{ background: "transparent", borderBottom: "none", padding: "16px 24px 0 24px" }}>
        <div className="tw-header-card" style={{ width: "100%", backgroundColor: "#FFFFFF", border: "1px solid #CBD5E1", borderRadius: "10px", padding: "12px 20px", boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div className="tw-breadcrumb">
            <strong style={{ color: "#0F172A", fontSize: "0.95rem", fontWeight: "700" }}>MANAJEMEN BARANG &amp; KATALOG</strong>
          </div>
          <div className="tw-topbar-right" style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <button
              type="button"
              onClick={handleOpenAdd}
              style={{ background: "#059669", color: "#fff", border: "none", padding: "6px 12px", borderRadius: "6px", fontSize: "0.8rem", fontWeight: "600", cursor: "pointer" }}
            >
              + Tambah Barang
            </button>
            <span
              className="tw-live-badge"
              style={{
                backgroundColor: isOnline ? "#D1FAE5" : "#FEE2E2",
                color: isOnline ? "#065F46" : "#991B1B",
                borderColor: isOnline ? "#A7F3D0" : "#FCA5A5",
                fontSize: "0.75rem",
                fontWeight: "600"
              }}
            >
              <span
                className="tw-status-dot"
                style={{
                  backgroundColor: isOnline ? "#059669" : "#DC2626",
                  boxShadow: isOnline ? "0 0 8px #059669" : "0 0 8px #DC2626",
                }}
              />
              {isOnline ? "ONLINE" : "OFFLINE"}
            </span>
          </div>
        </div>
      </header>

      <div className="tw-content" style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "20px" }}>
        
        {/* KARTU UTAMA DAFTAR BARANG */}
        <div className="tw-card" style={{ backgroundColor: "#FFFFFF", border: "1px solid #CBD5E1", borderRadius: "12px", padding: "18px", display: "flex", flexDirection: "column", gap: "16px", boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)" }}>
          
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
            <span style={{ fontSize: "1rem", color: "#0F172A", fontWeight: "600" }}>Daftar Inventaris Produk [{filteredProducts.length}]</span>
            <input
              type="text"
              placeholder="Cari nama barang atau SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ padding: "8px 12px", width: "260px", background: "#FFFFFF", border: "1px solid #CBD5E1", borderRadius: "8px", fontSize: "0.85rem", color: "#0F172A", fontWeight: "500" }}
            />
          </div>

          <div style={{ overflowX: "auto", maxHeight: "500px", overflowY: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem", textAlign: "left" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #E2E8F0", color: "#334155" }}>
                  <th style={{ padding: "10px", fontWeight: "600" }}>SKU / Kategori</th>
                  <th style={{ padding: "10px", fontWeight: "600" }}>Nama Barang</th>
                  <th style={{ padding: "10px", fontWeight: "600" }}>Stok</th>
                  <th style={{ padding: "10px", fontWeight: "600" }}>Harga Modal</th>
                  <th style={{ padding: "10px", fontWeight: "600" }}>Harga Retail (R)</th>
                  <th style={{ padding: "10px", fontWeight: "600" }}>Harga Grosir (G)</th>
                  <th style={{ padding: "10px", textAlign: "center", fontWeight: "600" }}>Tambahan</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: "30px", textAlign: "center", color: "#64748B", fontSize: "0.85rem", fontWeight: "500" }}>
                      Belum ada data barang atau produk ditemukan.
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((p, idx) => (
                    <tr key={idx} style={{ borderBottom: "1px solid #F1F5F9", transition: "background 0.2s" }}>
                      <td style={{ padding: "10px" }}>
                        <span style={{ color: "#0284C7", display: "block", fontSize: "0.8rem", fontWeight: "600" }}>{p.skuCode}</span>
                        <span style={{ color: "#64748B", fontSize: "0.75rem", fontWeight: "500" }}>{p.category || "Umum"}</span>
                      </td>
                      <td style={{ padding: "10px", color: "#0F172A", fontWeight: "600" }}>{p.name}</td>
                      <td style={{ padding: "10px", color: "#0F172A", fontWeight: "500" }}>{p.stock} {p.unit || "kg"}</td>
                      <td style={{ padding: "10px", color: "#475569", fontWeight: "500" }}>Rp {Number(p.buyPrice || 0).toLocaleString("id-ID")}</td>
                      <td style={{ padding: "10px", color: "#059669", fontWeight: "600" }}>Rp {Number(p.retailPrice || p.sellPrice || 0).toLocaleString("id-ID")}</td>
                      <td style={{ padding: "10px", color: "#D97706", fontWeight: "600" }}>Rp {Number(p.wholesalePrice || 0).toLocaleString("id-ID")}</td>
                      <td style={{ padding: "10px", textAlign: "center", display: "flex", justifyContent: "center", gap: "6px" }}>
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(p)}
                          style={{ padding: "4px 10px", background: "#0284C7", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "0.75rem", fontWeight: "600" }}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(p.skuCode)}
                          style={{ padding: "4px 10px", background: "#DC2626", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "0.75rem", fontWeight: "600" }}
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

      </div>

      {/* MODAL TAMBAH / EDIT BARANG */}
      {modalOpen && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", backgroundColor: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000, padding: "16px" }}>
          <div style={{ backgroundColor: "#FFFFFF", border: "1px solid #CBD5E1", borderRadius: "12px", width: "100%", maxWidth: "450px", padding: "24px", boxShadow: "0 10px 30px rgba(0,0,0,0.2)" }}>
            <span style={{ color: "#0F172A", display: "block", marginBottom: "14px", fontSize: "1.1rem", fontWeight: "600" }}>
              {editData ? "Edit Data Barang" : "Tambah Barang Baru"}
            </span>

            <form onSubmit={handleSaveProduct} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", color: "#334155", marginBottom: "4px", fontWeight: "600" }}>Kode SKU</label>
                <input
                  type="text"
                  value={skuCode}
                  onChange={(e) => setSkuCode(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px", background: "#F8FAFC", border: "1px solid #CBD5E1", borderRadius: "6px", color: "#0F172A", fontSize: "0.85rem", fontWeight: "500" }}
                  required
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.8rem", color: "#334155", marginBottom: "4px", fontWeight: "600" }}>Nama Barang</label>
                <input
                  type="text"
                  placeholder="Masukkan nama barang..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px", background: "#FFFFFF", border: "1px solid #CBD5E1", borderRadius: "6px", color: "#0F172A", fontSize: "0.85rem", fontWeight: "500" }}
                  required
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", color: "#334155", marginBottom: "4px", fontWeight: "600" }}>Kategori</label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    style={{ width: "100%", padding: "8px 12px", background: "#FFFFFF", border: "1px solid #CBD5E1", borderRadius: "6px", color: "#0F172A", fontSize: "0.85rem", fontWeight: "500" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", color: "#334155", marginBottom: "4px", fontWeight: "600" }}>Satuan (Unit)</label>
                  <input
                    type="text"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    style={{ width: "100%", padding: "8px 12px", background: "#FFFFFF", border: "1px solid #CBD5E1", borderRadius: "6px", color: "#0F172A", fontSize: "0.85rem", fontWeight: "500" }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", color: "#334155", marginBottom: "4px", fontWeight: "600" }}>Stok Awal</label>
                  <input
                    type="number"
                    step="any"
                    value={stock}
                    onChange={(e) => setStock(e.target.value === "" ? "" : Number(e.target.value))}
                    style={{ width: "100%", padding: "8px 12px", background: "#FFFFFF", border: "1px solid #CBD5E1", borderRadius: "6px", color: "#0F172A", fontSize: "0.85rem", fontWeight: "500" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", color: "#334155", marginBottom: "4px", fontWeight: "600" }}>Harga Modal</label>
                  <input
                    type="number"
                    value={buyPrice}
                    onChange={(e) => setBuyPrice(e.target.value === "" ? "" : Number(e.target.value))}
                    style={{ width: "100%", padding: "8px 12px", background: "#FFFFFF", border: "1px solid #CBD5E1", borderRadius: "6px", color: "#0F172A", fontSize: "0.85rem", fontWeight: "500" }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", color: "#059669", marginBottom: "4px", fontWeight: "600" }}>Harga Retail (R)</label>
                  <input
                    type="number"
                    value={retailPrice}
                    onChange={(e) => setRetailPrice(e.target.value === "" ? "" : Number(e.target.value))}
                    style={{ width: "100%", padding: "8px 12px", background: "#FFFFFF", border: "1px solid #059669", borderRadius: "6px", color: "#0F172A", fontSize: "0.85rem", fontWeight: "500" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", color: "#D97706", marginBottom: "4px", fontWeight: "600" }}>Harga Grosir (G)</label>
                  <input
                    type="number"
                    value={wholesalePrice}
                    onChange={(e) => setWholesalePrice(e.target.value === "" ? "" : Number(e.target.value))}
                    style={{ width: "100%", padding: "8px 12px", background: "#FFFFFF", border: "1px solid #D97706", borderRadius: "6px", color: "#0F172A", fontSize: "0.85rem", fontWeight: "500" }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "10px" }}>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  style={{ background: "transparent", border: "1px solid #CBD5E1", color: "#475569", borderRadius: "6px", padding: "8px 14px", cursor: "pointer", fontSize: "0.8rem", fontWeight: "600" }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  style={{ background: "#059669", border: "none", color: "#FFFFFF", borderRadius: "6px", padding: "8px 16px", fontWeight: "600", cursor: "pointer", fontSize: "0.8rem" }}
                >
                  Simpan Barang
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}