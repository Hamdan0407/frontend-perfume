import { forwardRef } from 'react';
import { format } from 'date-fns';
import { Sparkles, Phone, Mail, MapPin, Globe, Package, User } from 'lucide-react';
import { Separator } from './ui/separator';

const Invoice = forwardRef(({ order, company }, ref) => {
  const defaultCompany = {
    name: 'Parfumé',
    tagline: 'Luxury Fragrances & Premium Scents',
    address: '123 Perfume Lane, Fragrance District',
    city: 'Mumbai, Maharashtra 400001',
    country: 'India',
    phone: '+91 9894722186',
    email: 'muwas2021@gmail.com',
    website: 'www.parfume.com',
    gst: 'GSTIN: 27AAAAA0000A1Z5',
    pan: 'PAN: AAAAA0000A',
    ...company
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (date) => {
    return format(new Date(date), 'dd MMM yyyy');
  };

  const calculateSubtotal = () => {
    return order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const getDiscount = () => {
    const subtotal = calculateSubtotal();
    return subtotal + (order.shippingCharge || 0) - order.finalAmount;
  };

  return (
    <div ref={ref} className="bg-white p-12 max-w-5xl mx-auto print:p-8" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Modern Header */}
      <div className="mb-10">
        <div className="flex justify-between items-start mb-8">
          {/* Company Branding */}
          <div className="space-y-3">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-primary p-2.5 rounded-xl shadow-lg">
                <Sparkles className="h-7 w-7 text-accent" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-primary">
                  {defaultCompany.name}
                </h1>
                <p className="text-sm text-muted-foreground font-medium mt-0.5">{defaultCompany.tagline}</p>
              </div>
            </div>
          </div>
          
          {/* Invoice Info Card */}
          <div className="bg-secondary rounded-2xl p-6 shadow-sm border border-border">
            <div className="flex justify-end mb-3">
              <div className="bg-primary text-white px-5 py-2 rounded-lg">
                <h2 className="text-lg font-bold tracking-wide">TAX INVOICE</h2>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center gap-6">
                <span className="font-semibold text-muted-foreground">Invoice No:</span>
                <span className="text-foreground font-bold font-mono">{order.orderNumber}</span>
              </div>
              <div className="flex justify-between items-center gap-6">
                <span className="font-semibold text-muted-foreground">Date:</span>
                <span className="text-foreground font-semibold">{formatDate(order.createdAt)}</span>
              </div>
              <div className="flex justify-between items-center gap-6">
                <span className="font-semibold text-muted-foreground">Status:</span>
                <span className="inline-block bg-gradient-to-r from-green-500 to-emerald-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                  {order.status.replace('_', ' ')}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Company Contact Info */}
        <div className="grid grid-cols-3 gap-4 text-xs text-muted-foreground bg-secondary rounded-xl p-4 border border-border">
          <div className="flex items-center gap-2">
            <MapPin className="h-3.5 w-3.5 text-accent" />
            <div>
              <div className="font-medium">{defaultCompany.address}</div>
              <div>{defaultCompany.city}, {defaultCompany.country}</div>
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Phone className="h-3.5 w-3.5 text-accent" />
              <span className="font-medium">{defaultCompany.phone}</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="h-3.5 w-3.5 text-accent" />
              <span className="font-medium">{defaultCompany.email}</span>
            </div>
          </div>
          <div className="space-y-1 text-right">
            <div className="flex items-center justify-end gap-2">
              <Globe className="h-3.5 w-3.5 text-accent" />
              <span className="font-medium">{defaultCompany.website}</span>
            </div>
            <div className="text-xs">
              <div>{defaultCompany.gst}</div>
              <div>{defaultCompany.pan}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Bill To / Ship To Section */}
      <div className="grid md:grid-cols-2 gap-6 mb-10">
        {/* Bill To */}
        <div className="bg-secondary border-2 border-border rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="bg-primary p-1.5 rounded-lg">
              <User className="h-4 w-4 text-accent" />
            </div>
            <h3 className="font-bold text-foreground text-sm uppercase tracking-wide">Bill To</h3>
          </div>
          <div className="space-y-2 text-sm">
            <p className="font-bold text-foreground text-lg">{order.user?.firstName} {order.user?.lastName}</p>
            <p className="text-muted-foreground">{order.user?.email}</p>
            {order.user?.phone && <p className="text-muted-foreground">{order.user.phone}</p>}
          </div>
        </div>

        {/* Ship To */}
        <div className="bg-secondary border-2 border-border rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="bg-accent p-1.5 rounded-lg">
              <Package className="h-4 w-4 text-white" />
            </div>
            <h3 className="font-bold text-foreground text-sm uppercase tracking-wide">Ship To</h3>
          </div>
          <div className="space-y-2 text-sm">
            <p className="font-bold text-foreground text-lg">{order.shippingAddress?.fullName}</p>
            <p className="text-muted-foreground">{order.shippingAddress?.addressLine1}</p>
            {order.shippingAddress?.addressLine2 && (
              <p className="text-muted-foreground">{order.shippingAddress.addressLine2}</p>
            )}
            <p className="text-muted-foreground">
              {order.shippingAddress?.city}, {order.shippingAddress?.state} {order.shippingAddress?.pinCode}
            </p>
            <p className="text-muted-foreground">{order.shippingAddress?.country}</p>
            {order.shippingAddress?.phone && (
              <p className="text-muted-foreground">📱 {order.shippingAddress.phone}</p>
            )}
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div className="mb-8">
        <div className="overflow-hidden border-2 border-border rounded-2xl shadow-sm">
          <table className="w-full">
            <thead>
              <tr className="bg-primary">
                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                  #
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                  Product Details
                </th>
                <th className="px-6 py-4 text-center text-xs font-bold text-white uppercase tracking-wider">
                  Qty
                </th>
                <th className="px-6 py-4 text-right text-xs font-bold text-white uppercase tracking-wider">
                  Unit Price
                </th>
                <th className="px-6 py-4 text-right text-xs font-bold text-white uppercase tracking-wider">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {order.items.map((item, index) => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-5 text-sm font-semibold text-gray-600">
                    {index + 1}
                  </td>
                  <td className="px-6 py-5">
                    <div className="space-y-1">
                      <p className="font-bold text-foreground text-base">{item.product?.name}</p>
                      <p className="text-sm text-muted-foreground">{item.product?.brand}</p>
                      {item.product?.volume && (
                        <span className="inline-block bg-accent/10 text-accent text-xs font-semibold px-2.5 py-1 rounded-full">
                          {item.product.volume}ml
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <span className="inline-block bg-secondary text-foreground font-bold px-4 py-2 rounded-lg text-sm">
                      {item.quantity}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-right text-sm font-semibold text-foreground">
                    {formatCurrency(item.price)}
                  </td>
                  <td className="px-6 py-5 text-right text-base font-bold text-foreground">
                    {formatCurrency(item.price * item.quantity)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Summary */}
      <div className="flex justify-end mb-10">
        <div className="w-full md:w-1/2 lg:w-2/5">
          <div className="bg-secondary rounded-2xl border-2 border-border shadow-sm overflow-hidden">
            <div className="p-6 space-y-3 text-sm">
              <div className="flex justify-between items-center py-2 text-muted-foreground">
                <span className="font-medium">Subtotal:</span>
                <span className="font-semibold text-foreground tabular-nums">{formatCurrency(calculateSubtotal())}</span>
              </div>
              
              {order.shippingCharge > 0 && (
                <div className="flex justify-between items-center py-2 text-muted-foreground">
                  <span className="font-medium">Shipping Charge:</span>
                  <span className="font-semibold text-foreground tabular-nums">{formatCurrency(order.shippingCharge)}</span>
                </div>
              )}
              
              {getDiscount() > 0 && (
                <div className="flex justify-between items-center py-2 text-green-600 dark:text-green-400">
                  <span className="font-medium">Discount:</span>
                  <span className="font-semibold tabular-nums">- {formatCurrency(getDiscount())}</span>
                </div>
              )}
              
              <div className="flex justify-between items-center py-2 text-muted-foreground">
                <span className="font-medium">GST (18%):</span>
                <span className="font-semibold text-foreground tabular-nums">{formatCurrency(Math.round(calculateSubtotal() * 0.18))}</span>
              </div>
            </div>
            
            <div className="border-t-2 border-border"></div>
            
            <div className="bg-gradient-to-r from-primary via-primary to-slate-900 px-6 py-5">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-lg tracking-wide">Total Amount</span>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-accent font-bold text-2xl">₹</span>
                  <span className="font-bold text-3xl text-white tabular-nums tracking-tight">
                    {order.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Method */}
      <div className="mb-8 bg-secondary border-2 border-border rounded-2xl p-6 shadow-sm">
        <h3 className="font-bold text-foreground mb-4 text-sm uppercase tracking-wide flex items-center gap-2">
          <div className="bg-accent p-1.5 rounded-lg">
            <span className="text-white text-xs">💳</span>
          </div>
          Payment Information
        </h3>
        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <div className="bg-background rounded-lg p-3 border border-border">
            <span className="text-muted-foreground block mb-1">Payment Method</span>
            <span className="font-bold text-foreground text-base">{order.paymentMethod?.replace('_', ' ')}</span>
          </div>
          <div className="bg-background rounded-lg p-3 border border-border">
            <span className="text-muted-foreground block mb-1">Payment Status</span>
            <span className={`inline-block font-bold text-sm px-3 py-1 rounded-full ${
              order.paymentStatus === 'PAID' 
                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
            }`}>
              {order.paymentStatus}
            </span>
          </div>
        </div>
      </div>

      {/* Terms & Footer */}
      <div className="border-t-2 border-border pt-8 space-y-6">
        <div className="bg-secondary rounded-2xl p-6 border border-border">
          <h3 className="font-bold text-foreground mb-3 text-sm uppercase tracking-wide">Terms & Conditions</h3>
          <ul className="text-xs text-muted-foreground space-y-2 leading-relaxed">
            <li className="flex items-start gap-2">
              <span className="text-accent font-bold">•</span>
              <span>Goods once sold cannot be taken back or exchanged</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-accent font-bold">•</span>
              <span>All disputes subject to jurisdiction</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-accent font-bold">•</span>
              <span>Please check the product before accepting delivery</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-accent font-bold">•</span>
              <span>This is a computer generated invoice and does not require a signature</span>
            </li>
          </ul>
        </div>
        
        <div className="text-center pt-6 space-y-3">
          <div className="inline-block bg-primary text-white font-bold px-8 py-3 rounded-full shadow-lg">
            Thank you for shopping with us! 🎉
          </div>
          <p className="text-xs text-muted-foreground">We appreciate your business and look forward to serving you again</p>
          <p className="text-xs text-muted-foreground mt-2">
            Need help? Contact us at {defaultCompany.email} or call {defaultCompany.phone}
          </p>
        </div>
      </div>
    </div>
  );
});

Invoice.displayName = 'Invoice';

export default Invoice;
