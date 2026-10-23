"use client";

import "./globals.css";
import { useState, useEffect } from "react";
import Link from "next/link";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [storeName, setStoreName] = useState("KASIRQ STORE");
  const [isOnline, setIsOnline] = useState(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  useEffect(() => {
    const savedStore = localStorage.getItem("tw_store_name");
    if (savedStore) setStoreName(savedStore);

    const handleStorage = () => {
      const updatedStore = localStorage.getItem("tw_store_name");
      if (updatedStore) setStoreName(updatedStore);
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
          
          {/* SIDEBAR / NAVBAR GLOBAL TUNGGAL */}
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
            }}
          >
            <aside className="tw-sidebar" style={{ width: "260px", height: "100%", boxSizing: "border-box" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingRight: "10px" }}>
                <Link href="/" className="tw-brand" style={{ transition: "all 0.2s ease" }}>
                  <div
                    style={{
                      width: "38px",
                      height: "38px",
                      borderRadius: "10px",
                      background: "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: "0 4px 12px rgba(2, 132, 199, 0.4)",
                      border: "1px solid rgba(56, 189, 248, 0.4)",
                    }}
                  >
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M4 4H20V16H4V4Z" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="rgba(255,255,255,0.15)" />
                      <path d="M8 8H16" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" />
                      <path d="M8 12H12" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" />
                      <path d="M8 20H16" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
                      <path d="M12 16V20" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </div>
                  <span className="tw-brand-copy">
                    <strong>{storeName}</strong>
                    <small>RETAIL MANAGEMENT</small>
                  </span>
                </Link>

                <button
                  onClick={() => setIsSidebarCollapsed(true)}
                  title="Tutup Menu"
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "#94a3b8",
                    fontSize: "1.2rem",
                    cursor: "pointer",
                    padding: "4px 8px",
                  }}
                >
                  ✕
                </button>
              </div>

              <div className="tw-nav-label">WORKSPACE</div>
              <nav className="tw-nav">
                <Link href="/" className="tw-nav-link"><span className="tw-nav-icon">⌂</span>Dashboard</Link>
                <Link href="/kasir" className="tw-nav-link"><span className="tw-nav-icon">▣</span>Kasir (POS)</Link>
              </nav>

              <div className="tw-nav-label">MANAJEMEN TOKO</div>
              <nav className="tw-nav">
                <Link href="/barang" className="tw-nav-link"><span className="tw-nav-icon">▦</span>Barang</Link>
                <Link href="/kategori" className="tw-nav-link"><span className="tw-nav-icon">◇</span>Kode Barang (SKU)</Link>
                <Link href="/pelanggan" className="tw-nav-link"><span className="tw-nav-icon">♧</span>Pelanggan</Link>
                <Link href="/supplier" className="tw-nav-link"><span className="tw-nav-icon">⇄</span>Supplier</Link>
              </nav>

              <div className="tw-nav-label">TRANSAKSI &amp; SISTEM</div>
              <nav className="tw-nav">
                <Link href="/pembelian" className="tw-nav-link"><span className="tw-nav-icon">↓</span>Pembelian</Link>
                <Link href="/penjualan" className="tw-nav-link"><span className="tw-nav-icon">↗</span>Penjualan</Link>
                <Link href="/keuangan" className="tw-nav-link"><span className="tw-nav-icon">💰</span>Keuangan</Link>
                <Link href="/pengaturan" className="tw-nav-link"><span className="tw-nav-icon">⚙</span>Pengaturan</Link>
              </nav>

              <div className="tw-sidebar-bottom">
                <div
                  className="tw-status-dot"
                  style={{
                    backgroundColor: isOnline ? "#10b981" : "#ef4444",
                    boxShadow: isOnline ? "0 0 8px #10b981" : "0 0 8px #ef4444",
                  }}
                />
                <div>
                  <strong>Sistem {storeName}</strong>
                  <small>{isOnline ? "Online (Terhubung)" : "Offline (Terputus)"}</small>
                </div>
              </div>
            </aside>
          </div>

          {/* TOMBOL PANGGIL HAMBURGER SAAT NAVBAR TERSEMBUNYI */}
          {isSidebarCollapsed && (
            <button
              onClick={() => setIsSidebarCollapsed(false)}
              title="Buka Menu"
              style={{
                position: "fixed",
                top: "16px",
                left: "16px",
                zIndex: 1001,
                backgroundColor: "#0284c7",
                color: "#ffffff",
                border: "none",
                borderRadius: "8px",
                width: "38px",
                height: "38px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                fontSize: "1.2rem",
                boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
                transition: "all 0.2s ease",
              }}
            >
              ☰
            </button>
          )}

          {/* KONTEN UTAMA HALAMAN (BERGESER DINAMIS & TIDAK TERTUTUP NAVBAR) */}
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
            {children}
          </div>

        </div>
      </body>
    </html>
  );
}