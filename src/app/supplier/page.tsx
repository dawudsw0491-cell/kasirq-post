"use client";

import { useState, useEffect } from "react";

export default function SupplierPage() {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [phone, setPhone] = useState("");
  const [isOnline, setIsOnline] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("tw_suppliers");
    if (saved) {
      try {
        setSuppliers(JSON.parse(saved));
      } catch (e) {
        setSuppliers([]);
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

  const handleAddSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) {
      alert("Mohon lengkapi Nama Supplier dan No. Telepon!");
      return;
    }

    const newSupplier = {
      id: Date.now(),
      name,
      contact: contact || "-",
      phone,
    };

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
      <header className="tw-topbar">
        <div className="tw-breadcrumb">
          <strong>MANAJEMEN SUPPLIER</strong>
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
        
        {/* FORM TAMBAH SUPPLIER */}
        <div className="tw-card" style={{ display: "flex", flexDirection: "column", gap: "16px", height: "fit-content" }}>
          <h3 className="tw-card-title">Tambah Supplier Baru</h3>

          {message && (
            <div style={{ padding: "10px", background: "rgba(16, 185, 129, 0.15)", color: "#10b981", borderRadius: "8px", fontSize: "0.85rem" }}>
              ✓ {message}
            </div>
          )}

          <form onSubmit={handleAddSupplier} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.8rem", color: "var(--tw-muted)", marginBottom: "4px" }}>Nama Supplier</label>
              <input
                type="text"
                placeholder="Contoh: Merchant Online/Offline..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{ width: "100%" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.8rem", color: "var(--tw-muted)", marginBottom: "4px" }}>Alamat Supplier</label>
              <input
                type="text"
                placeholder="Contoh: Kota/Provinsi..."
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                style={{ width: "100%" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.8rem", color: "var(--tw-muted)", marginBottom: "4px" }}>No. Telepon / WhatsApp</label>
              <input
                type="text"
                placeholder="Contoh: 08129876xxxx"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                style={{ width: "100%" }}
              />
            </div>

            <button type="submit" className="tw-btn tw-btn-primary" style={{ padding: "12px", fontWeight: "bold", marginTop: "8px" }}>
              Simpan Supplier
            </button>
          </form>
        </div>

        {/* TABEL DATA SUPPLIER */}
        <div className="tw-card" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 className="tw-card-title" style={{ margin: 0 }}>Daftar Supplier</h3>
          </div>

          <div style={{ overflowX: "auto", maxHeight: "450px", overflowY: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem", textAlign: "left" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--tw-border)", color: "var(--tw-muted)" }}>
                  <th style={{ padding: "10px" }}>Nama Supplier</th>
                  <th style={{ padding: "10px" }}>Kontak Person</th>
                  <th style={{ padding: "10px" }}>No. Telepon</th>
                </tr>
              </thead>
              <tbody>
                {suppliers.length === 0 ? (
                  <tr>
                    <td colSpan={3} style={{ padding: "30px", textAlign: "center", color: "var(--tw-muted)" }}>
                      Belum ada data supplier terdaftar.
                    </td>
                  </tr>
                ) : (
                  suppliers.map((s, idx) => (
                    <tr key={idx} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                      <td style={{ padding: "10px", fontWeight: "bold", color: "#fff" }}>{s.name}</td>
                      <td style={{ padding: "10px", color: "var(--tw-muted)" }}>{s.contact}</td>
                      <td style={{ padding: "10px", color: "#38bdf8" }}>{s.phone}</td>
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