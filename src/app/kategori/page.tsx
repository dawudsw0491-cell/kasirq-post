"use client";

import { useState, useEffect, useRef } from "react";

export default function KodeBarangPage() {
  const [isOnline, setIsOnline] = useState(true);
  
  // State Form SKU
  const [skuCode, setSkuCode] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Umum");
  const [supplier, setSupplier] = useState("-");
  const [buyPrice, setBuyPrice] = useState<number | "">("");
  const [sellPrice, setSellPrice] = useState<number | "">("");
  
  const [skuList, setSkuList] = useState<any[]>([]);
  const [message, setMessage] = useState("");
  const [isFound, setIsFound] = useState(false);

  const nameInputRef = useRef<HTMLInputElement>(null);
  const scanInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const savedSku = localStorage.getItem("tw_master_sku");
    if (savedSku) {
      try {
        setSkuList(JSON.parse(savedSku));
      } catch (e) {
        setSkuList([]);
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

  // Handler saat barcode di-scan atau diketik lalu Enter
  const handleScanBarcode = (code: string) => {
    const trimmedCode = code.trim();
    if (!trimmedCode) return;

    setSkuCode(trimmedCode);

    // Cek apakah barcode sudah terdaftar di Master SKU
    const existingProduct = skuList.find((item) => item.skuCode === trimmedCode);
    if (existingProduct) {
      setName(existingProduct.name);
      setCategory(existingProduct.category || "Umum");
      setSupplier(existingProduct.supplier || "-");
      setBuyPrice(existingProduct.buyPrice);
      setSellPrice(existingProduct.sellPrice);
      setIsFound(true);
      setMessage(`Barcode ditemukan! Memuat data produk: ${existingProduct.name}`);
    } else {
      setIsFound(false);
      setName("");
      setBuyPrice("");
      setSellPrice("");
      setMessage(`Barcode baru (${trimmedCode}). Silakan lengkapi data untuk registrasi.`);
      setTimeout(() => nameInputRef.current?.focus(), 100);
    }
  };

  const handleGenerateUniqueCode = () => {
    const randomCode = "SKU-" + Math.floor(100000 + Math.random() * 900000);
    handleScanBarcode(randomCode);
  };

  const handleSaveSku = (e: React.FormEvent) => {
    e.preventDefault();
    if (!skuCode || !name || buyPrice === "" || sellPrice === "") {
      alert("Mohon lengkapi Kode SKU, Nama Barang, Harga Modal, dan Harga Jual!");
      return;
    }

    const newSkuItem = {
      id: Date.now(),
      skuCode,
      name,
      category,
      supplier,
      buyPrice: Number(buyPrice),
      sellPrice: Number(sellPrice),
    };

    // Filter jika sudah ada update, atau masukkan baru
    const filteredList = skuList.filter((item) => item.skuCode !== skuCode);
    const updatedSkuList = [newSkuItem, ...filteredList];
    setSkuList(updatedSkuList);
    localStorage.setItem("tw_master_sku", JSON.stringify(updatedSkuList));

    // Sinkronisasi otomatis ke inventaris produk (menu Barang)
    const savedProducts = JSON.parse(localStorage.getItem("tw_products") || "[]");
    const filteredProducts = savedProducts.filter((p: any) => p.skuCode !== skuCode);
    
    const newProductItem = {
      id: newSkuItem.id,
      skuCode,
      name,
      category,
      buyPrice: Number(buyPrice),
      sellPrice: Number(sellPrice),
      stock: 0, // Stok awal diatur lewat menu pembelian/restock
    };
    const updatedProducts = [newProductItem, ...filteredProducts];
    localStorage.setItem("tw_products", JSON.stringify(updatedProducts));

    window.dispatchEvent(new Event("storage"));
    setMessage(isFound ? "Data produk berhasil diperbarui!" : "Kode Barang baru berhasil diregistrasi!");
    
    setSkuCode("");
    setName("");
    setBuyPrice("");
    setSellPrice("");
    setIsFound(false);
    setTimeout(() => {
      setMessage("");
      scanInputRef.current?.focus();
    }, 3000);
  };

  return (
    <div className="tw-main" style={{ animation: "fadeIn 0.3s ease-in-out", width: "100%", boxSizing: "border-box" }}>
      <header className="tw-topbar">
        <div className="tw-breadcrumb">
          <strong>Registrasi Master Kode Barang &amp; Scan Barcode</strong>
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

      <div className="tw-content" style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: "20px", padding: "20px" }}>
        
        {/* FORM INPUT & SCANNER */}
        <div className="tw-card" style={{ display: "flex", flexDirection: "column", gap: "16px", height: "fit-content" }}>
          <h3 className="tw-card-title">Scan / Registrasi Barcode Produk</h3>

          {message && (
            <div style={{ padding: "10px", background: isFound ? "rgba(56, 189, 248, 0.15)" : "rgba(16, 185, 129, 0.15)", color: "#38bdf8", borderRadius: "8px", fontSize: "0.85rem" }}>
              ℹ️ {message}
            </div>
          )}

          <form onSubmit={handleSaveSku} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.8rem", color: "var(--tw-muted)", marginBottom: "4px" }}>
                Kotak Scan Barcode <span style={{ color: "#38bdf8" }}>(Arahkan alat scan ke sini)</span>
              </label>
              <div style={{ display: "flex", gap: "8px" }}>
                <input
                  ref={scanInputRef}
                  type="text"
                  placeholder="Klik &amp; scan barcode produk..."
                  value={skuCode}
                  onChange={(e) => setSkuCode(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleScanBarcode(skuCode);
                    }
                  }}
                  autoFocus
                  style={{ flex: 1, padding: "10px 12px", background: "rgba(2, 132, 199, 0.08)", border: "1px solid #0284c7", fontWeight: "bold", color: "#38bdf8" }}
                />
                <button
                  type="button"
                  onClick={handleGenerateUniqueCode}
                  title="Buat Kode Unik Otomatis"
                  style={{
                    background: "#0284c7",
                    color: "#fff",
                    border: "none",
                    borderRadius: "8px",
                    padding: "0 12px",
                    fontSize: "0.75rem",
                    fontWeight: "bold",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                  }}
                >
                  ✨ Buat Kode Unik
                </button>
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.8rem", color: "var(--tw-muted)", marginBottom: "4px" }}>Nama Barang</label>
              <input
                ref={nameInputRef}
                type="text"
                placeholder="Contoh: Kaset Vapes / Charger..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{ width: "100%" }}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", color: "var(--tw-muted)", marginBottom: "4px" }}>Kategori</label>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  style={{ width: "100%" }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", color: "var(--tw-muted)", marginBottom: "4px" }}>Supplier</label>
                <input
                  type="text"
                  value={supplier}
                  onChange={(e) => setSupplier(e.target.value)}
                  style={{ width: "100%" }}
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", color: "var(--tw-muted)", marginBottom: "4px" }}>Harga Modal (Rp)</label>
                <input
                  type="number"
                  placeholder="0"
                  value={buyPrice}
                  onChange={(e) => setBuyPrice(e.target.value === "" ? "" : Number(e.target.value))}
                  style={{ width: "100%" }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", color: "var(--tw-muted)", marginBottom: "4px" }}>Harga Jual (Rp)</label>
                <input
                  type="number"
                  placeholder="0"
                  value={sellPrice}
                  onChange={(e) => setSellPrice(e.target.value === "" ? "" : Number(e.target.value))}
                  style={{ width: "100%" }}
                />
              </div>
            </div>

            <button type="submit" className="tw-btn tw-btn-primary" style={{ padding: "12px", fontWeight: "bold", marginTop: "8px" }}>
              {isFound ? "Perbarui Data Produk" : "Registrasi Kode Barang Baru"}
            </button>
          </form>
        </div>

        {/* TABEL DATABASE */}
        <div className="tw-card" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 className="tw-card-title" style={{ margin: 0 }}>Database Master SKU Terdaftar ({skuList.length})</h3>
            <span style={{ fontSize: "0.75rem", color: "var(--tw-muted)" }}>Terintegrasi dengan Kasir &amp; Stok</span>
          </div>

          <div style={{ overflowX: "auto", maxHeight: "450px", overflowY: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem", textAlign: "left" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--tw-border)", color: "var(--tw-muted)" }}>
                  <th style={{ padding: "10px" }}>Kode SKU / Barcode</th>
                  <th style={{ padding: "10px" }}>Nama Barang</th>
                  <th style={{ padding: "10px" }}>Kategori</th>
                  <th style={{ padding: "10px" }}>Harga Jual</th>
                </tr>
              </thead>
              <tbody>
                {skuList.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ padding: "30px", textAlign: "center", color: "var(--tw-muted)" }}>
                      Belum ada Kode Barang terdaftar. Silakan scan produk Anda.
                    </td>
                  </tr>
                ) : (
                  skuList.map((item, index) => (
                    <tr key={index} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                      <td style={{ padding: "10px", fontWeight: "bold", color: "#38bdf8" }}>{item.skuCode}</td>
                      <td style={{ padding: "10px", color: "#fff" }}>{item.name}</td>
                      <td style={{ padding: "10px", color: "var(--tw-muted)" }}>{item.category}</td>
                      <td style={{ padding: "10px", color: "#10b981" }}>Rp {item.sellPrice.toLocaleString("id-ID")}</td>
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