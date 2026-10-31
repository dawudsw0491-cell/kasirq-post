"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [customLogo, setCustomLogo] = useState<string | null>(null);
  const [storeName, setStoreName] = useState("KASIRQ STORE");
  const pathname = usePathname();

  const [features, setFeatures] = useState({
    barang: true,
    kodeBarang: true,
    pelanggan: true,
    supplier: true,
    pembelian: true, // Berfungsi untuk mengontrol menu Hutang & Piutang
    penjualan: true,
    keuangan: true,
  });

  const loadSidebarData = () => {
    // 1. Load Status Collapse Sidebar
    const savedState = localStorage.getItem("kasirq_sidebar_collapsed");
    if (savedState) {
      setIsCollapsed(JSON.parse(savedState));
    }

    // 2. Load Logo Kustom & Nama Toko
    const savedLogo = localStorage.getItem("tw_store_logo");
    if (savedLogo) setCustomLogo(savedLogo);

    const savedStore = localStorage.getItem("tw_store_name");
    if (savedStore) setStoreName(savedStore);

    // 3. Load Pengaturan Fitur / Modul
    const savedFeatures = localStorage.getItem("kasirq_features");
    if (savedFeatures) {
      try {
        setFeatures(JSON.parse(savedFeatures));
      } catch (e) {
        // Fallback default
      }
    }
  };

  useEffect(() => {
    loadSidebarData();
    const handleStorageChange = () => loadSidebarData();
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const toggleSidebar = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem("kasirq_sidebar_collapsed", JSON.stringify(newState));
  };

  return (
    <aside
      className="tw-sidebar"
      style={{
        width: isCollapsed ? "70px" : "240px",
        padding: isCollapsed ? "20px 10px" : "20px",
        display: "flex",
        flexDirection: "column",
        gap: "20px",
        background: "#060911",
        minHeight: "100vh",
        transition: "width 0.3s ease, padding 0.3s ease",
        position: "sticky",
        top: 0,
        zIndex: 100,
        boxSizing: "border-box",
      }}
    >
      {/* BRAND / LOGO HEADER DENGAN TOMBOL TOGGLE */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: isCollapsed ? "center" : "space-between",
          gap: "8px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px", overflow: "hidden" }}>
          {customLogo ? (
            <img
              src={customLogo}
              alt="Logo Toko"
              style={{ width: "32px", height: "32px", objectFit: "contain", borderRadius: "6px", flexShrink: 0 }}
            />
          ) : (
            <div
              style={{
                width: "32px",
                height: "32px",
                background: "#38bdf8",
                color: "#060911",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "6px",
                fontWeight: "700",
                fontSize: "0.9rem",
                flexShrink: 0,
              }}
            >
              {storeName.charAt(0)}
            </div>
          )}
          {!isCollapsed && (
            <div
              className="tw-brand"
              style={{
                fontWeight: "bold",
                fontSize: "1rem",
                color: "#38bdf8",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {storeName}
            </div>
          )}
        </div>

        <button
          onClick={toggleSidebar}
          title={isCollapsed ? "Perluas Sidebar" : "Ciutkan Sidebar"}
          style={{
            background: "rgba(255, 255, 255, 0.08)",
            border: "1px solid rgba(255, 255, 255, 0.15)",
            borderRadius: "6px",
            width: "28px",
            height: "28px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "0.75rem",
            color: "#fff",
            flexShrink: 0,
            transition: "background 0.2s",
          }}
        >
          {isCollapsed ? "➡️" : "⬅️"}
        </button>
      </div>

      {/* NAVIGASI MENU */}
      <nav style={{ display: "flex", flexDirection: "column", gap: "16px", overflowX: "hidden" }}>
        
        {/* WORKSPACE */}
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {!isCollapsed && (
            <span style={{ fontSize: "0.65rem", color: "var(--tw-muted)", textTransform: "uppercase" }}>Workspace</span>
          )}
          <Link
            href="/dashboard"
            title={isCollapsed ? "Dashboard" : ""}
            style={{
              color: pathname === "/dashboard" ? "#38bdf8" : "#fff",
              textDecoration: "none",
              fontSize: "0.85rem",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "6px 8px",
              borderRadius: "6px",
              background: pathname === "/dashboard" ? "rgba(56, 189, 248, 0.1)" : "transparent",
            }}
          >
            <span style={{ fontSize: "1rem", minWidth: "20px", textAlign: "center" }}>📊</span>
            {!isCollapsed && <span>Dashboard</span>}
          </Link>
          <Link
            href="/kasir"
            title={isCollapsed ? "Kasir (POS)" : ""}
            style={{
              color: pathname === "/kasir" ? "#38bdf8" : "#fff",
              textDecoration: "none",
              fontSize: "0.85rem",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "6px 8px",
              borderRadius: "6px",
              background: pathname === "/kasir" ? "rgba(56, 189, 248, 0.1)" : "transparent",
            }}
          >
            <span style={{ fontSize: "1rem", minWidth: "20px", textAlign: "center" }}>🛒</span>
            {!isCollapsed && <span>Kasir (POS)</span>}
          </Link>
        </div>

        {/* MANAJEMEN TOKO */}
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {!isCollapsed && (
            <span style={{ fontSize: "0.65rem", color: "var(--tw-muted)", textTransform: "uppercase" }}>Manajemen Toko</span>
          )}
          {features.barang !== false && (
            <Link
              href="/barang"
              title={isCollapsed ? "Barang" : ""}
              style={{
                color: pathname === "/barang" ? "#38bdf8" : "#fff",
                textDecoration: "none",
                fontSize: "0.85rem",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "6px 8px",
                borderRadius: "6px",
                background: pathname === "/barang" ? "rgba(56, 189, 248, 0.1)" : "transparent",
              }}
            >
              <span style={{ fontSize: "1rem", minWidth: "20px", textAlign: "center" }}>📦</span>
              {!isCollapsed && <span>Barang</span>}
            </Link>
          )}
          {features.kodeBarang !== false && (
            <Link
              href="/kode-barang"
              title={isCollapsed ? "Kode Barang (SKU)" : ""}
              style={{
                color: pathname === "/kode-barang" ? "#38bdf8" : "#fff",
                textDecoration: "none",
                fontSize: "0.85rem",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "6px 8px",
                borderRadius: "6px",
                background: pathname === "/kode-barang" ? "rgba(56, 189, 248, 0.1)" : "transparent",
              }}
            >
              <span style={{ fontSize: "1rem", minWidth: "20px", textAlign: "center" }}>🏷️</span>
              {!isCollapsed && <span>Kode Barang (SKU)</span>}
            </Link>
          )}
          {features.pelanggan !== false && (
            <Link
              href="/pelanggan"
              title={isCollapsed ? "Pelanggan" : ""}
              style={{
                color: pathname === "/pelanggan" ? "#38bdf8" : "#fff",
                textDecoration: "none",
                fontSize: "0.85rem",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "6px 8px",
                borderRadius: "6px",
                background: pathname === "/pelanggan" ? "rgba(56, 189, 248, 0.1)" : "transparent",
              }}
            >
              <span style={{ fontSize: "1rem", minWidth: "20px", textAlign: "center" }}>👥</span>
              {!isCollapsed && <span>Pelanggan</span>}
            </Link>
          )}
          {features.supplier !== false && (
            <Link
              href="/supplier"
              title={isCollapsed ? "Supplier" : ""}
              style={{
                color: pathname === "/supplier" ? "#38bdf8" : "#fff",
                textDecoration: "none",
                fontSize: "0.85rem",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "6px 8px",
                borderRadius: "6px",
                background: pathname === "/supplier" ? "rgba(56, 189, 248, 0.1)" : "transparent",
              }}
            >
              <span style={{ fontSize: "1rem", minWidth: "20px", textAlign: "center" }}>🏭</span>
              {!isCollapsed && <span>Supplier</span>}
            </Link>
          )}
        </div>

        {/* TRANSAKSI & SISTEM */}
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {!isCollapsed && (
            <span style={{ fontSize: "0.65rem", color: "var(--tw-muted)", textTransform: "uppercase" }}>Transaksi &amp; Sistem</span>
          )}
          {features.pembelian !== false && (
            <Link
              href="/piutang"
              title={isCollapsed ? "Hutang & Piutang" : ""}
              style={{
                color: pathname === "/piutang" ? "#38bdf8" : "#fff",
                textDecoration: "none",
                fontSize: "0.85rem",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "6px 8px",
                borderRadius: "6px",
                background: pathname === "/piutang" ? "rgba(56, 189, 248, 0.1)" : "transparent",
              }}
            >
              <span style={{ fontSize: "1rem", minWidth: "20px", textAlign: "center" }}>📑</span>
              {!isCollapsed && <span>Hutang &amp; Piutang</span>}
            </Link>
          )}
          {features.penjualan !== false && (
            <Link
              href="/penjualan"
              title={isCollapsed ? "Penjualan" : ""}
              style={{
                color: pathname === "/penjualan" ? "#38bdf8" : "#fff",
                textDecoration: "none",
                fontSize: "0.85rem",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "6px 8px",
                borderRadius: "6px",
                background: pathname === "/penjualan" ? "rgba(56, 189, 248, 0.1)" : "transparent",
              }}
            >
              <span style={{ fontSize: "1rem", minWidth: "20px", textAlign: "center" }}>📈</span>
              {!isCollapsed && <span>Penjualan</span>}
            </Link>
          )}
          {features.keuangan !== false && (
            <Link
              href="/keuangan"
              title={isCollapsed ? "Keuangan" : ""}
              style={{
                color: pathname === "/keuangan" ? "#38bdf8" : "#fff",
                textDecoration: "none",
                fontSize: "0.85rem",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "6px 8px",
                borderRadius: "6px",
                background: pathname === "/keuangan" ? "rgba(56, 189, 248, 0.1)" : "transparent",
              }}
            >
              <span style={{ fontSize: "1rem", minWidth: "20px", textAlign: "center" }}>💰</span>
              {!isCollapsed && <span>Keuangan</span>}
            </Link>
          )}
          <Link
            href="/pengaturan"
            title={isCollapsed ? "Pengaturan" : ""}
            style={{
              color: pathname === "/pengaturan" ? "#38bdf8" : "#fff",
              textDecoration: "none",
              fontSize: "0.85rem",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "6px 8px",
              borderRadius: "6px",
              background: pathname === "/pengaturan" ? "rgba(56, 189, 248, 0.1)" : "transparent",
            }}
          >
            <span style={{ fontSize: "1rem", minWidth: "20px", textAlign: "center" }}>⚙️</span>
            {!isCollapsed && <span>Pengaturan</span>}
          </Link>
        </div>

      </nav>
    </aside>
  );
}