"use client";

import { useState, useEffect, useRef } from "react";

export default function KodeBarangPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [skuCode, setSkuCode] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [buyPrice, setBuyPrice] = useState<number | "">("");
  const [retailPrice, setRetailPrice] = useState<number | "">("");
  const [wholesalePrice, setWholesalePrice] = useState<number | "">("");
  const [stock, setStock] = useState<number | "">("");
  const [unit, setUnit] = useState("pcs");
  const [searchTerm, setSearchTerm] = useState("");
  const [isOnline, setIsOnline] = useState(true);
  const [message, setMessage] = useState("");
  const skuInputRef = useRef<HTMLInputElement>(null);

  const loadProducts = () => {
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

    const handleStorageChange = () => loadProducts();
    window.addEventListener("storage", handleStorageChange);

    if (skuInputRef.current) {
      skuInputRef.current.focus();
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  // Fungsi untuk membuat kode SKU unik otomatis jika tidak ada barcode
  const handleGenerateUniqueSku = () => {
    const randomCode = "TW-" + Math.floor(100000 + Math.random() * 900000);
    setSkuCode(randomCode);
    setMessage(`ℹ️ Kode SKU unik berhasil digenerate: ${randomCode}`);
    if (skuInputRef.current) {
      skuInputRef.current.focus();
    }
  };

  // Handler saat SKU di-scan atau diketik, jika sudah ada maka otomatis isi form untuk mode update
  const handleSkuChange = (val: string) => {
    setSkuCode(val);
    const found = products.find((p) => p.skuCode?.toLowerCase() === val.trim().toLowerCase());
    if (found) {
      setName(found.name || "");
      setCategory(found.category || "");
      setBuyPrice(found.buyPrice || "");
      setRetailPrice(found.retailPrice || found.sellPrice || "");
      setWholesalePrice(found.wholesalePrice || "");
      setStock(found.stock !== undefined ? found.stock : "");
      setUnit(found.unit || "pcs");
      setMessage(`ℹ️ SKU "${val}" sudah terdaftar. Mode Update aktif.`);
    } else {
      setMessage("");
    }
  };

  const handleSaveSku = (e: React.FormEvent) => {
    e.preventDefault();
    if (!skuCode || !name || retailPrice === "" || wholesalePrice === "") {
      alert("Mohon lengkapi Kode SKU, Nama Barang, Harga Retail, dan Harga Grosir!");
      return;
    }

    const cleanSku = skuCode.trim();
    const existingIndex = products.findIndex((p) => p.skuCode?.toLowerCase() === cleanSku.toLowerCase());
    let updatedProducts = [...products];

    if (existingIndex >= 0) {
      // ANTI-DUPLIKASI: Update data pada SKU yang sama persis
      updatedProducts[existingIndex] = {
        ...updatedProducts[existingIndex],
        name,
        category: category || "Umum",
        buyPrice: buyPrice === "" ? updatedProducts[existingIndex].buyPrice : Number(buyPrice),
        retailPrice: Number(retailPrice),
        wholesalePrice: Number(wholesalePrice),
        sellPrice: Number(retailPrice),
        stock: stock === "" ? updatedProducts[existingIndex].stock : Number(stock),
        unit: unit || "pcs",
      };
      setMessage(`✓ Master SKU ${cleanSku} berhasil diperbarui tanpa duplikasi!`);
    } else {
      // TAMBAH BARU JIKA BELUM ADA
      const newProductData = {
        skuCode: cleanSku,
        name,
        category: category || "Umum",
        buyPrice: buyPrice === "" ? 0 : Number(buyPrice),
        retailPrice: Number(retailPrice),
        wholesalePrice: Number(wholesalePrice),
        sellPrice: Number(retailPrice),
        stock: stock === "" ? 0 : Number(stock),
        unit: unit || "pcs",
        isActive: true,
        status: "active",
      };
      updatedProducts = [newProductData, ...updatedProducts];
      setMessage(`✓ Master SKU ${cleanSku} berhasil diregistrasi!`);
    }

    setProducts(updatedProducts);
    localStorage.setItem("tw_products", JSON.stringify(updatedProducts));
    window.dispatchEvent(new Event("storage"));

    setSkuCode("");
    setName("");
    setCategory("");
    setBuyPrice("");
    setRetailPrice("");
    setWholesalePrice("");
    setStock("");
    setUnit("pcs");
    setTimeout(() => setMessage(""), 4000);

    if (skuInputRef.current) {
      skuInputRef.current.focus();
    }
  };

  const toggleStatus = (sku: string) => {
    const updated = products.map((p) => {
      if (p.skuCode === sku) {
        const nextActive = p.isActive === false ? true : false;
        return {
          ...p,
          isActive: nextActive,
          status: nextActive ? "active" : "inactive",
        };
      }
      return p;
    });
    setProducts(updated);
    localStorage.setItem("tw_products", JSON.stringify(updated));
    window.dispatchEvent(new Event("storage"));
  };

  const filteredProducts = products.filter(
    (p) =>
      p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.skuCode?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="tw-main" style={{ animation: "fadeIn 0.3s ease-in-out", width: "100%", boxSizing: "border-box" }}>
      <header className="tw-topbar">
        <div className="tw-breadcrumb">
          <strong>Master Kode Barang (Registrasi Barang, Stok &amp; Anti-Duplikasi)</strong>
        </div>
        <div className="tw-topbar-right">
          <span className="tw-live-badge" style={{ backgroundColor: isOnline ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)", color: isOnline ? "#10b981" : "#ef4444" }}>
            {isOnline ? "ONLINE" : "OFFLINE"}
          </span>
        </div>
      </header>

      <div className="tw-content" style={{ padding: "20px", display: "grid", gridTemplateColumns: "1fr 1.6fr", gap: "20px" }}>
        
        {/* FORM REGISTRASI MASTER & STOK */}
        <div className="tw-card" style={{ display: "flex", flexDirection: "column", gap: "14px", height: "fit-content" }}>
          <h3 className="tw-card-title">Registrasi / Scan SKU &amp; Stok Masuk</h3>

          {message && (
            <div style={{ padding: "10px", background: message.includes("ℹ️") ? "rgba(56, 189, 248, 0.15)" : "rgba(16, 185, 129, 0.15)", color: message.includes("ℹ️") ? "#38bdf8" : "#10b981", borderRadius: "8px", fontSize: "0.85rem" }}>
              {message}
            </div>
          )}

          <form onSubmit={handleSaveSku} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "3px" }}>
                <label style={{ fontSize: "0.75rem", color: "var(--tw-muted)" }}>Scan Barcode / Kode SKU</label>
                <button
                  type="button"
                  onClick={handleGenerateUniqueSku}
                  style={{ background: "transparent", border: "none", color: "#38bdf8", fontSize: "0.75rem", cursor: "pointer", textDecoration: "underline", padding: 0 }}
                >
                  + Generate Kode Unik
                </button>
              </div>
              <input
                ref={skuInputRef}
                type="text"
                placeholder="Arahkan scan barcode atau klik generate..."
                value={skuCode}
                onChange={(e) => handleSkuChange(e.target.value)}
                style={{ width: "100%", padding: "7px 10px", background: "rgba(56, 189, 248, 0.05)", border: "1px solid #38bdf8", borderRadius: "8px", color: "#fff" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.75rem", color: "var(--tw-muted)", marginBottom: "3px" }}>Nama Barang</label>
              <input
                type="text"
                placeholder="Contoh: Le Minerale 600ml..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{ width: "100%", padding: "7px 10px", background: "rgba(255,255,255,0.03)", border: "1px solid var(--tw-border)", borderRadius: "8px", color: "#fff" }}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.75rem", color: "var(--tw-muted)", marginBottom: "3px" }}>Kategori</label>
                <input
                  type="text"
                  placeholder="Contoh: Minuman..."
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  style={{ width: "100%", padding: "7px 10px", background: "rgba(255,255,255,0.03)", border: "1px solid var(--tw-border)", borderRadius: "8px", color: "#fff" }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.75rem", color: "var(--tw-muted)", marginBottom: "3px" }}>Satuan Unit</label>
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  style={{ width: "100%", padding: "7px 10px", background: "rgba(255,255,255,0.03)", border: "1px solid var(--tw-border)", borderRadius: "8px", color: "#fff" }}
                >
                  <option value="pcs" style={{ background: "#090d16" }}>Pcs</option>
                  <option value="pack" style={{ background: "#090d16" }}>Pack</option>
                  <option value="slop" style={{ background: "#090d16" }}>Slop</option>
                  <option value="lusin" style={{ background: "#090d16" }}>Lusin</option>
                  <option value="kg" style={{ background: "#090d16" }}>Kg</option>
                  <option value="gram" style={{ background: "#090d16" }}>Gram</option>
                  <option value="renceng" style={{ background: "#090d16" }}>Renceng</option>
                  <option value="krat" style={{ background: "#090d16" }}>Krat</option>
                  <option value="dus" style={{ background: "#090d16" }}>Dus / Karton</option>
                  <option value="unit" style={{ background: "#090d16" }}>Unit</option>
                  <option value="lainnya" style={{ background: "#090d16" }}>Lainnya</option>
                </select>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.75rem", color: "var(--tw-muted)", marginBottom: "3px" }}>Qty Stok Awal</label>
                <input
                  type="number"
                  placeholder="0"
                  value={stock}
                  onChange={(e) => setStock(e.target.value === "" ? "" : Number(e.target.value))}
                  style={{ width: "100%", padding: "7px 10px", background: "rgba(255,255,255,0.03)", border: "1px solid var(--tw-border)", borderRadius: "8px", color: "#fff" }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.75rem", color: "var(--tw-muted)", marginBottom: "3px" }}>Harga Modal</label>
                <input
                  type="number"
                  placeholder="0"
                  value={buyPrice}
                  onChange={(e) => setBuyPrice(e.target.value === "" ? "" : Number(e.target.value))}
                  style={{ width: "100%", padding: "7px 10px", background: "rgba(255,255,255,0.03)", border: "1px solid var(--tw-border)", borderRadius: "8px", color: "#fff" }}
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.75rem", color: "var(--tw-muted)", marginBottom: "3px" }}>Harga Retail</label>
                <input
                  type="number"
                  placeholder="0"
                  value={retailPrice}
                  onChange={(e) => setRetailPrice(e.target.value === "" ? "" : Number(e.target.value))}
                  style={{ width: "100%", padding: "7px 10px", background: "rgba(255,255,255,0.03)", border: "1px solid var(--tw-border)", borderRadius: "8px", color: "#fff" }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.75rem", color: "var(--tw-muted)", marginBottom: "3px" }}>Harga Grosir</label>
                <input
                  type="number"
                  placeholder="0"
                  value={wholesalePrice}
                  onChange={(e) => setWholesalePrice(e.target.value === "" ? "" : Number(e.target.value))}
                  style={{ width: "100%", padding: "7px 10px", background: "rgba(255,255,255,0.03)", border: "1px solid var(--tw-border)", borderRadius: "8px", color: "#fff" }}
                />
              </div>
            </div>

            <button type="submit" className="tw-btn tw-btn-primary" style={{ padding: "10px", fontWeight: "bold", marginTop: "4px" }}>
              Simpan / Update Master SKU &amp; Stok
            </button>
          </form>
        </div>

        {/* TABEL DAFTAR MASTER SKU */}
        <div className="tw-card" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
            <h3 className="tw-card-title" style={{ margin: 0 }}>Daftar Master SKU ({filteredProducts.length})</h3>
            <input
              type="text"
              placeholder="Cari SKU / Nama Barang..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ padding: "6px 10px", borderRadius: "8px", border: "1px solid var(--tw-border)", background: "rgba(255,255,255,0.03)", color: "#fff", fontSize: "0.8rem", width: "200px" }}
            />
          </div>

          <div style={{ overflowX: "auto", maxHeight: "500px", overflowY: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.82rem", textAlign: "left" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--tw-border)", color: "var(--tw-muted)" }}>
                  <th style={{ padding: "10px" }}>SKU</th>
                  <th style={{ padding: "10px" }}>Nama Barang</th>
                  <th style={{ padding: "10px" }}>Stok / Satuan</th>
                  <th style={{ padding: "10px" }}>Retail</th>
                  <th style={{ padding: "10px" }}>Grosir</th>
                  <th style={{ padding: "10px" }}>Status</th>
                  <th style={{ padding: "10px", textAlign: "center" }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: "40px", textAlign: "center", color: "var(--tw-muted)" }}>
                      Belum ada master SKU terdaftar. Silakan registrasi produk baru melalui form di sebelah kiri.
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((p, idx) => {
                    const isActive = p.isActive !== false && p.status !== "inactive";
                    return (
                      <tr key={idx} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                        <td style={{ padding: "10px", fontWeight: "bold", color: "#38bdf8" }}>{p.skuCode}</td>
                        <td style={{ padding: "10px", color: "#fff" }}>{p.name}</td>
                        <td style={{ padding: "10px", color: "#38bdf8", fontWeight: "bold" }}>
                          {p.stock || 0} <span style={{ fontSize: "0.7rem", color: "var(--tw-muted)", fontWeight: "normal" }}>({p.unit || "pcs"})</span>
                        </td>
                        <td style={{ padding: "10px", color: "#10b981" }}>Rp {(p.retailPrice || p.sellPrice || 0).toLocaleString("id-ID")}</td>
                        <td style={{ padding: "10px", color: "#f59e0b" }}>Rp {(p.wholesalePrice || 0).toLocaleString("id-ID")}</td>
                        <td style={{ padding: "10px" }}>
                          <span style={{ padding: "3px 8px", background: isActive ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.15)", color: isActive ? "#10b981" : "#ef4444", borderRadius: "6px", fontSize: "0.75rem" }}>
                            {isActive ? "Aktif" : "Non-Aktif"}
                          </span>
                        </td>
                        <td style={{ padding: "10px", textAlign: "center" }}>
                          <button
                            onClick={() => toggleStatus(p.skuCode)}
                            style={{ padding: "4px 8px", background: isActive ? "rgba(239, 68, 68, 0.15)" : "rgba(16, 185, 129, 0.15)", color: isActive ? "#ef4444" : "#10b981", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "0.75rem", fontWeight: "bold" }}
                          >
                            {isActive ? "Non-Aktifkan" : "Aktifkan"}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}