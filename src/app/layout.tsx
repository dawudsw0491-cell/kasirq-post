"use client";

import "./globals.css";
import { useState, useEffect } from "react";
import Link from "next/link";

export interface FeatureSettings {
  barang: boolean;
  kodeBarang: boolean;
  pelanggan: boolean;
  supplier: boolean;
  pembelian: boolean;
  penjualan: boolean;
  keuangan: boolean;
}

export const DEFAULT_FEATURES: FeatureSettings = {
  barang: true,
  kodeBarang: true,
  pelanggan: true,
  supplier: true,
  pembelian: true,
  penjualan: true,
  keuangan: true,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [storeName, setStoreName] = useState("KASIRQ STORE");
  const [isOnline, setIsOnline] = useState(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [features, setFeatures] = useState<FeatureSettings>(DEFAULT_FEATURES);

  const loadSettingsAndFeatures = () => {
    const savedStore = localStorage.getItem("tw_store_name");
    if (savedStore) setStoreName(savedStore);

    const savedFeatures = localStorage.getItem("kasirq_features");
    if (savedFeatures) {
      try {
        setFeatures(JSON.parse(savedFeatures));
      } catch (e) {
        setFeatures(DEFAULT_FEATURES);
      }
    }
  };

  useEffect(() => {
    loadSettingsAndFeatures();

    const handleStorage = () => {
      loadSettingsAndFeatures();
    };

    window.addEventListener("storage", handleStorage);
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return (
    <html lang="id">
      <body>
        <div className="tw-dashboard" style={{ display: "flex", position: "relative", minHeight: "100vh", overflowX: "hidden" }}>
          
          {/* SIDEBAR / NAVBAR GLOBAL */}
          <div
            style={{
              width: "260px",
              position: "fixed",
              top: 0,
              left: 0,
              height: "100vh",
              zIndex: 1000,
              transform: isSidebarCollapsed ? "translateX(-260px)" : "translateX(0)",
              transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              backgroundColor: "#090d16",
              boxShadow: isSidebarCollapsed ? "none" : "4px 0 20px rgba(0,0,0,0.5)",
              overflow: "hidden",
            }}
          >
            <aside 
              className="tw-sidebar" 
              style={{ 
                width: "260px", 
                height: "100%", 
                boxSizing: "border-box", 
                display: "flex", 
                flexDirection: "column", 
                justifyContent: "space-between", 
                padding: "12px 14px" 
              }}
            >
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                  <Link href="/" className="tw-brand" style={{ transition: "all 0.2s ease", textDecoration: "none" }}>
                    <div
                      style={{
                        width: "34px",
                        height: "34px",
                        borderRadius: "8px",
                        background: "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: "0 4px 12px rgba(2, 132, 199, 0.4)",
                        border: "1px solid rgba(56, 189, 248, 0.4)",
                      }}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M4 4H20V16H4V4Z" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="rgba(255,255,255,0.15)" />
                        <path d="M8 8H16" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" />
                        <path d="M8 12H12" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" />
                        <path d="M8 20H16" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
                        <path d="M12 16V20" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                    </div>
                    <span className="tw-brand-copy">
                      <strong style={{ fontSize: "0.85rem" }}>{storeName}</strong>
                      <small style={{ fontSize: "0.65rem" }}>RETAIL MANAGEMENT</small>
                    </span>
                  </Link>

                  <button
                    onClick={() => setIsSidebarCollapsed(true)}
                    title="Tutup Menu"
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "#94a3b8",
                      fontSize: "1.1rem",
                      cursor: "pointer",
                      padding: "4px",
                    }}
                  >
                    ✕
                  </button>
                </div>

                <div className="tw-nav-label" style={{ fontSize: "0.65rem", margin: "4px 0" }}>WORKSPACE</div>
                <nav className="tw-nav" style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                  <Link href="/" className="tw-nav-link" style={{ padding: "6px 10px", fontSize: "0.85rem" }}><span className="tw-nav-icon">⌂</span>Dashboard</Link>
                  <Link href="/kasir" className="tw-nav-link" style={{ padding: "6px 10px", fontSize: "0.85rem" }}><span className="tw-nav-icon">▣</span>Kasir (POS)</Link>
                </nav>

                <div className="tw-nav-label" style={{ fontSize: "0.65rem", margin: "6px 0 4px 0" }}>MANAJEMEN TOKO</div>
                <nav className="tw-nav" style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                  {features.barang !== false && (
                    <Link href="/barang" className="tw-nav-link" style={{ padding: "6px 10px", fontSize: "0.85rem" }}><span className="tw-nav-icon">▦</span>Barang</Link>
                  )}
                  {features.kodeBarang !== false && (
                    <Link href="/kode-barang" className="tw-nav-link" style={{ padding: "6px 10px", fontSize: "0.85rem" }}><span className="tw-nav-icon">◇</span>Kode Barang (SKU)</Link>
                  )}
                  {features.pelanggan !== false && (
                    <Link href="/pelanggan" className="tw-nav-link" style={{ padding: "6px 10px", fontSize: "0.85rem" }}><span className="tw-nav-icon">♧</span>Pelanggan</Link>
                  )}
                  {features.supplier !== false && (
                    <Link href="/supplier" className="tw-nav-link" style={{ padding: "6px 10px", fontSize: "0.85rem" }}><span className="tw-nav-icon">⇄</span>Supplier</Link>
                  )}
                </nav>

                <div className="tw-nav-label" style={{ fontSize: "0.65rem", margin: "6px 0 4px 0" }}>TRANSAKSI &amp; SISTEM</div>
                <nav className="tw-nav" style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                  {features.pembelian !== false && (
                    <Link href="/piutang" className="tw-nav-link" style={{ padding: "6px 10px", fontSize: "0.85rem" }}><span className="tw-nav-icon">↓</span>Hutang &amp; Piutang</Link>
                  )}
                  {features.penjualan !== false && (
                    <Link href="/penjualan" className="tw-nav-link" style={{ padding: "6px 10px", fontSize: "0.85rem" }}><span className="tw-nav-icon">↗</span>Penjualan</Link>
                  )}
                  {features.keuangan !== false && (
                    <Link href="/keuangan" className="tw-nav-link" style={{ padding: "6px 10px", fontSize: "0.85rem" }}><span className="tw-nav-icon">💰</span>Keuangan</Link>
                  )}
                  <Link href="/pengaturan" className="tw-nav-link" style={{ padding: "6px 10px", fontSize: "0.85rem" }}><span className="tw-nav-icon">⚙</span>Pengaturan</Link>
                </nav>
              </div>

              <div className="tw-sidebar-bottom" style={{ padding: "8px 10px", marginTop: "4px" }}>
                <div
                  className="tw-status-dot"
                  style={{
                    backgroundColor: isOnline ? "#10b981" : "#ef4444",
                    boxShadow: isOnline ? "0 0 8px #10b981" : "0 0 8px #ef4444",
                  }}
                />
                <div>
                  <strong style={{ fontSize: "0.75rem" }}>Sistem {storeName}</strong>
                  <small style={{ fontSize: "0.65rem" }}>{isOnline ? "Online (Terhubung)" : "Offline (Terputus)"}</small>
                </div>
              </div>
            </aside>
          </div>

          {/* KONTEN UTAMA HALAMAN */}
          <div
            style={{
              flex: 1,
              marginLeft: isSidebarCollapsed ? "0px" : "260px",
              minWidth: 0,
              display: "flex",
              flexDirection: "column",
              transition: "margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          >
            {isSidebarCollapsed && (
              <div style={{ position: "fixed", top: "12px", left: "16px", zIndex: 1100 }}>
                <button
                  onClick={() => setIsSidebarCollapsed(false)}
                  title="Buka Menu"
                  style={{
                    backgroundColor: "#0284c7",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "8px",
                    width: "36px",
                    height: "36px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    fontSize: "1.1rem",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
                    transition: "all 0.2s ease",
                  }}
                >
                  ☰
                </button>
              </div>
            )}

            <style jsx global>{`
              .tw-topbar {
                padding-left: ${isSidebarCollapsed ? "60px" : "20px"} !important;
                transition: padding-left 0.3s ease;
              }
            `}</style>

            {children}
          </div>

        </div>
      </body>
    </html>
  );
}