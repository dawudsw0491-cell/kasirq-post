"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function SupplierPage() {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [phone, setPhone] = useState("");
  const [isOnline, setIsOnline] = useState(true);
  const [message, setMessage] = useState("");

  const loadSuppliers = async () => {
    try {
      const { data, error } = await supabase
        .from("tw_suppliers")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && data) {
        setSuppliers(data);
        localStorage.setItem("tw_suppliers", JSON.stringify(data));
      } else {
        fallbackLoadLocal();
      }
    } catch (e) {
      fallbackLoadLocal();
    }
  };

  const fallbackLoadLocal = () => {
    const saved = localStorage.getItem("tw_suppliers");
    if (saved) {
      try {
        setSuppliers(JSON.parse(saved));
      } catch (e) {
        setSuppliers([]);
      }
    }
  };

  useEffect(() => {
    loadSuppliers();

    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Supabase Realtime Subscription untuk sinkronisasi supplier
    const channel = supabase
      .channel("public:tw_suppliers")
      .on("postgres_changes", { event: "*", schema: "public", table: "tw_suppliers" }, () => {
        loadSuppliers();
      })
      .subscribe();

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      supabase.removeChannel(channel);
    };
  }, []);

  const handleAddSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) {
      alert("Mohon lengkapi Nama Supplier dan No. Telepon!");
      return;
    }

    const supplierId = "SUP-" + Date.now();
    const newSupplier = {
      id: supplierId,
      name: name.trim(),
      contact: contact.trim() || "-",
      phone: phone.trim(),
      created_at: new Date().toISOString(),
    };

    // Simpan ke Supabase Cloud
    const { error } = await supabase.from("tw_suppliers").insert([newSupplier]);

    if (error) {
      alert("Gagal menyimpan ke Cloud Database: " + error.message);
      return;
    }

    const updated = [newSupplier, ...suppliers];
    setSuppliers(updated);
    localStorage.setItem("tw_suppliers", JSON.stringify(updated));

    setMessage("Supplier baru berhasil ditambahkan!");
    setName("");
    setContact("");
    setPhone("");
    setTimeout(() => setMessage(""), 3000);
  };

  return (
    <div className="tw-main" style={{ animation: "fadeIn 0.3s ease-in-out", width: "100%", boxSizing: "border-box" }}>
      
      {/* TOPBAR DENGAN CARD HEADER SOLID ELEGAN */}
      <header className="tw-topbar" style={{ background: "transparent", borderBottom: "none", padding: "16px 24px 0 24px" }}>
        <div className="tw-header-card" style={{ width: "100%", backgroundColor: "#FFFFFF", border: "1px solid #CBD5E1", borderRadius: "10px", padding: "12px 20px", boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div className="tw-breadcrumb">
            <strong style={{ color: "#0F172A", fontSize: "0.95rem", fontWeight: "700" }}>MANAJEMEN SUPPLIER</strong>
          </div>
          <div className="tw-topbar-right" style={{ display: "flex", alignItems: "center", gap: "12px" }}>
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

      <div className="tw-content" style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: "20px", padding: "24px" }}>
        
        {/* FORM TAMBAH SUPPLIER */}
        <div className="tw-card" style={{ backgroundColor: "#FFFFFF", border: "1px solid #CBD5E1", borderRadius: "12px", padding: "18px", display: "flex", flexDirection: "column", gap: "16px", height: "fit-content", boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)" }}>
          <h3 className="tw-card-title" style={{ margin: 0, color: "#0F172A", fontSize: "1rem", fontWeight: "600" }}>Tambah Supplier Baru</h3>

          {message && (
            <div style={{ padding: "12px", background: "#D1FAE5", color: "#065F46", borderRadius: "8px", fontSize: "0.85rem", fontWeight: "600", border: "1px solid #A7F3D0" }}>
              ✓ {message}
            </div>
          )}

          <form onSubmit={handleAddSupplier} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.8rem", color: "#334155", marginBottom: "4px", fontWeight: "600" }}>Nama Supplier</label>
              <input
                type="text"
                placeholder="Contoh: Merchant Online/Offline..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{ width: "100%", padding: "8px 12px", background: "#FFFFFF", border: "1px solid #CBD5E1", borderRadius: "8px", color: "#0F172A", fontSize: "0.85rem", fontWeight: "500" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.8rem", color: "#334155", marginBottom: "4px", fontWeight: "600" }}>Alamat Supplier</label>
              <input
                type="text"
                placeholder="Contoh: Kota/Provinsi..."
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                style={{ width: "100%", padding: "8px 12px", background: "#FFFFFF", border: "1px solid #CBD5E1", borderRadius: "8px", color: "#0F172A", fontSize: "0.85rem", fontWeight: "500" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.8rem", color: "#334155", marginBottom: "4px", fontWeight: "600" }}>No. Telepon / WhatsApp</label>
              <input
                type="text"
                placeholder="Contoh: 08129876xxxx"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                style={{ width: "100%", padding: "8px 12px", background: "#FFFFFF", border: "1px solid #CBD5E1", borderRadius: "8px", color: "#0F172A", fontSize: "0.85rem", fontWeight: "500" }}
              />
            </div>

            <button type="submit" className="tw-btn tw-btn-primary" style={{ padding: "12px", fontWeight: "600", marginTop: "8px", cursor: "pointer", background: "#059669", color: "#fff", border: "none", borderRadius: "8px", fontSize: "0.9rem" }}>
              Simpan Supplier
            </button>
          </form>
        </div>

        {/* TABEL DATA SUPPLIER */}
        <div className="tw-card" style={{ backgroundColor: "#FFFFFF", border: "1px solid #CBD5E1", borderRadius: "12px", padding: "18px", display: "flex", flexDirection: "column", gap: "16px", boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 className="tw-card-title" style={{ margin: 0, color: "#0F172A", fontSize: "1rem", fontWeight: "600" }}>Daftar Supplier [{suppliers.length}]</h3>
          </div>

          <div style={{ overflowX: "auto", maxHeight: "450px", overflowY: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem", textAlign: "left" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #E2E8F0", color: "#334155" }}>
                  <th style={{ padding: "10px", fontWeight: "600" }}>Nama Supplier</th>
                  <th style={{ padding: "10px", fontWeight: "600" }}>Alamat / Kontak</th>
                  <th style={{ padding: "10px", fontWeight: "600" }}>No. Telepon</th>
                </tr>
              </thead>
              <tbody>
                {suppliers.length === 0 ? (
                  <tr>
                    <td colSpan={3} style={{ padding: "30px", textAlign: "center", color: "#64748B", fontSize: "0.85rem", fontWeight: "500" }}>
                      Belum ada data supplier terdaftar.
                    </td>
                  </tr>
                ) : (
                  suppliers.map((s, idx) => (
                    <tr key={idx} style={{ borderBottom: "1px solid #F1F5F9", transition: "background 0.2s" }}>
                      <td style={{ padding: "10px", fontWeight: "600", color: "#0F172A" }}>{s.name}</td>
                      <td style={{ padding: "10px", color: "#64748B", fontWeight: "500" }}>{s.contact || "-"}</td>
                      <td style={{ padding: "10px", color: "#0284C7", fontWeight: "600" }}>{s.phone || "-"}</td>
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