"use client";

import { useState, useEffect, useRef } from "react";

export default function KasirPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [scanBuffer, setScanBuffer] = useState("");
  const [payAmount, setPayAmount] = useState<number | "">("");
  const [paymentMethod, setPaymentMethod] = useState<string>("cash");
  const [customerName, setCustomerName] = useState("");
  const [isOnline, setIsOnline] = useState(true);
  const [message, setMessage] = useState("");

  // State untuk Modal Pengaturan Takaran & Level Harga Item Curah
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [modalPriceType, setModalPriceType] = useState<"retail" | "wholesale">("retail");
  const [qtyMode, setQtyMode] = useState("1"); // "1/5", "1/4", "1/2", "1", "2", "custom"
  const [customQty, setCustomQty] = useState("1");

  const lastKeyTimeRef = useRef<number>(0);

  const loadProducts = () => {
    const saved = localStorage.getItem("tw_products");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const activeOnly = parsed.filter((p: any) => p.isActive !== false && p.status !== "inactive");
        setProducts(activeOnly);
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

    const handleStorageChange = () => {
      loadProducts();
    };
    window.addEventListener("storage", handleStorageChange);

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === "INPUT" && ((e.target as HTMLElement).getAttribute("type") === "number" || (e.target as HTMLElement).getAttribute("type") === "text")) {
        return;
      }

      const currentTime = Date.now();
      lastKeyTimeRef.current = currentTime;

      if (e.key === "Enter") {
        if (scanBuffer.trim().length > 0) {
          processScannedCode(scanBuffer.trim());
          setScanBuffer("");
        }
      } else if (e.key.length === 1) {
        setScanBuffer((prev) => prev + e.key);
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("keydown", handleGlobalKeyDown);
    };
  }, [scanBuffer]);

  const getProductPrice = (product: any, type: "retail" | "wholesale") => {
    if (type === "wholesale") {
      return Number(product.wholesalePrice || product.retailPrice || product.sellPrice || 0);
    }
    return Number(product.retailPrice || product.sellPrice || 0);
  };

  // Membuka Modal saat produk diklik di katalog / discan
  const handleOpenModal = (product: any) => {
    setSelectedProduct(product);
    setModalPriceType("retail");
    setQtyMode("1");
    setCustomQty("1");
    setIsModalOpen(true);
  };

  // Kalkulasi Qty dan Harga Berdasarkan Pilihan Modal (Mendukung Patokan Owner atau Proporsional)
  const calculateModalResult = () => {
    if (!selectedProduct) return { qty: 1, unitPrice: 0, totalPrice: 0, buyPriceUnit: 0 };

    const baseBuy = Number(selectedProduct.buyPrice || 0);
    const baseRetail = Number(selectedProduct.retailPrice || selectedProduct.sellPrice || 0);
    const baseWholesale = Number(selectedProduct.wholesalePrice || baseRetail);
    const activeBaseUnit = modalPriceType === "wholesale" ? baseWholesale : baseRetail;

    let qty = 1;
    let totalPrice = activeBaseUnit;

    if (qtyMode === "1/5") {
      qty = 0.2;
      totalPrice = selectedProduct.priceFifth && Number(selectedProduct.priceFifth) > 0
        ? Number(selectedProduct.priceFifth)
        : activeBaseUnit * 0.2;
    } else if (qtyMode === "1/4") {
      qty = 0.25;
      totalPrice = selectedProduct.priceQuarter && Number(selectedProduct.priceQuarter) > 0
        ? Number(selectedProduct.priceQuarter)
        : activeBaseUnit * 0.25;
    } else if (qtyMode === "1/2") {
      qty = 0.5;
      totalPrice = selectedProduct.priceHalf && Number(selectedProduct.priceHalf) > 0
        ? Number(selectedProduct.priceHalf)
        : activeBaseUnit * 0.5;
    } else if (qtyMode === "1") {
      qty = 1;
      totalPrice = activeBaseUnit;
    } else if (qtyMode === "2") {
      qty = 2;
      totalPrice = activeBaseUnit * 2;
    } else {
      qty = parseFloat(customQty) || 1;
      totalPrice = activeBaseUnit * qty;
    }

    const unitPrice = qty > 0 ? totalPrice / qty : activeBaseUnit;
    const buyPriceUnit = baseBuy; // Harga modal per satuan dasar untuk kalkulasi margin profit di dashboard

    return { qty, unitPrice, totalPrice, buyPriceUnit };
  };

  // Konfirmasi Tambah ke Keranjang dari Modal
  const handleConfirmAddToCart = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    const { qty, unitPrice, totalPrice, buyPriceUnit } = calculateModalResult();

    setCart((prevCart) => {
      // Cek apakah item dengan SKU dan mode harga yang sama sudah ada di keranjang
      const existingIndex = prevCart.findIndex(
        (item) => item.skuCode === selectedProduct.skuCode && item.priceMode === modalPriceType
      );

      if (existingIndex > -1) {
        const updated = [...prevCart];
        const currentItem = updated[existingIndex];
        const newQty = Number((currentItem.qty + qty).toFixed(4));
        updated[existingIndex] = {
          ...currentItem,
          qty: newQty,
          sellPrice: unitPrice,
          buyPrice: buyPriceUnit,
        };
        return updated;
      } else {
        return [
          ...prevCart,
          {
            ...selectedProduct,
            qty,
            sellPrice: unitPrice,
            buyPrice: buyPriceUnit,
            priceMode: modalPriceType,
          },
        ];
      }
    });

    setMessage(`✓ ${selectedProduct.name} (${qty} ${selectedProduct.unit || "kg"}) ditambahkan ke keranjang`);
    setTimeout(() => setMessage(""), 2500);
    setIsModalOpen(false);
    setSelectedProduct(null);
  };

  const processScannedCode = (code: string) => {
    const found = products.find(
      (p) =>
        p.skuCode?.toLowerCase() === code.toLowerCase() ||
        p.name?.toLowerCase() === code.toLowerCase()
    );

    if (found) {
      handleOpenModal(found);
    } else {
      setMessage(`❌ SKU/Barang "${code}" tidak ditemukan atau non-aktif`);
      setTimeout(() => setMessage("3000"), 3000);
    }
  };

  const handleItemPriceModeChange = (skuCode: string, mode: "retail" | "wholesale") => {
    setCart((prevCart) =>
      prevCart.map((item) => {
        if (item.skuCode === skuCode) {
          const newPrice = getProductPrice(item, mode);
          return { ...item, priceMode: mode, sellPrice: newPrice };
        }
        return item;
      })
    );
  };

  const totalCart = cart.reduce((sum, item) => sum + (item.sellPrice || 0) * item.qty, 0);
  const changeAmount = paymentMethod === "cash" && typeof payAmount === "number" && payAmount >= totalCart ? payAmount - totalCart : 0;

  const handleCheckout = () => {
    if (cart.length === 0) {
      alert("Keranjang masih kosong! Silakan pilih barang terlebih dahulu.");
      return;
    }

    if (paymentMethod === "cash") {
      if (typeof payAmount !== "number" || payAmount < totalCart) {
        alert("Nominal pembayaran tunai kurang dari total belanja!");
        return;
      }
    } else if (paymentMethod === "piutang") {
      if (!customerName.trim()) {
        alert("Mohon masukkan nama pelanggan untuk transaksi Piutang!");
        return;
      }
    }

    const transactionId = "TRX-" + Date.now();
    const transaction = {
      id: transactionId,
      date: new Date().toISOString(),
      items: cart,
      total: totalCart,
      paymentMethod,
      customerName: paymentMethod === "piutang" ? customerName.trim() : "Umum",
      pay: paymentMethod === "cash" ? payAmount : totalCart,
      change: paymentMethod === "cash" ? changeAmount : 0,
      status: paymentMethod === "piutang" ? "Unpaid (Piutang)" : "Paid",
    };

    const savedHistory = JSON.parse(localStorage.getItem("tw_sales_history") || "[]");
    localStorage.setItem("tw_sales_history", JSON.stringify([transaction, ...savedHistory]));

    if (paymentMethod === "piutang") {
      const savedDebts = JSON.parse(localStorage.getItem("kasirq_piutang") || "[]");
      const newDebtRecord = {
        id: "PIU-" + Date.now(),
        trxId: transactionId,
        customerName: customerName.trim(),
        amount: totalCart,
        paidAmount: 0,
        remainingAmount: totalCart,
        date: new Date().toISOString(),
        status: "Belum Lunas",
      };
      localStorage.setItem("kasirq_piutang", JSON.stringify([newDebtRecord, ...savedDebts]));
    }

    const allProductsRaw = JSON.parse(localStorage.getItem("tw_products") || "[]");
    const updatedProducts = allProductsRaw.map((p: any) => {
      const cartItem = cart.find((c) => c.skuCode === p.skuCode);
      if (cartItem) {
        const currentStock = Number(p.stock || 0);
        const newStock = Math.max(0, currentStock - cartItem.qty);
        return { ...p, stock: Number(newStock.toFixed(4)) };
      }
      return p;
    });

    localStorage.setItem("tw_products", JSON.stringify(updatedProducts));
    window.dispatchEvent(new Event("storage"));

    const activeOnly = updatedProducts.filter((p: any) => p.isActive !== false && p.status !== "inactive");
    setProducts(activeOnly);

    setMessage(`✓ Transaksi Berhasil! Stok barang telah dipotong.`);
    setCart([]);
    setPayAmount("");
    setCustomerName("");
    setTimeout(() => setMessage(""), 4000);
  };

  const modalPreview = calculateModalResult();

  return (
    <div className="tw-main" style={{ animation: "fadeIn 0.3s ease-in-out", width: "100%", boxSizing: "border-box" }}>
      <header className="tw-topbar">
        <div className="tw-breadcrumb">
          <strong>KASIR POS</strong>
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

      <div className="tw-content" style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "20px", padding: "20px" }}>
        
        {/* KOLOM KIRI: KATALOG PRODUK */}
        <div className="tw-card" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
            <h3 className="tw-card-title" style={{ margin: 0 }}>Katalog Produk &amp; Barang Curah</h3>
          </div>

          {message && (
            <div style={{ padding: "10px", background: message.includes("❌") ? "rgba(239, 68, 68, 0.15)" : "rgba(16, 185, 129, 0.15)", color: message.includes("❌") ? "#ef4444" : "#10b981", borderRadius: "8px", fontSize: "0.85rem", border: message.includes("❌") ? "1px solid rgba(239, 68, 68, 0.3)" : "1px solid rgba(16, 185, 129, 0.3)" }}>
              {message}
            </div>
          )}

          <div style={{ padding: "10px", background: "rgba(56, 189, 248, 0.03)", border: "1px dashed rgba(56, 189, 248, 0.4)", borderRadius: "8px" }}>
            <span style={{ fontSize: "0.75rem", color: "var(--tw-muted)" }}>
              💡 Klik produk di bawah untuk mengatur takaran (fraksi/desimal) serta memilih harga Retail atau Grosir.
            </span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: "10px", maxHeight: "380px", overflowY: "auto" }}>
            {products.length === 0 ? (
              <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "30px", color: "var(--tw-muted)" }}>
                Belum ada produk aktif tersedia.
              </div>
            ) : (
              products.map((p, idx) => (
                <div
                  key={idx}
                  onClick={() => handleOpenModal(p)}
                  style={{
                    padding: "12px",
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid var(--tw-border)",
                    borderRadius: "8px",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    gap: "6px"
                  }}
                >
                  <div>
                    <span style={{ fontSize: "0.65rem", color: "#38bdf8", fontWeight: "bold" }}>{p.skuCode}</span>
                    <strong style={{ fontSize: "0.85rem", color: "#fff", display: "block" }}>{p.name}</strong>
                    <span style={{ fontSize: "0.7rem", color: "var(--tw-muted)" }}>Stok: {p.stock} {p.unit || "kg"}</span>
                  </div>
                  <div>
                    <div style={{ fontSize: "0.75rem", color: "#10b981", fontWeight: "bold" }}>R: Rp {Number(p.retailPrice || p.sellPrice || 0).toLocaleString("id-ID")}</div>
                    <div style={{ fontSize: "0.75rem", color: "#f59e0b", fontWeight: "bold" }}>G: Rp {Number(p.wholesalePrice || 0).toLocaleString("id-ID")}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* KOLOM KANAN: KERANJANG & CHECKOUT */}
        <div className="tw-card" style={{ display: "flex", flexDirection: "column", gap: "16px", height: "fit-content" }}>
          <h3 className="tw-card-title">Keranjang Belanja</h3>

          <div style={{ maxHeight: "220px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "8px" }}>
            {cart.length === 0 ? (
              <div style={{ textAlign: "center", padding: "30px", color: "var(--tw-muted)", fontSize: "0.85rem" }}>
                Keranjang kosong.
              </div>
            ) : (
              cart.map((item, idx) => (
                <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 10px", background: "rgba(255,255,255,0.03)", borderRadius: "8px", gap: "10px" }}>
                  <div style={{ flex: 1 }}>
                    <strong style={{ fontSize: "0.8rem", color: "#fff", display: "block" }}>{item.name}</strong>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "2px" }}>
                      <small style={{ fontSize: "0.7rem", color: "var(--tw-muted)" }}>Qty: {item.qty} {item.unit || ""}</small>
                      <select
                        value={item.priceMode || "retail"}
                        onChange={(e) => handleItemPriceModeChange(item.skuCode, e.target.value as "retail" | "wholesale")}
                        style={{ fontSize: "0.65rem", padding: "2px 4px", background: "rgba(255,255,255,0.05)", border: "1px solid var(--tw-border)", borderRadius: "4px", color: "#38bdf8" }}
                      >
                        <option value="retail" style={{ background: "#090d16" }}>Retail</option>
                        <option value="wholesale" style={{ background: "#090d16" }}>Grosir</option>
                      </select>
                    </div>
                  </div>
                  <span style={{ fontSize: "0.8rem", fontWeight: "bold", color: "#10b981" }}>
                    Rp {((item.sellPrice || 0) * item.qty).toLocaleString("id-ID")}
                  </span>
                </div>
              ))
            )}
          </div>

          <div style={{ borderTop: "1px solid var(--tw-border)", paddingTop: "12px", display: "flex", flexDirection: "column", gap: "10px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "1.1rem", fontWeight: "bold" }}>
              <span>Total Belanja:</span>
              <span style={{ color: "#10b981" }}>Rp {totalCart.toLocaleString("id-ID")}</span>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.75rem", color: "var(--tw-muted)", marginBottom: "4px" }}>Metode Pembayaran</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px",
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid var(--tw-border)",
                  borderRadius: "8px",
                  color: "#fff",
                  fontSize: "0.85rem",
                  fontWeight: "bold",
                }}
              >
                <option value="cash" style={{ background: "#090d16" }}>💵 Cash (Tunai)</option>
                <option value="piutang" style={{ background: "#090d16" }}>📝 Piutang (Bon)</option>
                <option value="transfer" style={{ background: "#090d16" }}>💳 Transfer</option>
              </select>
            </div>

            {paymentMethod === "cash" ? (
              <>
                <div>
                  <label style={{ display: "block", fontSize: "0.75rem", color: "var(--tw-muted)", marginBottom: "4px" }}>Nominal Uang Tunai</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value === "" ? "" : Number(e.target.value))}
                    style={{ width: "100%", padding: "8px", background: "rgba(255,255,255,0.03)", border: "1px solid var(--tw-border)", borderRadius: "8px", color: "#fff" }}
                  />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem" }}>
                  <span style={{ color: "var(--tw-muted)" }}>Kembalian:</span>
                  <strong style={{ color: "#38bdf8" }}>Rp {changeAmount.toLocaleString("id-ID")}</strong>
                </div>
              </>
            ) : paymentMethod === "piutang" ? (
              <div>
                <label style={{ display: "block", fontSize: "0.75rem", color: "#ef4444", marginBottom: "4px" }}>Nama Pelanggan (Piutang / Bon)</label>
                <input
                  type="text"
                  placeholder="Masukkan nama pembeli..."
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  style={{ width: "100%", padding: "8px", background: "rgba(239, 68, 68, 0.05)", border: "1px solid #ef4444", borderRadius: "8px", color: "#fff" }}
                />
              </div>
            ) : null}

            <button
              onClick={handleCheckout}
              className="tw-btn tw-btn-primary"
              style={{
                padding: "12px",
                fontWeight: "bold",
                marginTop: "6px",
                cursor: "pointer",
                background: paymentMethod === "piutang" ? "#ef4444" : "#10b981",
              }}
            >
              Bayar
            </button>
          </div>
        </div>

      </div>

      {/* MODAL PENGATURAN TAKARAN & HARGA (RETAIL / GROSIR) */}
      {isModalOpen && selectedProduct && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", backgroundColor: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000 }}>
          <div style={{ backgroundColor: "#0b0d16", border: "1px solid var(--tw-border)", borderRadius: "12px", width: "420px", padding: "24px", boxShadow: "0 10px 30px rgba(0,0,0,0.8)" }}>
            <h3 style={{ color: "#FFFFFF", marginTop: 0, marginBottom: "4px", fontSize: "1.1rem" }}>Atur Takaran &amp; Harga</h3>
            <p style={{ color: "#38bdf8", fontSize: "0.85rem", fontWeight: "bold", marginBottom: "16px" }}>
              {selectedProduct.name} <span style={{ color: "var(--tw-muted)", fontWeight: "normal" }}>(Stok: {selectedProduct.stock} {selectedProduct.unit || "kg"})</span>
            </p>

            <form onSubmit={handleConfirmAddToCart} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {/* PILIHAN LEVEL HARGA (RETAIL VS GROSIR) */}
              <div>
                <label style={{ display: "block", fontSize: "0.75rem", color: "var(--tw-muted)", marginBottom: "6px" }}>Pilih Level Harga</label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                  <button
                    type="button"
                    onClick={() => setModalPriceType("retail")}
                    style={{
                      padding: "8px",
                      borderRadius: "6px",
                      border: modalPriceType === "retail" ? "1px solid #10b981" : "1px solid var(--tw-border)",
                      background: modalPriceType === "retail" ? "rgba(16, 185, 129, 0.15)" : "rgba(255,255,255,0.02)",
                      color: modalPriceType === "retail" ? "#10b981" : "var(--tw-muted)",
                      fontSize: "0.8rem",
                      fontWeight: "bold",
                      cursor: "pointer",
                    }}
                  >
                    Retail: Rp {Number(selectedProduct.retailPrice || selectedProduct.sellPrice || 0).toLocaleString("id-ID")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalPriceType("wholesale")}
                    style={{
                      padding: "8px",
                      borderRadius: "6px",
                      border: modalPriceType === "wholesale" ? "1px solid #f59e0b" : "1px solid var(--tw-border)",
                      background: modalPriceType === "wholesale" ? "rgba(245, 158, 11, 0.15)" : "rgba(255,255,255,0.02)",
                      color: modalPriceType === "wholesale" ? "#f59e0b" : "var(--tw-muted)",
                      fontSize: "0.8rem",
                      fontWeight: "bold",
                      cursor: "pointer",
                    }}
                  >
                    Grosir: Rp {Number(selectedProduct.wholesalePrice || 0).toLocaleString("id-ID")}
                  </button>
                </div>
              </div>

              {/* PILIHAN TAKARAN / PECAHAN CEPAT */}
              <div>
                <label style={{ display: "block", fontSize: "0.75rem", color: "var(--tw-muted)", marginBottom: "6px" }}>Pilih Takaran / Qty ({selectedProduct.unit || "kg"})</label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "6px", marginBottom: "8px" }}>
                  {[
                    { label: "1/5 (0.2)", val: "1/5" },
                    { label: "1/4 (0.25)", val: "1/4" },
                    { label: "1/2 (0.5)", val: "1/2" },
                    { label: "1 Penuh", val: "1" },
                    { label: "2 Penuh", val: "2" },
                    { label: "Custom", val: "custom" },
                  ].map((btn) => (
                    <button
                      key={btn.val}
                      type="button"
                      onClick={() => setQtyMode(btn.val)}
                      style={{
                        padding: "8px",
                        borderRadius: "6px",
                        border: qtyMode === btn.val ? "1px solid #38bdf8" : "1px solid var(--tw-border)",
                        background: qtyMode === btn.val ? "rgba(56, 189, 248, 0.2)" : "rgba(255,255,255,0.02)",
                        color: qtyMode === btn.val ? "#38bdf8" : "#fff",
                        fontSize: "0.75rem",
                        fontWeight: "bold",
                        cursor: "pointer",
                      }}
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>

                {qtyMode === "custom" && (
                  <input
                    type="number"
                    step="any"
                    autoFocus
                    placeholder="Masukkan jumlah bebas (misal: 1.5)"
                    value={customQty}
                    onChange={(e) => setCustomQty(e.target.value)}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", backgroundColor: "#090d16", border: "1px solid #38bdf8", color: "#FFF", fontSize: "0.9rem", boxSizing: "border-box" }}
                  />
                )}
              </div>

              {/* PREVIEW TOTAL HARGA */}
              <div style={{ padding: "12px", background: "rgba(255,255,255,0.03)", borderRadius: "8px", display: "flex", justifyContent: "space-between", alignItems: "center", border: "1px solid var(--tw-border)" }}>
                <div>
                  <span style={{ fontSize: "0.75rem", color: "var(--tw-muted)", display: "block" }}>Subtotal ({modalPriceType.toUpperCase()}):</span>
                  <strong style={{ fontSize: "0.85rem", color: "#38bdf8" }}>{modalPreview.qty} {selectedProduct.unit || "unit"}</strong>
                </div>
                <strong style={{ fontSize: "1.1rem", color: "#10b981" }}>
                  Rp {modalPreview.totalPrice.toLocaleString("id-ID")}
                </strong>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "4px" }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{ background: "transparent", border: "1px solid var(--tw-border)", color: "var(--tw-muted)", borderRadius: "6px", padding: "8px 14px", cursor: "pointer", fontSize: "0.8rem" }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  style={{ background: "#0284c7", border: "none", color: "#FFFFFF", borderRadius: "6px", padding: "8px 16px", fontWeight: "bold", cursor: "pointer", fontSize: "0.8rem" }}
                >
                  Masukkan Keranjang
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}