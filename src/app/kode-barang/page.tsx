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

    // Supabase Realtime Subscription untuk sinkronisasi otomatis
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

  // 1. GENERATE KODE UNIK OTOMATIS
  const handleGenerateUniqueSku = () => {
    const randomCode = "TW-" + Math.floor(100000 + Math.random() * 900000);
    setSkuCode(randomCode);
    handleSkuChange(randomCode);
    setMessage(`ℹ️ Kode SKU unik berhasil digenerate: ${randomCode}`);
    if (skuInputRef.current) {
      skuInputRef.current.focus();
    }
  };

  // 2. AKTIFKAN / MATIKAN SCANNER KAMERA HP
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

  // Fungsi untuk memuat data SKU ke form saat tombol "Edit" diklik di tabel
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

  // 3. FUNGSI HAPUS PRODUK TERINTEGRASI SUPABASE & LOCALSTORAGE
  const handleDeleteProduct = async (sku: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus produk dengan SKU "${sku}" secara permanen?`)) {
      return;
    }

    // Hapus dari database Supabase berdasarkan skuCode
    const { error } = await supabase
      .from("tw_products")
      .delete()
      .eq("skuCode", sku);

    if (error) {
      alert("Gagal menghapus produk dari Cloud: " + error.message);
      return;
    }

    // Perbarui state lokal dan localStorage
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
      <header className="tw-topbar">
        <div className="tw-breadcrumb">
          <strong>MASTER KODE BARANG</strong>
        </div>
        <div className="tw-topbar-right">
          <span className="tw-live-badge" style={{ backgroundColor: isOnline ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)", color: isOnline ? "#10b981" : "#ef4444" }}>
            {isOnline ? "ONLINE (SUPABASE)" : "OFFLINE"}
          </span>
        </div>
      </header>

      <div className="tw-content" style={{ padding: "20px", display: "grid", gridTemplateColumns: "1fr 1.6fr", gap: "20px" }}>
        
        <div className="tw-card" style={{ display: "flex", flexDirection: "column", gap: "14px", height: "fit-content" }}>
          <h3 className="tw-card-title">Registrasi / Scan SKU &amp; Stok Masuk</h3>

          {message && (
            <div style={{ padding: "10px", background: message.includes("ℹ️") || message.includes("✏️") ? "rgba(56, 189, 248, 0.15)" : "rgba(16, 185, 129, 0.15)", color: message.includes("ℹ️") || message.includes("✏️") ? "#38bdf8" : "#10b981", borderRadius: "8px", fontSize: "0.85rem" }}>
              {message}
            </div>
          )}

          <form onSubmit={handleSaveSku} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "3px" }}>
                <label style={{ fontSize: "0.75rem", color: "var(--tw-muted)" }}>Scan Barcode / QR / Kode SKU</label>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    type="button"
                    onClick={handleGenerateUniqueSku}
                    style={{ background: "transparent", border: "none", color: "#38bdf8", fontSize: "0.75rem", cursor: "pointer", textDecoration: "underline", padding: 0 }}
                  >
                    + Generate Kode Unik
                  </button>
                  <button
                    type="button"
                    onClick={toggleCameraScanner}
                    style={{ background: isScanning ? "#ef4444" : "#10b981", border: "none", color: "#fff", fontSize: "0.7rem", cursor: "pointer", padding: "2px 6px", borderRadius: "4px", fontWeight: "bold" }}
                  >
                    {isScanning ? "Tutup Kamera" : "📷 Scan Kamera"}
                  </button>
                </div>
              </div>

              {isScanning && (
                <div style={{ marginBottom: "10px", background: "#1e293b", padding: "8px", borderRadius: "8px", border: "1px solid #38bdf8" }}>
                  <div id="reader-kode" style={{ width: "100%" }}></div>
                </div>
              )}

              <input
                ref={skuInputRef}
                type="text"
                placeholder="Arahkan alat scan USB, ketik, atau scan kamera..."
                value={skuCode}
                onChange={(e) => handleSkuChange(e.target.value)}
                style={{ width: "100%", padding: "7px 10px", background: "rgba(56, 189, 248, 0.05)", border: "1px solid #38bdf8", borderRadius: "8px", color: "#fff" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.75rem", color: "var(--tw-muted)", marginBottom: "3px" }}>Nama Barang</label>
              <input
                type="text"
                placeholder="Contoh: Gula Pasir / Minyak Goreng..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{ width: "100%", padding: "7px 10px", background: "rgba(255,255,255,0.03)", border: "1px solid var(--tw-border)", borderRadius: "8px", color: "#fff" }}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.75rem", color: "var(--tw-muted)", marginBottom: "3px" }}>Kategori</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  style={{ width: "100%", padding: "7px 10px", background: "rgba(255,255,255,0.03)", border: "1px solid var(--tw-border)", borderRadius: "8px", color: "#fff" }}
                >
                  <option value="Sembako" style={{ background: "#090d16" }}>Sembako</option>
                  <option value="Kebutuhan Pokok" style={{ background: "#090d16" }}>Kebutuhan Pokok</option>
                  <option value="Makanan & Minuman" style={{ background: "#090d16" }}>Makanan & Minuman</option>
                  <option value="Bumbu Dapur" style={{ background: "#090d16" }}>Bumbu Dapur</option>
                  <option value="Rokok & Tembakau" style={{ background: "#090d16" }}>Rokok & Tembakau</option>
                  <option value="Perawatan Tubuh" style={{ background: "#090d16" }}>Perawatan Tubuh</option>
                  <option value="Kebersihan Rumah Tangga" style={{ background: "#090d16" }}>Kebersihan Rumah Tangga</option>
                  <option value="Lainnya" style={{ background: "#090d16" }}>Lainnya</option>
                </select>
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.75rem", color: "var(--tw-muted)", marginBottom: "3px" }}>Satuan Unit</label>
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  style={{ width: "100%", padding: "7px 10px", background: "rgba(255,255,255,0.03)", border: "1px solid var(--tw-border)", borderRadius: "8px", color: "#fff" }}
                >
                  <option value="kg" style={{ background: "#090d16" }}>Kg (Kilogram)</option>
                  <option value="gram" style={{ background: "#090d16" }}>Gram</option>
                  <option value="pcs" style={{ background: "#090d16" }}>Pcs</option>
                  <option value="pack" style={{ background: "#090d16" }}>Pack</option>
                  <option value="liter" style={{ background: "#090d16" }}>Liter</option>
                  <option value="dus" style={{ background: "#090d16" }}>Dus</option>
                </select>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.75rem", color: "var(--tw-muted)", marginBottom: "3px" }}>Qty Stok Awal</label>
                <input
                  type="number"
                  step="any"
                  placeholder="0 atau 0.25"
                  value={stock}
                  onChange={(e) => setStock(e.target.value === "" ? "" : parseFloat(e.target.value))}
                  style={{ width: "100%", padding: "7px 10px", background: "rgba(255,255,255,0.03)", border: "1px solid var(--tw-border)", borderRadius: "8px", color: "#fff" }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.75rem", color: "var(--tw-muted)", marginBottom: "3px" }}>Harga Modal (buyPrice)</label>
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
                  <th style={{ padding: "10px" }}>Kategori</th>
                  <th style={{ padding: "10px" }}>Stok / Satuan</th>
                  <th style={{ padding: "10px" }}>Retail</th>
                  <th style={{ padding: "10px" }}>Grosir</th>
                  <th style={{ padding: "10px", textAlign: "center" }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: "40px", textAlign: "center", color: "var(--tw-muted)" }}>
                      Belum ada master SKU terdaftar.
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((p, idx) => {
                    const codeVal = p.skuCode || p.skucode;
                    const retailVal = p.retailPrice !== undefined ? p.retailPrice : p.retailprice;
                    const wholesaleVal = p.wholesalePrice !== undefined ? p.wholesalePrice : p.wholesaleprice;

                    return (
                      <tr key={idx} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                        <td style={{ padding: "10px", fontWeight: "bold", color: "#38bdf8" }}>{codeVal}</td>
                        <td style={{ padding: "10px", color: "#fff" }}>{p.name}</td>
                        <td style={{ padding: "10px", color: "var(--tw-muted)", fontSize: "0.78rem" }}>{p.category || "Sembako"}</td>
                        <td style={{ padding: "10px", color: "#38bdf8", fontWeight: "bold" }}>
                          {p.stock !== undefined ? p.stock : 0} <span style={{ fontSize: "0.7rem", color: "var(--tw-muted)", fontWeight: "normal" }}>({p.unit || "kg"})</span>
                        </td>
                        <td style={{ padding: "10px", color: "#10b981" }}>Rp {(retailVal || 0).toLocaleString("id-ID")}</td>
                        <td style={{ padding: "10px", color: "#f59e0b" }}>Rp {(wholesaleVal || 0).toLocaleString("id-ID")}</td>
                        <td style={{ padding: "10px", textAlign: "center", display: "flex", justifyContent: "center", gap: "6px" }}>
                          <button
                            onClick={() => handleEditRow(p)}
                            style={{ padding: "4px 8px", background: "rgba(56, 189, 248, 0.15)", color: "#38bdf8", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "0.75rem", fontWeight: "bold" }}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(codeVal)}
                            style={{ padding: "4px 8px", background: "rgba(239, 68, 68, 0.15)", color: "#ef4444", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "0.75rem", fontWeight: "bold" }}
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