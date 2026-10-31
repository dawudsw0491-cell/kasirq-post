"use client";

import { useState, useEffect, useRef } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { supabase } from "@/lib/supabase";

export default function KasirPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [scanBuffer, setScanBuffer] = useState("");
  const [payAmount, setPayAmount] = useState<number | "">("");
  const [paymentMethod, setPaymentMethod] = useState<string>("cash");
  const [customerName, setCustomerName] = useState("");
  const [isOnline, setIsOnline] = useState(true);
  const [message, setMessage] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [modalPriceType, setModalPriceType] = useState<"retail" | "wholesale">("retail");
  const [qtyMode, setQtyMode] = useState("1");
  const [customQty, setCustomQty] = useState("1");

  const [isKasirScanning, setIsKasirScanning] = useState(false);
  const kasirScannerRef = useRef<Html5QrcodeScanner | null>(null);

  const lastKeyTimeRef = useRef<number>(0);

  const loadProducts = async () => {
    try {
      const { data, error } = await supabase.from("tw_products").select("*");
      if (!error && data) {
        const activeOnly = data.filter((p: any) => p.isActive !== false && p.status !== "inactive");
        setProducts(activeOnly);
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

    const channel = supabase
      .channel("public:tw_products_kasir")
      .on("postgres_changes", { event: "*", schema: "public", table: "tw_products" }, () => {
        loadProducts();
      })
      .subscribe();

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("keydown", handleGlobalKeyDown);
      if (kasirScannerRef.current) {
        kasirScannerRef.current.clear().catch(() => {});
      }
      supabase.removeChannel(channel);
    };
  }, [scanBuffer]);

  const toggleKasirCamera = () => {
    if (isKasirScanning) {
      if (kasirScannerRef.current) {
        kasirScannerRef.current.clear().catch(() => {});
        kasirScannerRef.current = null;
      }
      setIsKasirScanning(false);
    } else {
      setIsKasirScanning(true);
      setTimeout(() => {
        const scanner = new Html5QrcodeScanner(
          "reader-kasir",
          { fps: 10, qrbox: { width: 250, height: 150 } },
          false
        );
        scanner.render(
          (decodedText) => {
            processScannedCode(decodedText.trim());
            scanner.clear().catch(() => {});
            kasirScannerRef.current = null;
            setIsKasirScanning(false);
          },
          (error) => {}
        );
        kasirScannerRef.current = scanner;
      }, 150);
    }
  };

  const getProductPrice = (product: any, type: "retail" | "wholesale") => {
    if (type === "wholesale") {
      return Number(product.wholesalePrice || product.retailPrice || product.sellPrice || 0);
    }
    return Number(product.retailPrice || product.sellPrice || 0);
  };

  const handleOpenModal = (product: any) => {
    setSelectedProduct(product);
    setModalPriceType("retail");
    setQtyMode("1");
    setCustomQty("1");
    setIsModalOpen(true);
  };

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
      totalPrice = activeBaseUnit * 0.2;
    } else if (qtyMode === "1/4") {
      qty = 0.25;
      totalPrice = activeBaseUnit * 0.25;
    } else if (qtyMode === "1/2") {
      qty = 0.5;
      totalPrice = activeBaseUnit * 0.5;
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
    const buyPriceUnit = baseBuy;

    return { qty, unitPrice, totalPrice, buyPriceUnit };
  };

  const handleConfirmAddToCart = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    const { qty, unitPrice, totalPrice, buyPriceUnit } = calculateModalResult();

    setCart((prevCart) => {
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
      setTimeout(() => setMessage(""), 3000);
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

  const handleCheckout = async () => {
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
        alert("Mohon masukkan nama pelanggan untuk transaksi Bon (Piutang)!");
        return;
      }
    }

    let transactionStatus = "Tunai";
    if (paymentMethod === "transfer") {
      transactionStatus = "Transfer";
    } else if (paymentMethod === "piutang") {
      transactionStatus = "Bon";
    }

    const transactionId = "TRX-" + Date.now();
    const resolvedCustomer = customerName.trim() ? customerName.trim() : (paymentMethod === "piutang" ? "Pelanggan Bon" : "Umum / Tunai");

    const transaction = {
      id: transactionId,
      date: new Date().toISOString(),
      created_at: new Date().toISOString(),
      items: cart,
      total: totalCart,
      pay: paymentMethod === "cash" ? payAmount : totalCart,
      change: paymentMethod === "cash" ? changeAmount : 0,
      status: transactionStatus,
    };

    const { error: saleError } = await supabase.from("tw_sales_history").insert([transaction]);
    if (saleError) {
      alert("Gagal mencatat riwayat omset: " + saleError.message);
      return;
    }

    const transactionWithCustomer = {
      ...transaction,
      customerName: resolvedCustomer,
    };
    const savedHistory = JSON.parse(localStorage.getItem("tw_sales_history") || "[]");
    localStorage.setItem("tw_sales_history", JSON.stringify([transactionWithCustomer, ...savedHistory]));

    if (paymentMethod === "piutang") {
      const newDebtRecord = {
        id: "PIU-" + Date.now(),
        trxid: transactionId,
        customername: resolvedCustomer,
        amount: totalCart,
        paidamount: 0,
        remainingamount: totalCart,
        date: new Date().toISOString(),
        status: "Belum Lunas",
      };

      const { error: debtError } = await supabase.from("tw_debts").insert([newDebtRecord]);
      if (debtError) {
        console.error("Gagal mencatat piutang ke Supabase:", debtError.message);
      }

      const savedDebts = JSON.parse(localStorage.getItem("kasirq_piutang") || "[]");
      localStorage.setItem("kasirq_piutang", JSON.stringify([newDebtRecord, ...savedDebts]));
    }

    const existingCustomers = JSON.parse(localStorage.getItem("tw_customers") || "[]");
    if (!existingCustomers.some((c: any) => c.name.toLowerCase() === resolvedCustomer.toLowerCase())) {
      const newCustRecord = {
        id: "CUST-" + Date.now(),
        name: resolvedCustomer,
        lastTransactionDate: new Date().toISOString(),
        totalSpent: totalCart,
      };
      localStorage.setItem("tw_customers", JSON.stringify([newCustRecord, ...existingCustomers]));
    }

    for (const cartItem of cart) {
      const currentProd = products.find((p) => p.skuCode === cartItem.skuCode);
      if (currentProd) {
        const currentStock = Number(currentProd.stock || 0);
        const newStock = Math.max(0, currentStock - cartItem.qty);
        
        await supabase
          .from("tw_products")
          .update({ stock: Number(newStock.toFixed(4)) })
          .eq("skuCode", cartItem.skuCode);
      }
    }

    await loadProducts();

    setMessage(`✓ Transaksi Berhasil! Status (${transactionStatus}) & Pelanggan (${resolvedCustomer}) tercatat.`);
    setCart([]);
    setPayAmount("");
    setCustomerName("");
    setTimeout(() => setMessage(""), 4000);
  };

  const modalPreview = calculateModalResult();

  return (
    <div className="tw-main" style={{ animation: "fadeIn 0.3s ease-in-out", width: "100%", boxSizing: "border-box" }}>
      
      {/* TOPBAR DENGAN CARD HEADER SOLID ELEGAN */}
      <header className="tw-topbar" style={{ background: "transparent", borderBottom: "none", padding: "16px 24px 0 24px" }}>
        <div className="tw-header-card" style={{ width: "100%", backgroundColor: "#FFFFFF", border: "1px solid #CBD5E1", borderRadius: "10px", padding: "12px 20px", boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div className="tw-breadcrumb">
            <strong style={{ color: "#0F172A", fontSize: "0.95rem", fontWeight: "700" }}>KASIR POS (POINT OF SALES)</strong>
          </div>
          <div className="tw-topbar-right" style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <button
              type="button"
              onClick={toggleKasirCamera}
              style={{ background: isKasirScanning ? "#DC2626" : "#0284C7", color: "#fff", border: "none", padding: "6px 12px", borderRadius: "6px", fontSize: "0.8rem", fontWeight: "600", cursor: "pointer" }}
            >
              {isKasirScanning ? "Tutup Kamera Scan" : "📷 Scan Kamera POS"}
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

      {isKasirScanning && (
        <div style={{ margin: "15px 20px 0 20px", background: "#FFFFFF", padding: "16px", borderRadius: "10px", border: "1px solid #CBD5E1", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>
          <div style={{ color: "#0F172A", fontSize: "0.85rem", fontWeight: "600", marginBottom: "8px" }}>📸 Arahkan Barcode / QR Produk ke Kamera POS:</div>
          <div id="reader-kasir" style={{ width: "100%", maxWidth: "400px" }}></div>
        </div>
      )}

      <div className="tw-content" style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "20px", padding: "24px" }}>
        
        {/* KOLOM KIRI: KATALOG PRODUK */}
        <div className="tw-card" style={{ backgroundColor: "#FFFFFF", border: "1px solid #CBD5E1", borderRadius: "12px", padding: "18px", display: "flex", flexDirection: "column", gap: "16px", boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
            <h3 className="tw-card-title" style={{ margin: 0, color: "#0F172A", fontSize: "1rem", fontWeight: "600" }}>Katalog Product</h3>
          </div>

          {message && (
            <div style={{ padding: "12px", background: message.includes("❌") ? "#FEE2E2" : "#D1FAE5", color: message.includes("❌") ? "#991B1B" : "#065F46", borderRadius: "8px", fontSize: "0.85rem", fontWeight: "600", border: message.includes("❌") ? "1px solid #FCA5A5" : "1px solid #A7F3D0" }}>
              {message}
            </div>
          )}

          <div style={{ padding: "12px 14px", background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: "8px" }}>
            <span style={{ fontSize: "0.8rem", color: "#1E3A8A", fontWeight: "500", display: "block", lineHeight: "1.4" }}>
              💡 Gunakan Alat Scanner, Scan Kamera POS, atau Klik produk di bawah untuk mengatur takaran &amp; tingkat harga.
            </span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: "12px", maxHeight: "380px", overflowY: "auto" }}>
            {products.length === 0 ? (
              <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "30px", color: "#64748B", fontSize: "0.85rem", fontWeight: "500" }}>
                Belum ada produk aktif tersedia.
              </div>
            ) : (
              products.map((p, idx) => (
                <div
                  key={idx}
                  onClick={() => handleOpenModal(p)}
                  style={{
                    padding: "12px",
                    background: "#F8FAFC",
                    border: "1px solid #CBD5E1",
                    borderRadius: "8px",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    gap: "8px"
                  }}
                >
                  <div>
                    <span style={{ fontSize: "0.75rem", color: "#0284C7", fontWeight: "600", display: "block" }}>{p.skuCode}</span>
                    <span style={{ fontSize: "0.85rem", color: "#0F172A", display: "block", fontWeight: "600", marginTop: "2px" }}>{p.name}</span>
                    <span style={{ fontSize: "0.75rem", color: "#475569", fontWeight: "500" }}>Stok: {p.stock} {p.unit || "kg"}</span>
                  </div>
                  <div style={{ borderTop: "1px solid #E2E8F0", paddingTop: "6px", display: "flex", flexDirection: "column", gap: "2px" }}>
                    <span style={{ fontSize: "0.8rem", color: "#059669", fontWeight: "600" }}>R: Rp {Number(p.retailPrice || p.sellPrice || 0).toLocaleString("id-ID")}</span>
                    <span style={{ fontSize: "0.8rem", color: "#D97706", fontWeight: "600" }}>G: Rp {Number(p.wholesalePrice || 0).toLocaleString("id-ID")}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* KOLOM KANAN: KERANJANG & CHECKOUT */}
        <div className="tw-card" style={{ backgroundColor: "#FFFFFF", border: "1px solid #CBD5E1", borderRadius: "12px", padding: "18px", display: "flex", flexDirection: "column", gap: "16px", height: "fit-content", boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)" }}>
          <h3 className="tw-card-title" style={{ margin: 0, color: "#0F172A", fontSize: "1rem", fontWeight: "600" }}>Keranjang Belanja</h3>

          <div style={{ maxHeight: "220px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "8px" }}>
            {cart.length === 0 ? (
              <div style={{ textAlign: "center", padding: "30px", color: "#64748B", fontSize: "0.85rem", fontWeight: "500" }}>
                Keranjang kosong.
              </div>
            ) : (
              cart.map((item, idx) => (
                <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: "8px", gap: "10px" }}>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: "0.85rem", color: "#0F172A", display: "block", fontWeight: "600" }}>{item.name}</span>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px" }}>
                      <span style={{ fontSize: "0.75rem", color: "#475569", fontWeight: "500" }}>Qty: {item.qty} {item.unit || ""}</span>
                      <select
                        value={item.priceMode || "retail"}
                        onChange={(e) => handleItemPriceModeChange(item.skuCode, e.target.value as "retail" | "wholesale")}
                        style={{ fontSize: "0.75rem", padding: "2px 6px", background: "#FFFFFF", border: "1px solid #CBD5E1", borderRadius: "4px", color: "#0284C7", fontWeight: "600" }}
                      >
                        <option value="retail">Retail</option>
                        <option value="wholesale">Grosir</option>
                      </select>
                    </div>
                  </div>
                  <span style={{ fontSize: "0.85rem", fontWeight: "700", color: "#059669" }}>
                    Rp {((item.sellPrice || 0) * item.qty).toLocaleString("id-ID")}
                  </span>
                </div>
              ))
            )}
          </div>

          <div style={{ borderTop: "2px solid #E2E8F0", paddingTop: "14px", display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "1.05rem", fontWeight: "700", color: "#0F172A" }}>
              <span>Total Belanja:</span>
              <span style={{ color: "#059669" }}>Rp {totalCart.toLocaleString("id-ID")}</span>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.8rem", color: "#334155", marginBottom: "4px", fontWeight: "600" }}>Metode Pembayaran</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  background: "#FFFFFF",
                  border: "1px solid #CBD5E1",
                  borderRadius: "8px",
                  color: "#0F172A",
                  fontSize: "0.85rem",
                  fontWeight: "500",
                }}
              >
                <option value="cash">💵 Tunai</option>
                <option value="piutang">📝 Bon (Piutang)</option>
                <option value="transfer">💳 Transfer</option>
              </select>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.8rem", color: paymentMethod === "piutang" ? "#DC2626" : "#334155", marginBottom: "4px", fontWeight: "600" }}>
                Nama Pelanggan {paymentMethod === "piutang" ? "(Wajib untuk Bon)" : "(Opsional)"}
              </label>
              <input
                type="text"
                placeholder="Masukkan nama pelanggan..."
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  background: paymentMethod === "piutang" ? "#FEF2F2" : "#FFFFFF",
                  border: paymentMethod === "piutang" ? "1px solid #DC2626" : "1px solid #CBD5E1",
                  borderRadius: "8px",
                  color: "#0F172A",
                  fontSize: "0.85rem",
                  fontWeight: "500",
                }}
              />
            </div>

            {paymentMethod === "cash" && (
              <>
                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", color: "#334155", marginBottom: "4px", fontWeight: "600" }}>Nominal Uang Tunai</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value === "" ? "" : Number(e.target.value))}
                    style={{ width: "100%", padding: "10px 12px", background: "#FFFFFF", border: "1px solid #CBD5E1", borderRadius: "8px", color: "#0F172A", fontSize: "0.85rem", fontWeight: "500" }}
                  />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem", fontWeight: "600" }}>
                  <span style={{ color: "#475569" }}>Kembalian:</span>
                  <span style={{ color: "#0284C7" }}>Rp {changeAmount.toLocaleString("id-ID")}</span>
                </div>
              </>
            )}

            <button
              onClick={handleCheckout}
              className="tw-btn tw-btn-primary"
              style={{
                padding: "12px",
                fontWeight: "600",
                fontSize: "0.9rem",
                marginTop: "6px",
                cursor: "pointer",
                background: paymentMethod === "piutang" ? "#DC2626" : "#059669",
                color: "#FFFFFF",
                border: "none",
                borderRadius: "8px",
                boxShadow: "0 2px 6px rgba(0,0,0,0.1)"
              }}
            >
              P E M B A Y A R A N
            </button>
          </div>
        </div>

      </div>

      {/* MODAL PENGATURAN TAKARAN & HARGA */}
      {isModalOpen && selectedProduct && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", backgroundColor: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000, padding: "16px" }}>
          <div style={{ backgroundColor: "#FFFFFF", border: "1px solid #CBD5E1", borderRadius: "12px", width: "100%", maxWidth: "420px", padding: "24px", boxShadow: "0 10px 30px rgba(0,0,0,0.2)" }}>
            <span style={{ color: "#0F172A", display: "block", marginBottom: "4px", fontSize: "1.1rem", fontWeight: "600" }}>Atur Takaran &amp; Harga</span>
            <span style={{ color: "#0284C7", display: "block", fontSize: "0.85rem", fontWeight: "600", marginBottom: "16px" }}>
              {selectedProduct.name} <span style={{ color: "#64748B", fontWeight: "400" }}>(Stok: {selectedProduct.stock} {selectedProduct.unit || "kg"})</span>
            </span>

            <form onSubmit={handleConfirmAddToCart} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", color: "#334155", marginBottom: "6px", fontWeight: "600" }}>Pilih Level Harga</label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <button
                    type="button"
                    onClick={() => setModalPriceType("retail")}
                    style={{
                      padding: "10px",
                      borderRadius: "6px",
                      border: modalPriceType === "retail" ? "2px solid #059669" : "1px solid #CBD5E1",
                      background: modalPriceType === "retail" ? "#D1FAE5" : "#F8FAFC",
                      color: modalPriceType === "retail" ? "#065F46" : "#475569",
                      fontSize: "0.8rem",
                      fontWeight: "600",
                      cursor: "pointer",
                    }}
                  >
                    Retail: Rp {Number(selectedProduct.retailPrice || selectedProduct.sellPrice || 0).toLocaleString("id-ID")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalPriceType("wholesale")}
                    style={{
                      padding: "10px",
                      borderRadius: "6px",
                      border: modalPriceType === "wholesale" ? "2px solid #D97706" : "1px solid #CBD5E1",
                      background: modalPriceType === "wholesale" ? "#FEF3C7" : "#F8FAFC",
                      color: modalPriceType === "wholesale" ? "#92400E" : "#475569",
                      fontSize: "0.8rem",
                      fontWeight: "600",
                      cursor: "pointer",
                    }}
                  >
                    Grosir: Rp {Number(selectedProduct.wholesalePrice || 0).toLocaleString("id-ID")}
                  </button>
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.8rem", color: "#334155", marginBottom: "6px", fontWeight: "600" }}>Pilih Takaran / Qty ({selectedProduct.unit || "kg"})</label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px", marginBottom: "8px" }}>
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
                        padding: "10px",
                        borderRadius: "6px",
                        border: qtyMode === btn.val ? "2px solid #0284C7" : "1px solid #CBD5E1",
                        background: qtyMode === btn.val ? "#E0F2FE" : "#F8FAFC",
                        color: qtyMode === btn.val ? "#0369A1" : "#0F172A",
                        fontSize: "0.8rem",
                        fontWeight: "600",
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
                    style={{ width: "100%", padding: "10px 12px", borderRadius: "6px", backgroundColor: "#FFFFFF", border: "1px solid #0284C7", color: "#0F172A", fontSize: "0.85rem", fontWeight: "500", boxSizing: "border-box" }}
                  />
                )}
              </div>

              <div style={{ padding: "14px", background: "#F1F5F9", borderRadius: "8px", display: "flex", justifyContent: "space-between", alignItems: "center", border: "1px solid #CBD5E1" }}>
                <div>
                  <span style={{ fontSize: "0.8rem", color: "#475569", display: "block", fontWeight: "500" }}>Subtotal ({modalPriceType.toUpperCase()}):</span>
                  <span style={{ fontSize: "0.85rem", color: "#0284C7", fontWeight: "600" }}>{modalPreview.qty} {selectedProduct.unit || "unit"}</span>
                </div>
                <span style={{ fontSize: "1.1rem", color: "#059669", fontWeight: "700" }}>
                  Rp {modalPreview.totalPrice.toLocaleString("id-ID")}
                </span>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "4px" }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{ background: "transparent", border: "1px solid #CBD5E1", color: "#475569", borderRadius: "6px", padding: "10px 16px", cursor: "pointer", fontSize: "0.8rem", fontWeight: "600" }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  style={{ background: "#0284C7", border: "none", color: "#FFFFFF", borderRadius: "6px", padding: "10px 20px", fontWeight: "600", cursor: "pointer", fontSize: "0.8rem" }}
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