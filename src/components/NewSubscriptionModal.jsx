import React, { useState } from 'react';
import { X, Plus, Trash2, Tag, Sparkles, FileText, CheckCircle2 } from 'lucide-react';

export default function NewSubscriptionModal({
  currentUser,
  products,
  plans,
  users,
  templates,
  discounts,
  onClose,
  onCreate
}) {
  const isCustomer = currentUser?.role === 'customer';

  // Form State
  const [selectedCustomerId, setSelectedCustomerId] = useState(
    isCustomer ? currentUser.id : (users.find(u => u.role === 'customer')?.id || '')
  );
  const [selectedPlanId, setSelectedPlanId] = useState(plans[0]?.id || '');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [expiryDate, setExpiryDate] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('Net 15');
  const [status, setStatus] = useState(isCustomer ? 'quotation' : 'draft');
  const [appliedDiscountId, setAppliedDiscountId] = useState('');
  const [notes, setNotes] = useState('');

  // Line items state
  const [lines, setLines] = useState([
    {
      product_id: products[0]?.id || '',
      variant_id: products[0]?.variants?.[0]?.id || '',
      quantity: 1,
      unit_price: products[0]?.sales_price || 0,
      tax_rate: 18,
      discount_rate: 0
    }
  ]);

  // Load from quotation template
  const handleSelectTemplate = (templateId) => {
    const t = templates.find(item => item.id === parseInt(templateId));
    if (!t) return;

    if (t.plan_id) setSelectedPlanId(t.plan_id);

    // Calculate expiry from validity days
    if (t.validity_days) {
      const exp = new Date();
      exp.setDate(exp.getDate() + t.validity_days);
      setExpiryDate(exp.toISOString().split('T')[0]);
    }

    if (t.lines && t.lines.length > 0) {
      setLines(t.lines.map(l => ({
        product_id: l.product_id,
        variant_id: l.variant_id || '',
        quantity: l.quantity || 1,
        unit_price: l.unit_price,
        tax_rate: l.tax_rate || 18,
        discount_rate: 0
      })));
    }
    setNotes(t.notes || `Loaded from template: ${t.name}`);
  };

  const handleProductChange = (index, prodId) => {
    const prod = products.find(p => p.id === parseInt(prodId));
    if (!prod) return;

    const updated = [...lines];
    const defaultVariant = prod.variants && prod.variants.length > 0 ? prod.variants[0] : null;
    const variantAdjustment = defaultVariant ? defaultVariant.price_adjustment : 0;

    updated[index] = {
      ...updated[index],
      product_id: prod.id,
      variant_id: defaultVariant ? defaultVariant.id : '',
      unit_price: prod.sales_price + variantAdjustment,
      tax_rate: 18
    };
    setLines(updated);
  };

  const handleVariantChange = (index, variantId) => {
    const updated = [...lines];
    const currentLine = updated[index];
    const prod = products.find(p => p.id === parseInt(currentLine.product_id));
    if (!prod) return;

    const variant = prod.variants.find(v => v.id === parseInt(variantId));
    const priceAdjustment = variant ? variant.price_adjustment : 0;

    updated[index] = {
      ...currentLine,
      variant_id: variantId ? parseInt(variantId) : '',
      unit_price: prod.sales_price + priceAdjustment
    };
    setLines(updated);
  };

  const handleQuantityChange = (index, qty) => {
    const updated = [...lines];
    updated[index].quantity = Math.max(1, parseInt(qty) || 1);
    setLines(updated);
  };

  const handleAddLine = () => {
    if (products.length === 0) return;
    const p = products[0];
    const v = p.variants?.[0];
    setLines([
      ...lines,
      {
        product_id: p.id,
        variant_id: v?.id || '',
        quantity: 1,
        unit_price: p.sales_price + (v?.price_adjustment || 0),
        tax_rate: 18,
        discount_rate: 0
      }
    ]);
  };

  const handleRemoveLine = (index) => {
    if (lines.length <= 1) return;
    setLines(lines.filter((_, i) => i !== index));
  };

  // Live calculation
  let subtotal = 0;
  let taxTotal = 0;
  lines.forEach(line => {
    const lineSub = line.quantity * line.unit_price;
    subtotal += lineSub;
    taxTotal += lineSub * (line.tax_rate / 100);
  });

  const selectedDiscount = discounts.find(d => d.id === parseInt(appliedDiscountId));
  let discountAmount = 0;
  if (selectedDiscount) {
    if (selectedDiscount.type === 'percentage') {
      discountAmount = subtotal * (selectedDiscount.value / 100);
    } else {
      discountAmount = Math.min(selectedDiscount.value, subtotal);
    }
  }

  const grandTotal = Math.max(0, subtotal - discountAmount + taxTotal);

  const handleSubmit = (e) => {
    e.preventDefault();
    onCreate({
      customer_id: parseInt(selectedCustomerId),
      plan_id: parseInt(selectedPlanId),
      start_date: startDate,
      expiry_date: expiryDate || null,
      payment_terms: paymentTerms,
      status: status,
      applied_discount_id: appliedDiscountId ? parseInt(appliedDiscountId) : null,
      notes: notes,
      lines: lines.map(l => ({
        product_id: parseInt(l.product_id),
        variant_id: l.variant_id ? parseInt(l.variant_id) : null,
        quantity: parseInt(l.quantity),
        unit_price: parseFloat(l.unit_price),
        tax_rate: parseFloat(l.tax_rate),
        discount_rate: parseFloat(l.discount_rate || 0)
      }))
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white border-2 border-tinker-border rounded-2xl w-full max-w-2xl p-5 sm:p-7 shadow-neo max-h-[92vh] overflow-y-auto relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-zinc-500 hover:text-black rounded-lg hover:bg-zinc-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-xl font-black text-black">Create Subscription / Quote</h2>
        <p className="text-xs text-zinc-500 mb-4">
          Quote-to-subscription pipeline &bull; Select template or configure custom line items
        </p>

        {/* Template Quick Loader */}
        {templates.length > 0 && !isCustomer && (
          <div className="mb-4 p-3 bg-tinker-yellow-light border-2 border-tinker-yellow rounded-xl">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900 mb-1">
              <FileText className="w-3.5 h-3.5" />
              <span>Speed up with Quotation Template:</span>
            </div>
            <select
              onChange={e => handleSelectTemplate(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-white border border-amber-300 rounded-lg text-xs font-medium focus:outline-none"
              defaultValue=""
            >
              <option value="" disabled>Choose a template to pre-fill lines &amp; plan...</option>
              {templates.map(t => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.lines?.length || 0} items &bull; valid {t.validity_days} days)
                </option>
              ))}
            </select>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Customer & Plan */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-zinc-700">Customer</label>
              {isCustomer ? (
                <div className="mt-1 p-2 bg-zinc-100 rounded-lg font-bold text-zinc-800">
                  {currentUser.name} ({currentUser.email})
                </div>
              ) : (
                <select
                  required
                  value={selectedCustomerId}
                  onChange={e => setSelectedCustomerId(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border-2 border-zinc-300 rounded-xl font-medium focus:outline-none focus:border-black"
                >
                  <option value="" disabled>Select customer...</option>
                  {users.filter(u => u.role === 'customer').map(u => (
                    <option key={u.id} value={u.id}>
                      {u.name} - {u.company_name || u.email}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="font-bold text-zinc-700">Billing Plan</label>
              <select
                required
                value={selectedPlanId}
                onChange={e => setSelectedPlanId(e.target.value)}
                className="w-full mt-1 px-3 py-2 border-2 border-zinc-300 rounded-xl font-medium focus:outline-none focus:border-black"
              >
                {plans.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} (${p.cost}/{p.billing_interval})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Dates & Payment Terms */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div>
              <label className="font-bold text-zinc-700">Start Date</label>
              <input
                type="date"
                required
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="w-full mt-1 px-2.5 py-1.5 border-2 border-zinc-300 rounded-xl font-medium"
              />
            </div>
            <div>
              <label className="font-bold text-zinc-700">Expiry Date (Optional)</label>
              <input
                type="date"
                value={expiryDate}
                onChange={e => setExpiryDate(e.target.value)}
                className="w-full mt-1 px-2.5 py-1.5 border-2 border-zinc-300 rounded-xl font-medium"
              />
            </div>
            <div>
              <label className="font-bold text-zinc-700">Payment Terms</label>
              <select
                value={paymentTerms}
                onChange={e => setPaymentTerms(e.target.value)}
                className="w-full mt-1 px-2.5 py-1.5 border-2 border-zinc-300 rounded-xl font-medium"
              >
                <option value="Immediate">Due Immediate</option>
                <option value="Net 15">Net 15</option>
                <option value="Net 30">Net 30</option>
              </select>
            </div>
          </div>

          {/* Initial Status */}
          {!isCustomer && (
            <div>
              <label className="font-bold text-zinc-700">Initial Pipeline Stage</label>
              <div className="grid grid-cols-3 gap-2 mt-1">
                {['draft', 'quotation', 'active'].map(st => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setStatus(st)}
                    className={`py-1.5 px-2 rounded-lg font-bold capitalize border-2 text-center transition ${
                      status === st
                        ? 'bg-tinker-yellow text-black border-black shadow-neo-sm'
                        : 'bg-zinc-50 text-zinc-600 border-zinc-200'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Product Line Items */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-black text-sm text-black">Product Lines</label>
              <button
                type="button"
                onClick={handleAddLine}
                className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Product
              </button>
            </div>

            <div className="space-y-2">
              {lines.map((line, idx) => {
                const prod = products.find(p => p.id === parseInt(line.product_id));
                const variants = prod?.variants || [];

                return (
                  <div key={idx} className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      {/* Product Selector */}
                      <select
                        value={line.product_id}
                        onChange={e => handleProductChange(idx, e.target.value)}
                        className="flex-1 px-2.5 py-1.5 border border-zinc-300 rounded-lg font-bold"
                      >
                        {products.map(p => (
                          <option key={p.id} value={p.id}>
                            {p.name} (Base: ${p.sales_price})
                          </option>
                        ))}
                      </select>

                      {/* Remove Line */}
                      {lines.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveLine(idx)}
                          className="p-1.5 text-zinc-400 hover:text-red-600 rounded-lg hover:bg-zinc-200"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      {/* Variant Selector */}
                      <div>
                        <label className="text-[10px] text-zinc-500 font-bold">Variant / Brand</label>
                        <select
                          value={line.variant_id}
                          onChange={e => handleVariantChange(idx, e.target.value)}
                          className="w-full mt-0.5 px-2 py-1 border border-zinc-300 rounded-lg text-xs"
                        >
                          <option value="">No Variant</option>
                          {variants.map(v => (
                            <option key={v.id} value={v.id}>
                              {v.variant_name} (+${v.price_adjustment})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Quantity */}
                      <div>
                        <label className="text-[10px] text-zinc-500 font-bold">Quantity</label>
                        <input
                          type="number"
                          min="1"
                          value={line.quantity}
                          onChange={e => handleQuantityChange(idx, e.target.value)}
                          className="w-full mt-0.5 px-2 py-1 border border-zinc-300 rounded-lg text-xs"
                        />
                      </div>

                      {/* Unit Price */}
                      <div>
                        <label className="text-[10px] text-zinc-500 font-bold">Unit Price ($)</label>
                        <input
                          type="number"
                          readOnly
                          value={line.unit_price}
                          className="w-full mt-0.5 px-2 py-1 bg-zinc-100 border border-zinc-200 rounded-lg text-xs font-bold"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Discount Rule Code */}
          <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-3">
            <label className="font-bold text-emerald-950 flex items-center gap-1">
              <Tag className="w-3.5 h-3.5 text-emerald-700" />
              Apply Discount Rule
            </label>
            <select
              value={appliedDiscountId}
              onChange={e => setAppliedDiscountId(e.target.value)}
              className="w-full mt-1.5 px-3 py-1.5 bg-white border border-emerald-300 rounded-lg text-xs font-medium"
            >
              <option value="">No discount applied</option>
              {discounts.filter(d => d.is_active && d.times_used < d.usage_limit).map(d => (
                <option key={d.id} value={d.id}>
                  {d.code} - {d.name} ({d.type === 'percentage' ? `${d.value}%` : `$${d.value}`} OFF)
                </option>
              ))}
            </select>
          </div>

          {/* Total Summary */}
          <div className="p-3 bg-zinc-100 rounded-xl space-y-1 text-xs">
            <div className="flex justify-between text-zinc-600">
              <span>Subtotal:</span>
              <span className="font-semibold">${subtotal.toFixed(2)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-emerald-700 font-semibold">
                <span>Discount:</span>
                <span>-${discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-zinc-600">
              <span>Estimated Tax (18%):</span>
              <span className="font-semibold">${taxTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-base font-black text-black pt-1 border-t border-zinc-300">
              <span>Total Quotation Amount:</span>
              <span>${grandTotal.toFixed(2)}</span>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-zinc-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-zinc-600 hover:bg-zinc-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-tinker-yellow hover:bg-tinker-yellow-hover text-black font-black text-xs rounded-xl border-2 border-tinker-border shadow-neo-sm neo-btn"
            >
              {isCustomer ? 'Submit Quote Request' : 'Create Subscription'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
