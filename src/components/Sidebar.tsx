"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function Sidebar() {
  const [features, setFeatures] = useState({
    barang: true,
    kodeBarang: true,
    pelanggan: true,
    supplier: true,
    pembelian: true, // Berfungsi untuk mengontrol menu Hutang & Piutang
    penjualan: true,
    keuangan: true,
  });

  const loadFeatures = () => {
    const saved = localStorage.getItem("kasirq_features");
    if (saved) {
      try {
        setFeatures(JSON.parse(saved));
      } catch (e) {
        // Fallback default
      }
    }
  };

  useEffect(() => {
    loadFeatures();
    const handleStorageChange = () => loadFeatures();
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  return (
    <aside className="tw-sidebar" style={{ width: "240px", padding: "20px", display: "flex", flexDirection: "column", gap: "20px", background: "#060911", minHeight: "100vh" }}>
      <div className="tw-brand" style={{ fontWeight: "bold", fontSize: "1.1rem", color: "#38bdf8" }}>
        KASIRQ STORE
      </div>

      <nav style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <span style={{ fontSize: "0.65rem", color: "var(--tw-muted)", textTransform: "uppercase" }}>Workspace</span>
          <Link href="/dashboard" style={{ color: "#fff", textDecoration: "none", fontSize: "0.85rem" }}>Dashboard</Link>
          <Link href="/kasir" style={{ color: "#fff", textDecoration: "none", fontSize: "0.85rem" }}>Kasir (POS)</Link>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <span style={{ fontSize: "0.65rem", color: "var(--tw-muted)", textTransform: "uppercase" }}>Manajemen Toko</span>
          {features.barang !== false && (
            <Link href="/barang" style={{ color: "#fff", textDecoration: "none", fontSize: "0.85rem" }}>Barang</Link>
          )}
          {features.kodeBarang !== false && (
            <Link href="/kode-barang" style={{ color: "#fff", textDecoration: "none", fontSize: "0.85rem" }}>Kode Barang (SKU)</Link>
          )}
          {features.pelanggan !== false && (
            <Link href="/pelanggan" style={{ color: "#fff", textDecoration: "none", fontSize: "0.85rem" }}>Pelanggan</Link>
          )}
          {features.supplier !== false && (
            <Link href="/supplier" style={{ color: "#fff", textDecoration: "none", fontSize: "0.85rem" }}>Supplier</Link>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <span style={{ fontSize: "0.65rem", color: "var(--tw-muted)", textTransform: "uppercase" }}>Transaksi &amp; Sistem</span>
          {features.pembelian !== false && (
            <Link href="/piutang" style={{ color: "#fff", textDecoration: "none", fontSize: "0.85rem" }}>Hutang &amp; Piutang</Link>
          )}
          {features.penjualan !== false && (
            <Link href="/penjualan" style={{ color: "#fff", textDecoration: "none", fontSize: "0.85rem" }}>Penjualan</Link>
          )}
          {features.keuangan !== false && (
            <Link href="/keuangan" style={{ color: "#fff", textDecoration: "none", fontSize: "0.85rem" }}>Keuangan</Link>
          )}
          <Link href="/pengaturan" style={{ color: "#fff", textDecoration: "none", fontSize: "0.85rem" }}>Pengaturan</Link>
        </div>
      </nav>
    </aside>
  );
}