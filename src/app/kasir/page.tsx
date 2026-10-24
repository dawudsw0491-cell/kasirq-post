"use client";

import { useState, useEffect, useRef } from "react";

export default function KasirPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [scanBuffer, setScanBuffer] = useState("");
  const [payAmount, setPayAmount] = useState<number | "">("");
  const [priceType, setPriceType] = useState<"retail" | "wholesale">("retail");
  const [paymentMethod, setPaymentMethod] = useState<"tunai" | "bon">("tunai");
  const [customerName, setCustomerName] = useState("");
  const [isOnline, setIsOnline] = useState(true);
  const [message, setMessage] = useState("");
  const [lastScannedItem, setLastScannedItem] = useState<any>(null);
  const lastKeyTimeRef = useRef<number>(0);

  useEffect(() => {
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

  const processScannedCode = (code: string) => {
    const found = products.find(
      (p) =>
        p.skuCode?.toLowerCase() === code.toLowerCase() ||
        p.name?.toLowerCase() === code.toLowerCase()
    );

    if (found) {
      const activePrice = getProductPrice(found, priceType);
      let currentQty = 1;

      setCart((prevCart) => {
        const existing = prevCart.find((item) => item.skuCode === found.skuCode);
        if (existing) {
          currentQty = existing.qty + 1;
          return prevCart.map((item) =>
            item.skuCode === found.skuCode ? { ...item, qty: currentQty } : item
          );
        } else {
          return [...prevCart, { ...found, qty: 1, sellPrice: activePrice, priceMode: priceType }];
        }
      });

      setLastScannedItem({
        ...found,
        sellPrice: activePrice,
        priceMode: priceType,
        qty: currentQty,
        totalAmount: activePrice * currentQty,
      });

      setMessage(`✓ ${found.name} masuk keranjang (${priceType === "wholesale" ? "Grosir" : "Retail"})`);
      setTimeout(() => setMessage(""), 2000);
    } else {
      setMessage(`❌ SKU/Barang "${code}" tidak ditemukan atau non-aktif`);
      setTimeout(() => setMessage(""), 3000);
    }
  };

  const addToCartManual = (product: any) => {
    const activePrice = getProductPrice(product, priceType);
    let currentQty = 1;

    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.skuCode === product.skuCode);
      if (existing) {
        currentQty = existing.qty + 1;
        return prevCart.map((item) =>
          item.skuCode === product.skuCode ? { ...item, qty: currentQty } : item
        );
      } else {
        return [...prevCart, { ...product, qty: 1, sellPrice: activePrice, priceMode: priceType }];
      }
    });

    setLastScannedItem({
      ...product,
      sellPrice: activePrice,
      priceMode: priceType,
      qty: currentQty,
      totalAmount: activePrice * currentQty,
    });
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
  const changeAmount = paymentMethod === "tunai" && typeof payAmount === "number" && payAmount >= totalCart ? payAmount - totalCart : 0;

  const handleCheckout = () => {
    if (cart.length === 0) {
      alert("Keranjang masih kosong! Silakan scan barang terlebih dahulu.");
      return;
    }

    if (paymentMethod === "tunai") {
      if (typeof payAmount !== "number" || payAmount < totalCart) {
        alert("Nominal pembayaran tunai kurang dari total belanja!");
        return;
      }
    } else if (paymentMethod === "bon") {
      if (!customerName.trim()) {
        alert("Mohon masukkan nama pelanggan untuk transaksi Bon!");
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
      customerName: paymentMethod === "bon" ? customerName.trim() : "Umum",
      pay: paymentMethod === "tunai" ? payAmount : 0,
      change: paymentMethod === "tunai" ? changeAmount : 0,
      status: paymentMethod === "bon" ? "Unpaid (Piutang)" : "Paid",
    };

    const savedHistory = JSON.parse(localStorage.getItem("tw_sales_history") || "[]");
    localStorage.setItem("tw_sales_history", JSON.stringify([transaction, ...savedHistory]));

    if (paymentMethod === "bon") {
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
        return { ...p, stock: newStock };
      }
      return p;
    });

    localStorage.setItem("tw_products", JSON.stringify(updatedProducts));
    window.dispatchEvent(new Event("storage"));

    const activeOnly = updatedProducts.filter((p: any) => p.isActive !== false && p.status !== "inactive");
    setProducts(activeOnly);

    setMessage(`✓ Transaksi ${paymentMethod === "bon" ? "BON (Piutang)" : "TUNAI"} Berhasil! Stok barang telah dipotong.`);
    setCart([]);
    setPayAmount("");
    setCustomerName("");
    setLastScannedItem(null);
    setTimeout(() => setMessage(""), 4000);
  };

  return (
    <div className="tw-main" style={{ animation: "fadeIn 0.3s ease-in-out", width: "100%", boxSizing: "border-box" }}>
      <header className="tw-topbar">
        <div className="tw-breadcrumb">
          <strong>Kasir POS (Tunai, Bon &amp; Potong Stok)</strong>
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
        
        <div className="tw-card" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
            <h3 className="tw-card-title" style={{ margin: 0 }}>Scanner &amp; Mode Harga</h3>

            <div style={{ display: "flex", gap: "8px", background: "rgba(255,255,255,0.03)", padding: "4px", borderRadius: "8px", border: "1px solid var(--tw-border)" }}>
              <button
                type="button"
                onClick={() => setPriceType("retail")}
                style={{
                  padding: "6px 12px",
                  background: priceType === "retail" ? "#0284c7" : "transparent",
                  color: priceType === "retail" ? "#fff" : "var(--tw-muted)",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "0.75rem",
                  fontWeight: "bold",
                }}
              >
                🏷️ Harga Retail
              </button>
              <button
                type="button"
                onClick={() => setPriceType("wholesale")}
                style={{
                  padding: "6px 12px",
                  background: priceType === "wholesale" ? "#f59e0b" : "transparent",
                  color: priceType === "wholesale" ? "#fff" : "var(--tw-muted)",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "0.75rem",
                  fontWeight: "bold",
                }}
              >
                📦 Harga Grosir
              </button>
            </div>
          </div>

          {message && (
            <div style={{ padding: "10px", background: message.includes("❌") ? "rgba(239, 68, 68, 0.15)" : "rgba(16, 185, 129, 0.15)", color: message.includes("❌") ? "#ef4444" : "#10b981", borderRadius: "8px", fontSize: "0.85rem", border: message.includes("❌") ? "1px solid rgba(239, 68, 68, 0.3)" : "1px solid rgba(16, 185, 129, 0.3)" }}>
              {message}
            </div>
          )}

          {lastScannedItem && (
            <div style={{ padding: "12px", background: "rgba(56, 189, 248, 0.08)", border: "1px solid #38bdf8", borderRadius: "10px", display: "flex", flexDirection: "column", gap: "6px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.7rem", color: "#38bdf8", textTransform: "uppercase", fontWeight: "bold" }}>📦 Detail SKU Terakhir Discan ({lastScannedItem.priceMode === "wholesale" ? "Grosir" : "Retail"})</span>
                <span style={{ fontSize: "0.7rem", color: "var(--tw-muted)" }}>SKU: {lastScannedItem.skuCode}</span>
              </div>
              <div style={{ fontSize: "0.95rem", fontWeight: "bold", color: "#fff" }}>{lastScannedItem.name}</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px", marginTop: "4px", fontSize: "0.8rem" }}>
                <div style={{ background: "rgba(255,255,255,0.03)", padding: "6px", borderRadius: "6px" }}>
                  <span style={{ color: "var(--tw-muted)", display: "block", fontSize: "0.65rem" }}>Harga Terpilih</span>
                  <strong style={{ color: "#10b981" }}>Rp {lastScannedItem.sellPrice.toLocaleString("id-ID")}</strong>
                </div>
                <div style={{ background: "rgba(255,255,255,0.03)", padding: "6px", borderRadius: "6px" }}>
                  <span style={{ color: "var(--tw-muted)", display: "block", fontSize: "0.65rem" }}>Qty Scan</span>
                  <strong style={{ color: "#38bdf8" }}>{lastScannedItem.qty} {lastScannedItem.unit || "pcs"}</strong>
                </div>
                <div style={{ background: "rgba(255,255,255,0.03)", padding: "6px", borderRadius: "6px" }}>
                  <span style={{ color: "var(--tw-muted)", display: "block", fontSize: "0.65rem" }}>Total Amount</span>
                  <strong style={{ color: "#f59e0b" }}>Rp {lastScannedItem.totalAmount.toLocaleString("id-ID")}</strong>
                </div>
              </div>
            </div>
          )}

          <div style={{ padding: "10px", background: "rgba(56, 189, 248, 0.03)", border: "1px dashed rgba(56, 189, 248, 0.4)", borderRadius: "8px" }}>
            <span style={{ fontSize: "0.75rem", color: "var(--tw-muted)" }}>
              💡 Scan barcode produk atau klik dari daftar di bawah.
            </span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "10px", maxHeight: "260px", overflowY: "auto" }}>
            {products.length === 0 ? (
              <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "30px", color: "var(--tw-muted)" }}>
                Belum ada produk aktif tersedia.
              </div>
            ) : (
              products.map((p, idx) => (
                <div
                  key={idx}
                  onClick={() => addToCartManual(p)}
                  style={{
                    padding: "10px",
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid var(--tw-border)",
                    borderRadius: "8px",
                    cursor: "pointer",
                  }}
                >
                  <strong style={{ fontSize: "0.8rem", color: "#fff", display: "block", marginBottom: "2px" }}>{p.name}</strong>
                  <span style={{ fontSize: "0.75rem", color: "#38bdf8", display: "block" }}>SKU: {p.skuCode}</span>
                  <span style={{ fontSize: "0.7rem", color: "#10b981" }}>Rp {Number(p.retailPrice || p.sellPrice || 0).toLocaleString("id-ID")}</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="tw-card" style={{ display: "flex", flexDirection: "column", gap: "16px", height: "fit-content" }}>
          <h3 className="tw-card-title">Keranjang Belanja</h3>

          <div style={{ maxHeight: "200px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "8px" }}>
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
                      <small style={{ fontSize: "0.7rem", color: "var(--tw-muted)" }}>{item.qty} {item.unit || "pcs"}</small>
                      <select
                        value={item.priceMode || "retail"}
                        onChange={(e) => handleItemPriceModeChange(item.skuCode, e.target.value as "retail" | "wholesale")}
                        style={{ fontSize: "0.65rem", padding: "2px 4px", background: "rgba(255,255,255,0.05)", border: "1px solid var(--tw-border)", borderRadius: "4px", color: "#38bdf8" }}
                      >
                        <option value="retail" style={{ background: "#090d16" }}>Retail: Rp {Number(item.retailPrice || item.sellPrice || 0).toLocaleString("id-ID")}</option>
                        <option value="wholesale" style={{ background: "#090d16" }}>Grosir: Rp {Number(item.wholesalePrice || item.retailPrice || 0).toLocaleString("id-ID")}</option>
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
              <label style={{ display: "block", fontSize: "0.75rem", color: "var(--tw-muted)", marginBottom: "4px" }}>Pilih Jenis Pembayaran</label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                <button
                  type="button"
                  onClick={() => setPaymentMethod("tunai")}
                  style={{
                    padding: "8px",
                    background: paymentMethod === "tunai" ? "#10b981" : "rgba(255,255,255,0.03)",
                    color: paymentMethod === "tunai" ? "#fff" : "var(--tw-muted)",
                    border: "1px solid var(--tw-border)",
                    borderRadius: "8px",
                    fontWeight: "bold",
                    fontSize: "0.8rem",
                    cursor: "pointer",
                  }}
                >
                  💵 Tunai / Cash
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod("bon")}
                  style={{
                    padding: "8px",
                    background: paymentMethod === "bon" ? "#ef4444" : "rgba(255,255,255,0.03)",
                    color: paymentMethod === "bon" ? "#fff" : "var(--tw-muted)",
                    border: "1px solid var(--tw-border)",
                    borderRadius: "8px",
                    fontWeight: "bold",
                    fontSize: "0.8rem",
                    cursor: "pointer",
                  }}
                >
                  📝 Bon / Piutang
                </button>
              </div>
            </div>

            {paymentMethod === "tunai" ? (
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
            ) : (
              <div>
                <label style={{ display: "block", fontSize: "0.75rem", color: "#ef4444", marginBottom: "4px" }}>Nama Pelanggan (Hutang / Bon)</label>
                <input
                  type="text"
                  placeholder="Masukkan nama pembeli..."
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  style={{ width: "100%", padding: "8px", background: "rgba(239, 68, 68, 0.05)", border: "1px solid #ef4444", borderRadius: "8px", color: "#fff" }}
                />
              </div>
            )}

            <button
              onClick={handleCheckout}
              className="tw-btn tw-btn-primary"
              style={{
                padding: "12px",
                fontWeight: "bold",
                marginTop: "6px",
                cursor: "pointer",
                background: paymentMethod === "bon" ? "#ef4444" : "#0284c7",
              }}
            >
              {paymentMethod === "bon" ? "Submit Transaksi Bon (Catat Piutang)" : "Submit &amp; Potong Stok"}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}