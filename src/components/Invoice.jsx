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
    phone: '+91 9629004158',
    website: 'www.muwas.in',
    gstin: '',
    ...company,
  };

  const fmt = (amount) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }).format(amount);

  const fmtDate = (d) => format(new Date(d), 'dd MMM yyyy');

  const subtotal = order.items.reduce((s, i) => s + i.price * i.quantity, 0);
  const shipping = order.shippingCharge || 0;
  const discount = subtotal + shipping - (order.finalAmount ?? order.totalAmount);
  const total = order.totalAmount;

  /* ---- number to words (Indian) ---- */
  const numToWords = (n) => {
    if (n === 0) return 'Zero';
    const ones = ['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten',
      'Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen'];
    const tens = ['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];
    const scaleLabel = ['','Thousand','Lakh','Crore'];
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
    // first group = 3 digits, rest = 2 digits (Indian system)
    parts.push(rem % 1000); rem = Math.floor(rem / 1000);
    while (rem > 0) { parts.push(rem % 100); rem = Math.floor(rem / 100); }
    let words = '';
    for (let i = parts.length - 1; i >= 0; i--) {
      if (parts[i] === 0) continue;
      words += chunk(parts[i]) + scaleLabel[i] + ' ';
    }
    words = words.trim();
    if (paise > 0) words += ' and ' + chunk(paise).trim() + ' Paise';
    return words + ' Only';
  };

  /* ---- styles (inline for reliable PDF rendering) ---- */
  const border = '1px solid #d1d5db';
  const lightBg = '#f9fafb';
  const headerBg = '#111827';
  const accentColor = '#b58c4f';

  return (
    <div
      ref={ref}
      style={{
        fontFamily: "'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif",
        color: '#1f2937',
        backgroundColor: '#ffffff',
        maxWidth: 800,
        margin: '0 auto',
        padding: '40px 48px',
        fontSize: 13,
        lineHeight: 1.5,
      }}
    >
      {/* ====== HEADER ====== */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
        {/* Left – Company */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
            <div
              style={{
                width: 48, height: 48, borderRadius: 8, backgroundColor: headerBg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: accentColor, fontWeight: 800, fontSize: 20, letterSpacing: 1,
              }}
            >
              M
            </div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: 1.5, color: '#111827' }}>MUWAS</div>
              <div style={{ fontSize: 10, color: '#6b7280', letterSpacing: 0.5 }}>{c.tagline}</div>
            </div>
          </div>
          <div style={{ fontSize: 11, color: '#6b7280', marginTop: 8, lineHeight: 1.7 }}>
            <div>{c.address}</div>
            <div>{c.city} – {c.pinCode}, {c.country}</div>
            <div>Email: {c.email} | Phone: {c.phone}</div>
            {c.gstin && <div>GSTIN: {c.gstin}</div>}
          </div>
        </div>

        {/* Right – Invoice title + meta */}
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 26, fontWeight: 800, color: headerBg, letterSpacing: 3, marginBottom: 2 }}>
            TAX INVOICE
          </div>
          <div style={{ fontSize: 10, color: '#9ca3af', marginBottom: 14, letterSpacing: 0.5 }}>Original for Recipient</div>
          <table style={{ marginLeft: 'auto', fontSize: 12 }}>
            <tbody>
              <tr>
                <td style={{ padding: '3px 12px 3px 0', color: '#6b7280', textAlign: 'right' }}>Invoice No.</td>
                <td style={{ fontWeight: 700, color: '#111827' }}>{order.orderNumber}</td>
              </tr>
              <tr>
                <td style={{ padding: '3px 12px 3px 0', color: '#6b7280', textAlign: 'right' }}>Date</td>
                <td style={{ fontWeight: 600, color: '#111827' }}>{fmtDate(order.createdAt)}</td>
              </tr>
              <tr>
                <td style={{ padding: '3px 12px 3px 0', color: '#6b7280', textAlign: 'right' }}>Order ID</td>
                <td style={{ fontWeight: 600, color: '#111827', fontFamily: 'monospace', fontSize: 11 }}>
                  {order.id ? `#${order.id}` : order.orderNumber}
                </td>
              </tr>
              <tr>
                <td style={{ padding: '3px 12px 3px 0', color: '#6b7280', textAlign: 'right' }}>Payment</td>
                <td>
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '2px 10px',
                      borderRadius: 4,
                      fontSize: 11,
                      fontWeight: 700,
                      backgroundColor: order.paymentStatus === 'PAID' ? '#dcfce7' : '#fef9c3',
                      color: order.paymentStatus === 'PAID' ? '#166534' : '#854d0e',
                    }}
                  >
                    {order.paymentStatus}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Divider */}
      <div style={{ borderTop: `2px solid ${headerBg}`, margin: '20px 0 24px' }} />

      {/* ====== BILLING / SHIPPING ====== */}
      <div style={{ display: 'flex', gap: 24, marginBottom: 28 }}>
        {/* Bill To */}
        <div style={{ flex: 1, border, borderRadius: 6, padding: '16px 20px', backgroundColor: lightBg }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8 }}>
            Bill To
          </div>
          <div style={{ fontWeight: 700, fontSize: 15, color: '#111827', marginBottom: 4 }}>
            {order.user?.firstName} {order.user?.lastName}
          </div>
          <div style={{ fontSize: 12, color: '#4b5563', lineHeight: 1.7 }}>
            {order.user?.email && <div>{order.user.email}</div>}
            {order.user?.phoneNumber && <div>Ph: {order.user.phoneNumber}</div>}
          </div>
        </div>

        {/* Ship To */}
        <div style={{ flex: 1, border, borderRadius: 6, padding: '16px 20px', backgroundColor: lightBg }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8 }}>
            Ship To
          </div>
          <div style={{ fontWeight: 700, fontSize: 15, color: '#111827', marginBottom: 4 }}>
            {order.shippingAddress?.fullName}
          </div>
          <div style={{ fontSize: 12, color: '#4b5563', lineHeight: 1.7 }}>
            <div>{order.shippingAddress?.addressLine1}</div>
            {order.shippingAddress?.addressLine2 && <div>{order.shippingAddress.addressLine2}</div>}
            <div>
              {order.shippingAddress?.city}, {order.shippingAddress?.state} – {order.shippingAddress?.pinCode}
            </div>
            <div>{order.shippingAddress?.country}</div>
            {order.shippingPhone && <div>Ph: {order.shippingPhone}</div>}
          </div>
        </div>
      </div>

      {/* ====== ITEMS TABLE ====== */}
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          marginBottom: 0,
          fontSize: 12,
        }}
      >
        <thead>
          <tr style={{ backgroundColor: headerBg }}>
            {['#', 'Product', 'HSN', 'Qty', 'Unit Price', 'Amount'].map((h, i) => (
              <th
                key={h}
                style={{
                  padding: '10px 14px',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: 11,
                  textTransform: 'uppercase',
                  letterSpacing: 0.8,
                  textAlign: i >= 3 ? 'right' : 'left',
                  borderBottom: 'none',
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {order.items.map((item, idx) => (
            <tr key={item.id} style={{ backgroundColor: idx % 2 === 0 ? '#ffffff' : lightBg }}>
              <td style={{ padding: '12px 14px', borderBottom: border, color: '#6b7280', fontWeight: 600 }}>
                {idx + 1}
              </td>
              <td style={{ padding: '12px 14px', borderBottom: border }}>
                <div style={{ fontWeight: 700, color: '#111827', marginBottom: 2 }}>{item.product?.name}</div>
                <div style={{ fontSize: 11, color: '#6b7280' }}>
                  {item.product?.brand}
                  {item.product?.volume ? ` · ${item.product.volume}ml` : ''}
                </div>
              </td>
              <td style={{ padding: '12px 14px', borderBottom: border, color: '#6b7280', fontSize: 11 }}>
                33030010
              </td>
              <td style={{ padding: '12px 14px', borderBottom: border, textAlign: 'right', fontWeight: 600, color: '#111827' }}>
                {item.quantity}
              </td>
              <td style={{ padding: '12px 14px', borderBottom: border, textAlign: 'right', color: '#4b5563' }}>
                {fmt(item.price)}
              </td>
              <td style={{ padding: '12px 14px', borderBottom: border, textAlign: 'right', fontWeight: 700, color: '#111827' }}>
                {fmt(item.price * item.quantity)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* ====== SUMMARY ====== */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 0, marginBottom: 24 }}>
        <div style={{ width: 320 }}>
          <table style={{ width: '100%', fontSize: 13 }}>
            <tbody>
              <tr>
                <td style={{ padding: '8px 0', color: '#6b7280' }}>Subtotal</td>
                <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: 600, color: '#111827' }}>{fmt(subtotal)}</td>
              </tr>
              {shipping > 0 && (
                <tr>
                  <td style={{ padding: '8px 0', color: '#6b7280' }}>Shipping</td>
                  <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: 600, color: '#111827' }}>{fmt(shipping)}</td>
                </tr>
              )}
              {shipping === 0 && (
                <tr>
                  <td style={{ padding: '8px 0', color: '#6b7280' }}>Shipping</td>
                  <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: 600, color: '#16a34a' }}>FREE</td>
                </tr>
              )}
              {discount > 0 && (
                <tr>
                  <td style={{ padding: '8px 0', color: '#16a34a' }}>Discount</td>
                  <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: 600, color: '#16a34a' }}>− {fmt(discount)}</td>
                </tr>
              )}
              {/* Divider */}
              <tr>
                <td colSpan={2} style={{ borderTop: `2px solid ${headerBg}`, padding: 0, height: 0 }} />
              </tr>
              <tr>
                <td style={{ padding: '12px 0', fontSize: 16, fontWeight: 800, color: '#111827' }}>Grand Total</td>
                <td style={{ padding: '12px 0', textAlign: 'right', fontSize: 18, fontWeight: 800, color: '#111827' }}>
                  {fmt(total)}
                </td>
              </tr>
            </tbody>
          </table>
          {/* Amount in words */}
          <div style={{ fontSize: 10, color: '#6b7280', marginTop: 2, fontStyle: 'italic' }}>
            Amount in words: <span style={{ fontWeight: 600, color: '#374151' }}>{numToWords(total)}</span>
          </div>
        </div>
      </div>

      {/* ====== PAYMENT INFO ====== */}
      <div
        style={{
          display: 'flex',
          gap: 24,
          marginBottom: 28,
          border,
          borderRadius: 6,
          padding: '14px 20px',
          backgroundColor: lightBg,
        }}
      >
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 10, color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>
            Payment Method
          </div>
          <div style={{ fontWeight: 700, color: '#111827', fontSize: 14 }}>
            {order.paymentMethod?.replace('_', ' ')}
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 10, color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>
            Order Status
          </div>
          <div style={{ fontWeight: 700, color: '#111827', fontSize: 14 }}>
            {order.status?.replace(/_/g, ' ')}
          </div>
        </div>
        <div style={{ flex: 1, textAlign: 'right' }}>
          <div style={{ fontSize: 10, color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>
            Website
          </div>
          <div style={{ fontWeight: 600, color: accentColor, fontSize: 13 }}>{c.website}</div>
        </div>
      </div>

      {/* ====== FOOTER ====== */}
      <div style={{ borderTop: `1px solid #e5e7eb`, paddingTop: 20 }}>
        {/* Terms */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
            Terms &amp; Conditions
          </div>
          <ul style={{ margin: 0, paddingLeft: 16, fontSize: 11, color: '#6b7280', lineHeight: 1.8 }}>
            <li>Goods once sold cannot be taken back or exchanged.</li>
            <li>All disputes are subject to Ambur, Tamil Nadu jurisdiction.</li>
            <li>Please inspect the product upon delivery before acceptance.</li>
            <li>E&amp;OE — Errors and Omissions Excepted.</li>
          </ul>
        </div>

        {/* Signature area */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 24 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ borderBottom: '1px solid #d1d5db', width: 180, marginBottom: 6 }} />
            <div style={{ fontSize: 11, fontWeight: 600, color: '#4b5563' }}>Authorized Signatory</div>
            <div style={{ fontSize: 10, color: '#9ca3af' }}>MUWAS PERFUMES</div>
          </div>
        </div>

        {/* Thank you */}
        <div style={{ textAlign: 'center', paddingTop: 12, borderTop: '1px solid #e5e7eb' }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#111827', marginBottom: 4 }}>
            Thank you for shopping with MUWAS!
          </div>
          <div style={{ fontSize: 11, color: '#9ca3af' }}>
            {c.email} &nbsp;|&nbsp; {c.phone} &nbsp;|&nbsp; {c.website}
          </div>
          <div style={{ fontSize: 10, color: '#b0b0b0', marginTop: 8 }}>
            This is a computer-generated invoice and does not require a physical signature.
          </div>
        </div>
      </div>
    </div>
  );
});

Invoice.displayName = 'Invoice';

export default Invoice;
