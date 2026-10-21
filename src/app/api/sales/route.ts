"use client";

import { useState, useEffect } from "react";

interface Product {
  id: string;
  code: string;
  name: string;
  price: number;
  costPrice: number;
  stock: number;
}

interface CartItem extends Product {
  qty: number;
}

export default function KasirPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [payAmount, setPayAmount] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState("TUNAI");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await fetch("/api/products");
      const data = await res.json();
      if (Array.isArray(data)) {
        setProducts(data);
      } else if (data.success && Array.isArray(data.data)) {
        setProducts(data.data);
      }
    } catch (err) {
      console.error("Gagal mengambil data produk:", err);
    }
  };

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.code.toLowerCase().includes(search.toLowerCase())
  );

  const addToCart = (product: Product) => {
    if (product.stock <= 0) {
      alert("Stok barang habis!");
      return;
    }
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        if (existing.qty >= product.stock) {
          alert("Jumlah di keranjang melebihi stok yang tersedia!");
          return prev;
        }
        return prev.map((item) =>
          item.id === product.id ? { ...item, qty: item.qty + 1 } : item
        );
      }
      return [...prev, { ...product, qty: 1 }];
    });
  };

  const updateQty = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const newQty = item.qty + delta;
            if (newQty > item.stock) {
              alert("Jumlah melebihi stok!");
              return item;
            }
            return newQty > 0 ? { ...item, qty: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const totalAmount = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const numericPayAmount = Number(payAmount) || 0;
  const changeAmount = numericPayAmount > totalAmount ? numericPayAmount - totalAmount : 0;

  const handleCheckout = async () => {
    if (cart.length === 0) {
      alert("Keranjang belanja masih kosong!");
      return;
    }

    const payVal = Number(payAmount);
    if (isNaN(payVal) || payVal < totalAmount) {
      alert(`Pembayaran kurang! Nominal harus minimal Rp ${totalAmount.toLocaleString("id-ID")}`);
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        invoiceNo: `INV-${Date.now()}`,
        totalAmount: totalAmount,
        payAmount: payVal,
        changeAmount: payVal - totalAmount,
        paymentMethod: paymentMethod,
        items: cart.map((item) => ({
          productId: item.id,
          quantity: item.qty,
          price: item.price,
          costPrice: item.costPrice || 0,
        })),
      };

      const res = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (!res.ok || !result.success) {
        throw new Error(result.error || "Gagal memproses transaksi");
      }

      alert("Transaksi Berhasil!");
      setCart([]);
      setPayAmount("");
      fetchProducts();
    } catch (err: any) {
      alert("Gagal memproses transaksi:\n" + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 bg-slate-900 text-slate-100 min-h-screen">
      <h1 className="text-2xl font-bold mb-6 text-indigo-400">Kasir Toko Wiwid</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Kolom Pencarian & Produk */}
        <div className="lg:col-span-2 space-y-4">
          <input
            type="text"
            placeholder="Cari barang / scan barcode..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full p-3 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
          />

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-h-[calc(100vh-220px)] overflow-y-auto pr-2">
            {filteredProducts.map((p) => (
              <div
                key={p.id}
                onClick={() => addToCart(p)}
                className="p-4 bg-slate-800 border border-slate-700 rounded-xl hover:border-indigo-500 cursor-pointer transition flex flex-col justify-between"
              >
                <div>
                  <span className="text-xs text-slate-400 font-mono">{p.code}</span>
                  <h3 className="font-semibold text-white mt-1 line-clamp-2">{p.name}</h3>
                </div>
                <div className="mt-3 flex justify-between items-center">
                  <span className="text-indigo-400 font-bold">
                    Rp {p.price.toLocaleString("id-ID")}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded ${p.stock > 0 ? "bg-slate-700 text-slate-300" : "bg-rose-900 text-rose-300"}`}>
                    Stok: {p.stock}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Kolom Keranjang & Pembayaran */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 flex flex-col justify-between h-fit space-y-6">
          <div>
            <h2 className="text-lg font-bold border-b border-slate-700 pb-3 mb-4">
              Keranjang Penjualan
            </h2>

            {cart.length === 0 ? (
              <p className="text-slate-400 text-center py-8">Keranjang kosong</p>
            ) : (
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                {cart.map((item) => (
                  <div key={item.id} className="flex justify-between items-center bg-slate-900/50 p-3 rounded-lg">
                    <div className="flex-1 mr-2">
                      <p className="font-medium text-sm text-white line-clamp-1">{item.name}</p>
                      <p className="text-xs text-slate-400">Rp {item.price.toLocaleString("id-ID")}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => updateQty(item.id, -1)}
                        className="px-2 py-1 bg-slate-700 hover:bg-slate-600 rounded text-white font-bold"
                      >
                        -
                      </button>
                      <span className="text-sm font-semibold w-6 text-center">{item.qty}</span>
                      <button
                        onClick={() => updateQty(item.id, 1)}
                        className="px-2 py-1 bg-slate-700 hover:bg-slate-600 rounded text-white font-bold"
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-4 border-t border-slate-700 pt-4">
            <div className="flex justify-between items-center text-lg font-bold">
              <span>TOTAL:</span>
              <span className="text-indigo-400 text-xl">
                Rp {totalAmount.toLocaleString("id-ID")}
              </span>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Metode Bayar</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full p-2.5 rounded bg-slate-900 border border-slate-700 text-white focus:outline-none"
              >
                <option value="TUNAI">Tunai / Cash</option>
                <option value="QRIS">QRIS / Non-Tunai</option>
                <option value="TRANSFER">Transfer Bank</option>
              </select>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Nominal Uang (Rp)</label>
              <input
                type="number"
                placeholder="0"
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
                className="w-full p-2.5 rounded bg-slate-900 border border-slate-700 text-white text-lg font-bold focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex justify-between items-center text-sm font-semibold text-emerald-400">
              <span>Kembalian:</span>
              <span>Rp {changeAmount.toLocaleString("id-ID")}</span>
            </div>

            <button
              onClick={handleCheckout}
              disabled={isSubmitting || cart.length === 0}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 text-white font-bold rounded-lg transition"
            >
              {isSubmitting ? "Memproses Transaksi..." : "Bayar Sekarang"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}