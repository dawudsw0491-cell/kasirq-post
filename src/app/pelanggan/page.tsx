"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function PelangganPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [isOnline, setIsOnline] = useState(true);
  const [message, setMessage] = useState("");

  const loadCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from("tw_customers")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && data) {
        setCustomers(data);
        localStorage.setItem("tw_customers", JSON.stringify(data));
      } else {
        fallbackLoadLocal();
      }
    } catch (e) {
      fallbackLoadLocal();
    }
  };

  const fallbackLoadLocal = () => {
    const saved = localStorage.getItem("tw_customers");
    if (saved) {
      try {
        setCustomers(JSON.parse(saved));
      } catch (e) {
        setCustomers([]);
      }
    }
  };

  useEffect(() => {
    loadCustomers();

    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Supabase Realtime Subscription untuk sinkronisasi pelanggan
    const channel = supabase
      .channel("public:tw_customers")
      .on("postgres_changes", { event: "*", schema: "public", table: "tw_customers" }, () => {
        loadCustomers();
      })
      .subscribe();

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      supabase.removeChannel(channel);
    };
  }, []);

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) {
      alert("Mohon lengkapi Nama Pelanggan dan No. Telepon!");
      return;
    }

    const customerId = "CUST-" + Date.now();
    const newCustomer = {
      id: customerId,
      name: name.trim(),
      phone: phone.trim(),
      address: address.trim() || "-",
    };

    // Simpan ke Supabase Cloud
    const { error } = await supabase.from("tw_customers").insert([newCustomer]);

    if (error) {
      alert("Gagal menyimpan ke Cloud Database: " + error.message);
      return;
    }

    const updated = [newCustomer, ...customers];
    setCustomers(updated);
    localStorage.setItem("tw_customers", JSON.stringify(updated));

    setMessage("Pelanggan baru berhasil ditambahkan!");
    setName("");
    setAddress("");
    setPhone("");
    setTimeout(() => setMessage(""), 3000);
  };

  return (
    <div className="tw-main" style={{ animation: "fadeIn 0.3s ease-in-out", width: "100%", boxSizing: "border-box" }}>
      <header className="tw-topbar">
        <div className="tw-breadcrumb">
          <strong>MANAJEMEN PELANGGAN</strong>
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
            {isOnline ? "ONLINE (SUPABASE)" : "OFFLINE"}
          </span>
        </div>
      </header>

      <div className="tw-content" style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: "20px", padding: "20px" }}>
        
        {/* FORM TAMBAH PELANGGAN */}
        <div className="tw-card" style={{ display: "flex", flexDirection: "column", gap: "16px", height: "fit-content" }}>
          <h3 className="tw-card-title">Tambah Pelanggan Baru</h3>

          {message && (
            <div style={{ padding: "10px", background: "rgba(16, 185, 129, 0.15)", color: "#10b981", borderRadius: "8px", fontSize: "0.85rem" }}>
              ✓ {message}
            </div>
          )}

          <form onSubmit={handleAddCustomer} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.8rem", color: "var(--tw-muted)", marginBottom: "4px" }}>Nama Pelanggan</label>
              <input
                type="text"
                placeholder="Contoh: Alexander..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{ width: "100%", padding: "8px", background: "rgba(255,255,255,0.03)", border: "1px solid var(--tw-border)", borderRadius: "8px", color: "#fff" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.8rem", color: "var(--tw-muted)", marginBottom: "4px" }}>Alamat Pelanggan</label>
              <input
                type="text"
                placeholder="Contoh: Kota, Provinsi..."
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                style={{ width: "100%", padding: "8px", background: "rgba(255,255,255,0.03)", border: "1px solid var(--tw-border)", borderRadius: "8px", color: "#fff" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.8rem", color: "var(--tw-muted)", marginBottom: "4px" }}>No. Telepon / WhatsApp</label>
              <input
                type="text"
                placeholder="Contoh: 08129876xxxx"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                style={{ width: "100%", padding: "8px", background: "rgba(255,255,255,0.03)", border: "1px solid var(--tw-border)", borderRadius: "8px", color: "#fff" }}
              />
            </div>

            <button type="submit" className="tw-btn tw-btn-primary" style={{ padding: "12px", fontWeight: "bold", marginTop: "8px", cursor: "pointer" }}>
              Simpan Pelanggan
            </button>
          </form>
        </div>

        {/* TABEL DATA PELANGGAN */}
        <div className="tw-card" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 className="tw-card-title" style={{ margin: 0 }}>Daftar Pelanggan ({customers.length})</h3>
          </div>

          <div style={{ overflowX: "auto", maxHeight: "450px", overflowY: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem", textAlign: "left" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--tw-border)", color: "var(--tw-muted)" }}>
                  <th style={{ padding: "10px" }}>Nama Pelanggan</th>
                  <th style={{ padding: "10px" }}>Alamat</th>
                  <th style={{ padding: "10px" }}>No. Telepon</th>
                </tr>
              </thead>
              <tbody>
                {customers.length === 0 ? (
                  <tr>
                    <td colSpan={3} style={{ padding: "30px", textAlign: "center", color: "var(--tw-muted)" }}>
                      Belum ada data pelanggan terdaftar.
                    </td>
                  </tr>
                ) : (
                  customers.map((c, idx) => (
                    <tr key={idx} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                      <td style={{ padding: "10px", fontWeight: "bold", color: "#fff" }}>{c.name}</td>
                      <td style={{ padding: "10px", color: "var(--tw-muted)" }}>{c.address}</td>
                      <td style={{ padding: "10px", color: "#38bdf8" }}>{c.phone}</td>
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