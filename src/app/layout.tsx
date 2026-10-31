"use client";

import "./globals.css";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

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
  const pathname = usePathname();

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
      const sidebarState = localStorage.getItem("tw_sidebar_collapsed");
      if (sidebarState !== null) {
        setIsSidebarCollapsed(sidebarState === "true");
      }
    };

    // Ambil status awal dari localStorage saat pertama render
    const savedCollapse = localStorage.getItem("tw_sidebar_collapsed");
    if (savedCollapse !== null) {
      setIsSidebarCollapsed(savedCollapse === "true");
    }

    window.addEventListener("storage", handleStorage);
    window.addEventListener("toggleSidebar", handleStorage as EventListener);
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("toggleSidebar", handleStorage as EventListener);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const toggleSidebar = (collapse: boolean) => {
    setIsSidebarCollapsed(collapse);
    localStorage.setItem("tw_sidebar_collapsed", String(collapse));
    window.dispatchEvent(new Event("toggleSidebar"));
  };

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
                      <small style={{ fontSize: "0.65rem" }}>SISTEM KASIR PINTAR</small>
                    </span>
                  </Link>

                  <button
                    onClick={() => toggleSidebar(true)}
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
                  <Link href="/" className={`tw-nav-link ${pathname === "/" ? "tw-nav-active" : ""}`} style={{ padding: "6px 10px", fontSize: "0.85rem" }}><span className="tw-nav-icon">⌂</span>Dashboard Monitoring</Link>
                  <Link href="/kasir" className={`tw-nav-link ${pathname === "/kasir" ? "tw-nav-active" : ""}`} style={{ padding: "6px 10px", fontSize: "0.85rem" }}><span className="tw-nav-icon">▣</span>Kasir (POS)</Link>
                </nav>

                <div className="tw-nav-label" style={{ fontSize: "0.65rem", margin: "6px 0 4px 0" }}>MANAJEMEN TOKO</div>
                <nav className="tw-nav" style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                  {features.barang !== false && (
                    <Link href="/barang" className={`tw-nav-link ${pathname === "/barang" ? "tw-nav-active" : ""}`} style={{ padding: "6px 10px", fontSize: "0.85rem" }}><span className="tw-nav-icon">▦</span>Barang</Link>
                  )}
                  {features.kodeBarang !== false && (
                    <Link href="/kode-barang" className={`tw-nav-link ${pathname === "/kode-barang" ? "tw-nav-active" : ""}`} style={{ padding: "6px 10px", fontSize: "0.85rem" }}><span className="tw-nav-icon">◇</span>Kode Barang (SKU)</Link>
                  )}
                  {features.pelanggan !== false && (
                    <Link href="/pelanggan" className={`tw-nav-link ${pathname === "/pelanggan" ? "tw-nav-active" : ""}`} style={{ padding: "6px 10px", fontSize: "0.85rem" }}><span className="tw-nav-icon">♧</span>Pelanggan</Link>
                  )}
                  {features.supplier !== false && (
                    <Link href="/supplier" className={`tw-nav-link ${pathname === "/supplier" ? "tw-nav-active" : ""}`} style={{ padding: "6px 10px", fontSize: "0.85rem" }}><span className="tw-nav-icon">⇄</span>Supplier</Link>
                  )}
                </nav>

                <div className="tw-nav-label" style={{ fontSize: "0.65rem", margin: "6px 0 4px 0" }}>TRANSAKSI &amp; SISTEM</div>
                <nav className="tw-nav" style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                  {features.pembelian !== false && (
                    <Link href="/piutang" className={`tw-nav-link ${pathname === "/piutang" ? "tw-nav-active" : ""}`} style={{ padding: "6px 10px", fontSize: "0.85rem" }}><span className="tw-nav-icon">↓</span>Hutang &amp; Piutang</Link>
                  )}
                  {features.penjualan !== false && (
                    <Link href="/penjualan" className={`tw-nav-link ${pathname === "/penjualan" ? "tw-nav-active" : ""}`} style={{ padding: "6px 10px", fontSize: "0.85rem" }}><span className="tw-nav-icon">↗</span>Penjualan</Link>
                  )}
                  {features.keuangan !== false && (
                    <Link href="/keuangan" className={`tw-nav-link ${pathname === "/keuangan" ? "tw-nav-active" : ""}`} style={{ padding: "6px 10px", fontSize: "0.85rem" }}><span className="tw-nav-icon">💰</span>Keuangan</Link>
                  )}
                  <Link href="/pengaturan" className={`tw-nav-link ${pathname === "/pengaturan" ? "tw-nav-active" : ""}`} style={{ padding: "6px 10px", fontSize: "0.85rem" }}><span className="tw-nav-icon">⚙</span>Pengaturan</Link>
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
                  <strong style={{ fontSize: "0.75rem" }}>{storeName}</strong>
                  <small style={{ fontSize: "0.65rem" }}>{isOnline ? "(Online)" : "Offline (Terputus)"}</small>
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
            {/* Tombol Expand Global: Ukuran lebih susut ~20-25% (32px x 32px) dengan efek glassmorphism & ikon panah */}
            {isSidebarCollapsed && (
              <div style={{ padding: "12px 20px 0 20px", display: "flex", alignItems: "center" }}>
                <button
                  onClick={() => toggleSidebar(false)}
                  title="Buka Menu Sidebar"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "32px",
                    height: "32px",
                    borderRadius: "8px",
                    background: "linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(30, 41, 59, 0.8) 100%)",
                    backdropFilter: "blur(10px)",
                    WebkitBackdropFilter: "blur(10px)",
                    color: "#38bdf8",
                    border: "1px solid rgba(56, 189, 248, 0.4)",
                    cursor: "pointer",
                    boxShadow: "0 6px 16px rgba(0, 0, 0, 0.15)",
                    transition: "all 0.2s ease-in-out",
                    marginRight: "16px",
                    flexShrink: 0,
                  }}
                >
                  {/* Ikon Tanda Panah Kanan yang proporsional */}
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6"></polyline>
                  </svg>
                </button>
              </div>
            )}

            {children}
          </div>

        </div>
      </body>
    </html>
  );
}