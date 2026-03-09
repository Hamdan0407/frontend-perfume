import { forwardRef } from 'react';
import { format } from 'date-fns';

const Invoice = forwardRef(({ order, company }, ref) => {
  const c = {
    name: 'MUWAS PERFUMES',
    tagline: 'Premium Scents & Luxury Attars',
    address: 'No 3, Modi Ibrahim Street, Ambur',
    city: 'Tamil Nadu',
    pinCode: '635802',
    country: 'India',
    email: 'muwas2021@gmail.com',
    phone: '+91 8247327106',
    website: 'www.muwas.in',
    gstin: '',
    ...company,
  };

  const fmt = (amount) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }).format(
      amount || 0
    );

  const fmtDate = (d) => {
    try {
      return format(new Date(d), 'dd MMM yyyy');
    } catch {
      return 'N/A';
    }
  };

  const items = order.items || [];
  const subtotal = order.subtotal || items.reduce((s, i) => s + (i.price || 0) * (i.quantity || 0), 0);
  const shipping = order.shippingCost || 0;
  const discount = order.discount || 0;
  const total = order.totalAmount || 0;

  // Dynamic customer details – resolve from order first, fall back to user
  const customerName =
    order.customerName ||
    `${order.user?.firstName || ''} ${order.user?.lastName || ''}`.trim() ||
    'Customer';
  const customerEmail = order.customerEmail || order.user?.email || '';
  const customerPhone = order.shippingPhone || order.user?.phoneNumber || '';
  const recipientName = order.shippingRecipientName || customerName;

  /* ---- number to words (Indian) ---- */
  const numToWords = (n) => {
    if (!n || n === 0) return 'Zero';
    const ones = [
      '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
      'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen',
    ];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const scaleLabel = ['', 'Thousand', 'Lakh', 'Crore'];
    const chunk = (num) => {
      if (num === 0) return '';
      if (num < 20) return ones[num] + ' ';
      if (num < 100) return tens[Math.floor(num / 10)] + ' ' + ones[num % 10] + ' ';
      return ones[Math.floor(num / 100)] + ' Hundred ' + chunk(num % 100);
    };
    const int = Math.floor(Math.abs(n));
    const paise = Math.round((Math.abs(n) - int) * 100);
    let parts = [];
    let rem = int;
    parts.push(rem % 1000);
    rem = Math.floor(rem / 1000);
    while (rem > 0) {
      parts.push(rem % 100);
      rem = Math.floor(rem / 100);
    }
    let words = '';
    for (let i = parts.length - 1; i >= 0; i--) {
      if (parts[i] === 0) continue;
      words += chunk(parts[i]) + scaleLabel[i] + ' ';
    }
    words = words.trim();
    if (paise > 0) words += ' and ' + chunk(paise).trim() + ' Paise';
    return words + ' Only';
  };

  /* ---- colour palette ---- */
  const gold = '#b58c4f';
  const dark = '#1a1a2e';
  const midGray = '#6b7280';
  const lightGray = '#f8f9fa';
  const borderClr = '#e5e7eb';

  return (
    <div
      ref={ref}
      style={{
        fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
        color: '#333',
        backgroundColor: '#fff',
        maxWidth: 800,
        margin: '0 auto',
        padding: 0,
        fontSize: 13,
        lineHeight: 1.55,
      }}
    >
      {/* =============== GOLD TOP BAR =============== */}
      <div style={{ height: 6, background: `linear-gradient(90deg, ${dark}, ${gold})` }} />

      {/* =============== HEADER =============== */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          padding: '32px 40px 0',
        }}
      >
        {/* Left – Logo + company */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <img
            src="/muwas-logo-nobg.png"
            alt="MUWAS"
            style={{ width: 56, height: 56, objectFit: 'contain', borderRadius: 8 }}
          />
          <div>
            <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: 2, color: dark }}>{c.name}</div>
            <div style={{ fontSize: 11, color: gold, fontWeight: 600, letterSpacing: 0.5, marginTop: 2 }}>
              {c.tagline}
            </div>
          </div>
        </div>

        {/* Right – Invoice label */}
        <div style={{ textAlign: 'right' }}>
          <div
            style={{
              fontSize: 28,
              fontWeight: 900,
              letterSpacing: 4,
              color: dark,
              textTransform: 'uppercase',
            }}
          >
            Invoice
          </div>
          <div style={{ fontSize: 10, color: midGray, letterSpacing: 0.5, marginTop: 2 }}>
            Original for Recipient
          </div>
        </div>
      </div>

      {/* =============== INVOICE META ROW =============== */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 32,
          padding: '16px 40px 0',
          fontSize: 12,
        }}
      >
        {[
          { label: 'Invoice No', value: order.orderNumber || '—' },
          { label: 'Order Date', value: fmtDate(order.createdAt) },
          { label: 'Order ID', value: order.id ? `#${order.id}` : '—' },
        ].map((m) => (
          <div key={m.label} style={{ textAlign: 'right' }}>
            <div style={{ color: midGray, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2 }}>
              {m.label}
            </div>
            <div style={{ fontWeight: 700, color: dark }}>{m.value}</div>
          </div>
        ))}
        <div style={{ textAlign: 'right' }}>
          <div style={{ color: midGray, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2 }}>
            Payment
          </div>
          <span
            style={{
              display: 'inline-block',
              padding: '3px 12px',
              borderRadius: 4,
              fontSize: 11,
              fontWeight: 700,
              backgroundColor: order.paymentStatus === 'PAID' ? '#dcfce7' : '#fef9c3',
              color: order.paymentStatus === 'PAID' ? '#166534' : '#854d0e',
            }}
          >
            {order.paymentStatus || 'PENDING'}
          </span>
        </div>
      </div>

      {/* Divider */}
      <div style={{ margin: '20px 40px 0', borderTop: `2px solid ${dark}` }} />

      {/* =============== BILL TO / SHIP TO =============== */}
      <div style={{ display: 'flex', gap: 20, padding: '24px 40px 0' }}>
        {/* Bill To */}
        <div
          style={{
            flex: 1,
            border: `1px solid ${borderClr}`,
            borderRadius: 8,
            padding: '18px 22px',
            backgroundColor: lightGray,
          }}
        >
          <div
            style={{
              fontSize: 9,
              fontWeight: 700,
              color: gold,
              textTransform: 'uppercase',
              letterSpacing: 2,
              marginBottom: 10,
            }}
          >
            Bill To
          </div>
          <div style={{ fontWeight: 700, fontSize: 15, color: dark, marginBottom: 6 }}>{customerName}</div>
          <div style={{ fontSize: 12, color: '#555', lineHeight: 1.8 }}>
            {customerEmail && <div>{customerEmail}</div>}
            {customerPhone && <div>Ph: {customerPhone}</div>}
          </div>
        </div>

        {/* Ship To */}
        <div
          style={{
            flex: 1,
            border: `1px solid ${borderClr}`,
            borderRadius: 8,
            padding: '18px 22px',
            backgroundColor: lightGray,
          }}
        >
          <div
            style={{
              fontSize: 9,
              fontWeight: 700,
              color: gold,
              textTransform: 'uppercase',
              letterSpacing: 2,
              marginBottom: 10,
            }}
          >
            Ship To
          </div>
          <div style={{ fontWeight: 700, fontSize: 15, color: dark, marginBottom: 6 }}>{recipientName}</div>
          <div style={{ fontSize: 12, color: '#555', lineHeight: 1.8 }}>
            {order.shippingAddress && <div>{order.shippingAddress}</div>}
            <div>
              {[order.shippingCity, order.shippingState].filter(Boolean).join(', ')}
              {order.shippingZipCode ? ` – ${order.shippingZipCode}` : ''}
            </div>
            {order.shippingCountry && <div>{order.shippingCountry}</div>}
            {order.shippingPhone && <div>Ph: {order.shippingPhone}</div>}
          </div>
        </div>
      </div>

      {/* =============== COMPANY ADDRESS (small) =============== */}
      <div style={{ padding: '14px 40px 0', fontSize: 11, color: midGray, lineHeight: 1.6 }}>
        <strong style={{ color: '#444' }}>From:</strong> {c.address}, {c.city} – {c.pinCode}, {c.country} &nbsp;|&nbsp; {c.email} &nbsp;|&nbsp; {c.phone}
      </div>

      {/* =============== ITEMS TABLE =============== */}
      <div style={{ padding: '20px 40px 0' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr>
              {['#', 'Product', 'Qty', 'Unit Price', 'Amount'].map((h, i) => (
                <th
                  key={h}
                  style={{
                    padding: '11px 14px',
                    backgroundColor: dark,
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: 10,
                    textTransform: 'uppercase',
                    letterSpacing: 1,
                    textAlign: i >= 2 ? 'right' : 'left',
                    borderBottom: 'none',
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => {
              const lineTotal = (item.price || 0) * (item.quantity || 0);
              return (
                <tr key={item.id || idx} style={{ backgroundColor: idx % 2 === 0 ? '#fff' : lightGray }}>
                  <td
                    style={{
                      padding: '12px 14px',
                      borderBottom: `1px solid ${borderClr}`,
                      color: midGray,
                      fontWeight: 600,
                      width: 40,
                    }}
                  >
                    {idx + 1}
                  </td>
                  <td style={{ padding: '12px 14px', borderBottom: `1px solid ${borderClr}` }}>
                    <div style={{ fontWeight: 700, color: dark, marginBottom: 2 }}>
                      {item.productName || item.product?.name || 'Product'}
                    </div>
                    {(item.product?.brand || item.product?.volume) && (
                      <div style={{ fontSize: 11, color: midGray }}>
                        {item.product?.brand}
                        {item.product?.volume ? ` · ${item.product.volume}ml` : ''}
                      </div>
                    )}
                  </td>
                  <td
                    style={{
                      padding: '12px 14px',
                      borderBottom: `1px solid ${borderClr}`,
                      textAlign: 'right',
                      fontWeight: 600,
                      color: dark,
                      width: 60,
                    }}
                  >
                    {item.quantity}
                  </td>
                  <td
                    style={{
                      padding: '12px 14px',
                      borderBottom: `1px solid ${borderClr}`,
                      textAlign: 'right',
                      color: '#555',
                      width: 120,
                    }}
                  >
                    {fmt(item.price)}
                  </td>
                  <td
                    style={{
                      padding: '12px 14px',
                      borderBottom: `1px solid ${borderClr}`,
                      textAlign: 'right',
                      fontWeight: 700,
                      color: dark,
                      width: 130,
                    }}
                  >
                    {fmt(lineTotal)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* =============== TOTALS SUMMARY =============== */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '0 40px' }}>
        <div style={{ width: 320, marginTop: 4 }}>
          <table style={{ width: '100%', fontSize: 13 }}>
            <tbody>
              <tr>
                <td style={{ padding: '9px 0', color: midGray }}>Subtotal</td>
                <td style={{ padding: '9px 0', textAlign: 'right', fontWeight: 600, color: dark }}>{fmt(subtotal)}</td>
              </tr>
              <tr>
                <td style={{ padding: '9px 0', color: midGray }}>Shipping</td>
                <td
                  style={{
                    padding: '9px 0',
                    textAlign: 'right',
                    fontWeight: 600,
                    color: shipping > 0 ? dark : '#16a34a',
                  }}
                >
                  {shipping > 0 ? fmt(shipping) : 'FREE'}
                </td>
              </tr>
              {discount > 0 && (
                <tr>
                  <td style={{ padding: '9px 0', color: '#16a34a' }}>Discount</td>
                  <td style={{ padding: '9px 0', textAlign: 'right', fontWeight: 600, color: '#16a34a' }}>
                    − {fmt(discount)}
                  </td>
                </tr>
              )}
              <tr>
                <td colSpan={2} style={{ padding: 0 }}>
                  <div style={{ borderTop: `2px solid ${dark}`, marginTop: 4 }} />
                </td>
              </tr>
              <tr>
                <td style={{ padding: '14px 0 4px', fontSize: 16, fontWeight: 800, color: dark }}>Grand Total</td>
                <td
                  style={{
                    padding: '14px 0 4px',
                    textAlign: 'right',
                    fontSize: 20,
                    fontWeight: 900,
                    color: dark,
                  }}
                >
                  {fmt(total)}
                </td>
              </tr>
            </tbody>
          </table>
          <div style={{ fontSize: 10, color: midGray, fontStyle: 'italic', marginTop: 2, paddingBottom: 4 }}>
            Amount in words: <span style={{ fontWeight: 600, color: '#374151' }}>{numToWords(total)}</span>
          </div>
        </div>
      </div>

      {/* =============== PAYMENT INFO BAR =============== */}
      <div
        style={{
          display: 'flex',
          gap: 0,
          margin: '24px 40px 0',
          borderRadius: 8,
          overflow: 'hidden',
          border: `1px solid ${borderClr}`,
        }}
      >
        {[
          {
            label: 'Payment Method',
            value: order.paymentMethod ? order.paymentMethod.replace(/_/g, ' ').toUpperCase() : 'N/A',
          },
          {
            label: 'Order Status',
            value: order.status ? order.status.replace(/_/g, ' ') : 'N/A',
          },
          { label: 'Website', value: c.website },
        ].map((info, i) => (
          <div
            key={info.label}
            style={{
              flex: 1,
              padding: '14px 20px',
              backgroundColor: lightGray,
              borderLeft: i > 0 ? `1px solid ${borderClr}` : 'none',
              textAlign: i === 2 ? 'right' : 'left',
            }}
          >
            <div
              style={{
                fontSize: 9,
                fontWeight: 700,
                color: gold,
                textTransform: 'uppercase',
                letterSpacing: 1.5,
                marginBottom: 4,
              }}
            >
              {info.label}
            </div>
            <div style={{ fontWeight: 700, color: dark, fontSize: 13 }}>{info.value}</div>
          </div>
        ))}
      </div>

      {/* =============== TERMS + SIGNATURE =============== */}
      <div style={{ padding: '24px 40px 0' }}>
        <div style={{ borderTop: `1px solid ${borderClr}`, paddingTop: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            {/* Terms */}
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  color: gold,
                  textTransform: 'uppercase',
                  letterSpacing: 1.5,
                  marginBottom: 8,
                }}
              >
                Terms &amp; Conditions
              </div>
              <ul style={{ margin: 0, paddingLeft: 14, fontSize: 10, color: midGray, lineHeight: 1.9 }}>
                <li>Goods once sold cannot be taken back or exchanged.</li>
                <li>All disputes are subject to Ambur, Tamil Nadu jurisdiction.</li>
                <li>Inspect the product upon delivery before acceptance.</li>
                <li>E&amp;OE — Errors and Omissions Excepted.</li>
              </ul>
            </div>
            {/* Signature */}
            <div style={{ textAlign: 'center', marginLeft: 40, minWidth: 170 }}>
              <div style={{ height: 50 }} />
              <div style={{ borderBottom: `1px solid ${borderClr}`, width: 170, marginBottom: 6 }} />
              <div style={{ fontSize: 11, fontWeight: 600, color: '#444' }}>Authorized Signatory</div>
              <div style={{ fontSize: 9, color: midGray }}>MUWAS PERFUMES</div>
            </div>
          </div>
        </div>
      </div>

      {/* =============== FOOTER =============== */}
      <div
        style={{
          marginTop: 28,
          padding: '18px 40px',
          backgroundColor: dark,
          color: '#fff',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>Thank you for shopping with MUWAS!</div>
        <div style={{ fontSize: 11, color: '#aaa' }}>
          {c.email} &nbsp;|&nbsp; {c.phone} &nbsp;|&nbsp; {c.website}
        </div>
        <div style={{ fontSize: 9, color: '#777', marginTop: 6 }}>
          This is a computer-generated invoice and does not require a physical signature.
        </div>
      </div>
    </div>
  );
});

Invoice.displayName = 'Invoice';

export default Invoice;
