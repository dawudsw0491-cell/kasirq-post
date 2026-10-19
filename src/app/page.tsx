const metrics = [
  { label: "Penjualan hari ini", value: "Rp0" },
  { label: "Transaksi hari ini", value: "0" },
  { label: "Produk terdaftar", value: "Belum tersedia" },
  { label: "Integrasi Accurate", value: "Belum terhubung" }
];

const modules = [
  ["01", "Kasir / POS", "Penjualan, keranjang, dan pembayaran."],
  ["02", "Produk & stok", "SKU, harga, dan pergerakan inventori."],
  ["03", "Pembelian", "Pemasok dan penerimaan barang."],
  ["04", "Integrasi Accurate", "Sinkronisasi, retry, dan rekonsiliasi."]
];

export default function HomePage() {
  return (
    <main className="page">
      <aside className="sidebar">
        <div className="brand"><span className="logo">W</span>
          <div><strong>TOKO WIWID</strong><small>POS & OPERASIONAL</small></div>
        </div>
        <p className="nav-heading">MENU UTAMA</p>
        <div className="nav active">▦　 Ringkasan</div>
        <div className="nav">▣　 Kasir / POS</div>
        <div className="nav">▤　 Produk & stok</div>
        <div className="nav">⇄　 Pembelian</div>
        <div className="nav">⤴　 Integrasi</div>
        <div className="sidebar-bottom">●　Fondasi aplikasi</div>
      </aside>

      <section className="content">
        <header className="header">
          <div><p className="eyebrow">WORKSPACE / TOKO WIWID</p>
            <h1>Ringkasan operasional</h1></div>
          <span className="admin">TW　 Admin Toko</span>
        </header>

        <section className="welcome">
          <p className="eyebrow">DASHBOARD TOKO</p>
          <h2>Selamat datang di Toko Wiwid.</h2>
          <p>Fondasi aplikasi siap dikembangkan untuk transaksi dan operasional toko.</p>
        </section>

        <section className="metrics">
          {metrics.map((item) => (
            <article className="metric" key={item.label}>
              <p>{item.label}</p><strong>{item.value}</strong>
            </article>
          ))}
        </section>

        <div className="section-title">
          <div><p className="eyebrow">PETA IMPLEMENTASI</p><h2>Modul aplikasi</h2></div>
          <span className="phase">Fase 1 · Fondasi</span>
        </div>

        <section className="modules">
          {modules.map(([number, title, description]) => (
            <article className="module" key={number}>
              <span className="number">{number}</span>
              <h3>{title}</h3><p>{description}</p>
              <small>○　Direncanakan</small>
            </article>
          ))}
        </section>

        <footer>
          Angka pada dashboard merupakan placeholder. Data nyata akan berasal
          dari database setelah modul transaksi selesai dibangun.
        </footer>
      </section>
    </main>
  );
}
