{/* Tampilan QRIS Standar Universal */}
            <div style={{ background: "#f8fafc", padding: "16px", borderRadius: "12px", border: "2px dashed #cbd5e1", marginBottom: "16px" }}>
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=00020101021126640016ID.CO.QRIS.WWW01189360091430000000000303UMI51440014ID.A20260000000020202000303UMI5204541153033605802ID5910${encodeURIComponent(storeName.substring(0, 10))}%206005SOLO6304`}
                alt="QRIS Barcode Universal"
                style={{ width: "180px", height: "180px", margin: "0 auto", display: "block" }}
              />
            </div>