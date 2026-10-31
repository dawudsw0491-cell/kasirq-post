"use client";

import { useState, useEffect, useRef } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { supabase } from "@/lib/supabase";

export default function KodeBarangPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [skuCode, setSkuCode] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Sembako");
  const [buyPrice, setBuyPrice] = useState<number | "">("");
  const [retailPrice, setRetailPrice] = useState<number | "">("");
  const [wholesalePrice, setWholesalePrice] = useState<number | "">("");
  const [stock, setStock] = useState<number | "">("");
  const [unit, setUnit] = useState("kg");
  const [searchTerm, setSearchTerm] = useState("");
  const [isOnline, setIsOnline] = useState(true);
  const [message, setMessage] = useState("");
  
  // State tambahan untuk Scan Kamera HP
  const [isScanning, setIsScanning] = useState(false);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  const skuInputRef = useRef<HTMLInputElement>(null);

  const loadProducts = async () => {
    try {
      const { data, error } = await supabase.from("tw_products").select("*");
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

    const handleStorageChange = () => loadProducts();
    window.addEventListener("storage", handleStorageChange);

    if (skuInputRef.current) {
      skuInputRef.current.focus();
    }

    const channel = supabase
      .channel("public:tw_products_kode")
      .on("postgres_changes", { event: "*", schema: "public", table: "tw_products" }, () => {
        loadProducts();
      })
      .subscribe();

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("storage", handleStorageChange);
      if (scannerRef.current) {
        scannerRef.current.clear().catch(() => {});
      }
      supabase.removeChannel(channel);
    };
  }, []);

  const handleGenerateUniqueSku = () => {
    const randomCode = "TW-" + Math.floor(100000 + Math.random() * 900000);
    setSkuCode(randomCode);
    handleSkuChange(randomCode);
    setMessage(`ℹ️ Kode SKU unik berhasil digenerate: ${randomCode}`);
    if (skuInputRef.current) {
      skuInputRef.current.focus();
    }
  };

  const toggleCameraScanner = () => {
    if (isScanning) {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(() => {});
        scannerRef.current = null;
      }
      setIsScanning(false);
    } else {
      setIsScanning(true);
      setTimeout(() => {
        const scanner = new Html5QrcodeScanner(
          "reader-kode",
          { fps: 10, qrbox: { width: 250, height: 150 } },
          false
        );
        scanner.render(
          (decodedText) => {
            setSkuCode(decodedText);
            handleSkuChange(decodedText);
            scanner.clear().catch(() => {});
            scannerRef.current = null;
            setIsScanning(false);
          },
          (error) => {}
        );
        scannerRef.current = scanner;
      }, 150);
    }
  };

  const handleSkuChange = (val: string) => {
    setSkuCode(val);
    const found = products.find((p) => (p.skuCode || p.skucode)?.toLowerCase() === val.trim().toLowerCase());
    if (found) {
      setName(found.name || "");
      setCategory(found.category || "Sembako");
      setBuyPrice(found.buyPrice !== undefined ? found.buyPrice : (found.buyprice !== undefined ? found.buyprice : ""));
      setRetailPrice(found.retailPrice !== undefined ? found.retailPrice : (found.retailprice !== undefined ? found.retailprice : ""));
      setWholesalePrice(found.wholesalePrice !== undefined ? found.wholesalePrice : (found.wholesaleprice !== undefined ? found.wholesaleprice : ""));
      setStock(found.stock !== undefined ? found.stock : "");
      setUnit(found.unit || "kg");
      setMessage(`ℹ️ SKU "${val}" sudah terdaftar. Mode Update aktif.`);
    } else {
      setMessage("");
    }
  };

  const handleEditRow = (p: any) => {
    setSkuCode(p.skuCode || p.skucode || "");
    setName(p.name || "");
    setCategory(p.category || "Sembako");
    setBuyPrice(p.buyPrice !== undefined ? p.buyPrice : (p.buyprice !== undefined ? p.buyprice : ""));
    setRetailPrice(p.retailPrice !== undefined ? p.retailPrice : (p.retailprice !== undefined ? p.retailprice : ""));
    setWholesalePrice(p.wholesalePrice !== undefined ? p.wholesalePrice : (p.wholesaleprice !== undefined ? p.wholesaleprice : ""));
    setStock(p.stock !== undefined ? p.stock : "");
    setUnit(p.unit || "kg");
    setMessage(`✏️ Mode Edit aktif untuk SKU: ${p.skuCode || p.skucode}`);
    if (skuInputRef.current) {
      skuInputRef.current.focus();
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSaveSku = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!skuCode || !name || retailPrice === "" || wholesalePrice === "") {
      alert("Mohon lengkapi Kode SKU, Nama Barang, Harga Retail, dan Harga Grosir!");
      return;
    }

    const cleanSku = skuCode.trim();
    const existingIndex = products.findIndex((p) => (p.skuCode || p.skucode)?.toLowerCase() === cleanSku.toLowerCase());
    const parsedStockValue = stock === "" ? 0 : parseFloat(String(stock));

    const productPayload = {
      skuCode: cleanSku,
      name,
      category: category || "Sembako",
      buyPrice: buyPrice === "" ? 0 : Number(buyPrice),
      retailPrice: Number(retailPrice),
      wholesalePrice: Number(wholesalePrice),
      stock: parsedStockValue,
      unit: unit || "kg",
    };

    const { error } = await supabase.from("tw_products").upsert([productPayload], { onConflict: "skuCode" });
    
    if (error) {
      alert("Gagal menyimpan ke Cloud Database: " + error.message);
      return;
    }

    let updatedProducts = [...products];
    if (existingIndex >= 0) {
      updatedProducts[existingIndex] = { ...updatedProducts[existingIndex], ...productPayload };
      setMessage(`✓ Master SKU ${cleanSku} berhasil diperbarui!`);
    } else {
      updatedProducts = [productPayload, ...updatedProducts];
      setMessage(`✓ Master SKU ${cleanSku} berhasil diregistrasi!`);
    }

    setProducts(updatedProducts);
    localStorage.setItem("tw_products", JSON.stringify(updatedProducts));
    window.dispatchEvent(new Event("storage"));

    setSkuCode("");
    setName("");
    setCategory("Sembako");
    setBuyPrice("");
    setRetailPrice("");
    setWholesalePrice("");
    setStock("");
    setUnit("kg");
    setTimeout(() => setMessage(""), 4000);

    if (skuInputRef.current) {
      skuInputRef.current.focus();
    }
  };

  const handleDeleteProduct = async (sku: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus produk dengan SKU "${sku}" secara permanen?`)) {
      return;
    }

    const { error } = await supabase
      .from("tw_products")
      .delete()
      .eq("skuCode", sku);

    if (error) {
      alert("Gagal menghapus produk dari Cloud: " + error.message);
      return;
    }

    const updated = products.filter((p) => (p.skuCode || p.skucode) !== sku);
    setProducts(updated);
    localStorage.setItem("tw_products", JSON.stringify(updated));
    window.dispatchEvent(new Event("storage"));

    setMessage(`🗑️ Produk SKU ${sku} berhasil dihapus permanen!`);
    setTimeout(() => setMessage(""), 4000);
  };

  const filteredProducts = products.filter(
    (p) =>
      p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.skuCode || p.skucode)?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="tw-main" style={{ animation: "fadeIn 0.3s ease-in-out", width: "100%", boxSizing: "border-box" }}>
      
      {/* TOPBAR DENGAN CARD HEADER SOLID ELEGAN */}
      <header className="tw-topbar" style={{ background: "transparent", borderBottom: "none", padding: "16px 24px 0 24px" }}>
        <div className="tw-header-card" style={{ width: "100%", backgroundColor: "#FFFFFF", border: "1px solid #CBD5E1", borderRadius: "10px", padding: "12px 20px", boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div className="tw-breadcrumb">
            <strong style={{ color: "#0F172A", fontSize: "0.95rem", fontWeight: "700" }}>MASTER KODE BARANG</strong>
          </div>
          <div className="tw-topbar-right" style={{ display: "flex", alignItems: "center", gap: "12px" }}>
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

      <div className="tw-content" style={{ padding: "24px", display: "grid", gridTemplateColumns: "1fr 1.6fr", gap: "20px" }}>
        
        {/* KARTU KIRI: FORM REGISTRASI / SKU */}
        <div className="tw-card" style={{ backgroundColor: "#FFFFFF", border: "1px solid #CBD5E1", borderRadius: "12px", padding: "18px", display: "flex", flexDirection: "column", gap: "14px", height: "fit-content", boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)" }}>
          <h3 className="tw-card-title" style={{ margin: 0, color: "#0F172A", fontSize: "1rem", fontWeight: "600" }}>Registrasi / Scan SKU &amp; Stok Masuk</h3>

          {message && (
            <div style={{ padding: "10px", background: message.includes("ℹ️") || message.includes("✏️") ? "#E0F2FE" : "#D1FAE5", color: message.includes("ℹ️") || message.includes("✏️") ? "#0369A1" : "#065F46", borderRadius: "8px", fontSize: "0.85rem", fontWeight: "600", border: message.includes("ℹ️") || message.includes("✏️") ? "1px solid #BAE6FD" : "1px solid #A7F3D0" }}>
              {message}
            </div>
          )}

          <form onSubmit={handleSaveSku} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                <label style={{ fontSize: "0.8rem", color: "#334155", fontWeight: "600" }}>Scan Barcode / QR / Kode SKU</label>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    type="button"
                    onClick={handleGenerateUniqueSku}
                    style={{ background: "transparent", border: "none", color: "#0284C7", fontSize: "0.75rem", cursor: "pointer", textDecoration: "underline", padding: 0, fontWeight: "600" }}
                  >
                    + Generate Kode Unik
                  </button>
                  <button
                    type="button"
                    onClick={toggleCameraScanner}
                    style={{ background: isScanning ? "#DC2626" : "#059669", border: "none", color: "#fff", fontSize: "0.75rem", cursor: "pointer", padding: "2px 8px", borderRadius: "4px", fontWeight: "600" }}
                  >
                    {isScanning ? "Tutup Kamera" : "📷 Scan Kamera"}
                  </button>
                </div>
              </div>

              {isScanning && (
                <div style={{ marginBottom: "10px", background: "#FFFFFF", padding: "12px", borderRadius: "8px", border: "1px solid #CBD5E1", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>
                  <div id="reader-kode" style={{ width: "100%" }}></div>
                </div>
              )}

              <input
                ref={skuInputRef}
                type="text"
                placeholder="Arahkan alat scan USB, ketik, atau scan kamera..."
                value={skuCode}
                onChange={(e) => handleSkuChange(e.target.value)}
                style={{ width: "100%", padding: "8px 12px", background: "#FFFFFF", border: "1px solid #0284C7", borderRadius: "8px", color: "#0F172A", fontSize: "0.85rem", fontWeight: "500" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.8rem", color: "#334155", marginBottom: "4px", fontWeight: "600" }}>Nama Barang</label>
              <input
                type="text"
                placeholder="Contoh: Gula Pasir / Minyak Goreng..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{ width: "100%", padding: "8px 12px", background: "#FFFFFF", border: "1px solid #CBD5E1", borderRadius: "8px", color: "#0F172A", fontSize: "0.85rem", fontWeight: "500" }}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", color: "#334155", marginBottom: "4px", fontWeight: "600" }}>Kategori</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px", background: "#FFFFFF", border: "1px solid #CBD5E1", borderRadius: "8px", color: "#0F172A", fontSize: "0.85rem", fontWeight: "500" }}
                >
                  <option value="Sembako">Sembako</option>
                  <option value="Obat - Obatan">Obat - Obatan</option>
                  <option value="Minuman">Minuman</option>
                  <option value="Isi Ulang / Refil">Isi Ulang / Refil</option>
                  <option value="Snack">Snack</option>
                  <option value="Bumbu Dapur">Bumbu Dapur</option>
                  <option value="Rokok">Rokok</option>
                  <option value="Perawatan Tubuh">Perawatan Tubuh</option>
                  <option value="Kebersihan Rumah Tangga">Kebersihan Rumah Tangga</option>
                  <option value="Alat Mandi">Alat Mandi</option>
                  <option value="Alat & Perkakas">Alat & Perkakas</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", color: "#334155", marginBottom: "4px", fontWeight: "600" }}>Satuan Unit</label>
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px", background: "#FFFFFF", border: "1px solid #CBD5E1", borderRadius: "8px", color: "#0F172A", fontSize: "0.85rem", fontWeight: "500" }}
                >
                  <option value="kg">Kg (Kilogram)</option>
                  <option value="gram">Gram</option>
                  <option value="pcs">Pcs</option>
                  <option value="pack">Pack</option>
                  <option value="slop">Slop</option>
                  <option value="liter">Liter</option>
                  <option value="renceng">Renceng</option>
                  <option value="krat">Krat</option>
                  <option value="galon">Galon</option>
                  <option value="Lusin">Lusin</option>
                  <option value="dus">Dus</option>
                </select>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", color: "#334155", marginBottom: "4px", fontWeight: "600" }}>Qty Stok Awal</label>
                <input
                  type="number"
                  step="any"
                  placeholder="0 atau 0.25"
                  value={stock}
                  onChange={(e) => setStock(e.target.value === "" ? "" : parseFloat(e.target.value))}
                  style={{ width: "100%", padding: "8px 12px", background: "#FFFFFF", border: "1px solid #CBD5E1", borderRadius: "8px", color: "#0F172A", fontSize: "0.85rem", fontWeight: "500" }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", color: "#334155", marginBottom: "4px", fontWeight: "600" }}>Harga Modal</label>
                <input
                  type="number"
                  placeholder="0"
                  value={buyPrice}
                  onChange={(e) => setBuyPrice(e.target.value === "" ? "" : Number(e.target.value))}
                  style={{ width: "100%", padding: "8px 12px", background: "#FFFFFF", border: "1px solid #CBD5E1", borderRadius: "8px", color: "#0F172A", fontSize: "0.85rem", fontWeight: "500" }}
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", color: "#059669", marginBottom: "4px", fontWeight: "600" }}>Harga Retail</label>
                <input
                  type="number"
                  placeholder="0"
                  value={retailPrice}
                  onChange={(e) => setRetailPrice(e.target.value === "" ? "" : Number(e.target.value))}
                  style={{ width: "100%", padding: "8px 12px", background: "#FFFFFF", border: "1px solid #059669", borderRadius: "8px", color: "#0F172A", fontSize: "0.85rem", fontWeight: "500" }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", color: "#D97706", marginBottom: "4px", fontWeight: "600" }}>Harga Grosir</label>
                <input
                  type="number"
                  placeholder="0"
                  value={wholesalePrice}
                  onChange={(e) => setWholesalePrice(e.target.value === "" ? "" : Number(e.target.value))}
                  style={{ width: "100%", padding: "8px 12px", background: "#FFFFFF", border: "1px solid #D97706", borderRadius: "8px", color: "#0F172A", fontSize: "0.85rem", fontWeight: "500" }}
                />
              </div>
            </div>

            <button type="submit" className="tw-btn tw-btn-primary" style={{ padding: "10px", fontWeight: "600", marginTop: "4px", background: "#059669", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "0.9rem" }}>
              SIMPAN / UPDATE
            </button>
          </form>
        </div>

        {/* KARTU KANAN: DAFTAR MASTER SKU */}
        <div className="tw-card" style={{ backgroundColor: "#FFFFFF", border: "1px solid #CBD5E1", borderRadius: "12px", padding: "18px", display: "flex", flexDirection: "column", gap: "16px", boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
            <h3 className="tw-card-title" style={{ margin: 0, color: "#0F172A", fontSize: "1rem", fontWeight: "600" }}>Daftar Master SKU [{filteredProducts.length}]</h3>
            <input
              type="text"
              placeholder="Cari SKU / Nama Barang..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ padding: "6px 12px", borderRadius: "8px", border: "1px solid #CBD5E1", background: "#FFFFFF", color: "#0F172A", fontSize: "0.85rem", width: "200px", fontWeight: "500" }}
            />
          </div>

          <div style={{ overflowX: "auto", maxHeight: "500px", overflowY: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem", textAlign: "left" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #E2E8F0", color: "#334155" }}>
                  <th style={{ padding: "10px", fontWeight: "600" }}>SKU</th>
                  <th style={{ padding: "10px", fontWeight: "600" }}>Nama Barang</th>
                  <th style={{ padding: "10px", fontWeight: "600" }}>Kategori</th>
                  <th style={{ padding: "10px", fontWeight: "600" }}>Stok / Satuan</th>
                  <th style={{ padding: "10px", fontWeight: "600" }}>Retail</th>
                  <th style={{ padding: "10px", fontWeight: "600" }}>Grosir</th>
                  <th style={{ padding: "10px", textAlign: "center", fontWeight: "600" }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: "40px", textAlign: "center", color: "#64748B", fontSize: "0.85rem", fontWeight: "500" }}>
                      Belum ada master SKU terdaftar.
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((p, idx) => {
                    const codeVal = p.skuCode || p.skucode;
                    const retailVal = p.retailPrice !== undefined ? p.retailPrice : p.retailprice;
                    const wholesaleVal = p.wholesalePrice !== undefined ? p.wholesalePrice : p.wholesaleprice;

                    return (
                      <tr key={idx} style={{ borderBottom: "1px solid #F1F5F9", transition: "background 0.2s" }}>
                        <td style={{ padding: "10px", fontWeight: "600", color: "#0284C7" }}>{codeVal}</td>
                        <td style={{ padding: "10px", color: "#0F172A", fontWeight: "600" }}>{p.name}</td>
                        <td style={{ padding: "10px", color: "#64748B", fontSize: "0.78rem", fontWeight: "500" }}>{p.category || "Sembako"}</td>
                        <td style={{ padding: "10px", color: "#0F172A", fontWeight: "600" }}>
                          {p.stock !== undefined ? p.stock : 0} <span style={{ fontSize: "0.75rem", color: "#64748B", fontWeight: "normal" }}>({p.unit || "kg"})</span>
                        </td>
                        <td style={{ padding: "10px", color: "#059669", fontWeight: "600" }}>Rp {(retailVal || 0).toLocaleString("id-ID")}</td>
                        <td style={{ padding: "10px", color: "#D97706", fontWeight: "600" }}>Rp {(wholesaleVal || 0).toLocaleString("id-ID")}</td>
                        <td style={{ padding: "10px", textAlign: "center", display: "flex", justifyContent: "center", gap: "6px" }}>
                          <button
                            type="button"
                            onClick={() => handleEditRow(p)}
                            style={{ padding: "4px 10px", background: "#0284C7", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "0.75rem", fontWeight: "600" }}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteProduct(codeVal)}
                            style={{ padding: "4px 10px", background: "#DC2626", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "0.75rem", fontWeight: "600" }}
                          >
                            Hapus
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