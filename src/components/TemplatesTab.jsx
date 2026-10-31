import React, { useState } from 'react';
import { FileSpreadsheet, Plus, ArrowRight, Clock, Package, Check, Tag } from 'lucide-react';

export default function TemplatesTab({
  templates,
  products,
  plans,
  currentUser,
  onCreateTemplate,
  onApplyTemplateToQuote
}) {
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [planId, setPlanId] = useState(plans[0]?.id || '');
  const [validityDays, setValidityDays] = useState(15);
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState([
    { product_id: products[0]?.id || '', variant_id: products[0]?.variants?.[0]?.id || '', quantity: 1, unit_price: products[0]?.sales_price || 0 }
  ]);

  const isAdminOrStaff = currentUser?.role === 'admin' || currentUser?.role === 'staff';

  const handleAddLine = () => {
    if (products.length === 0) return;
    const p = products[0];
    setLines([...lines, { product_id: p.id, variant_id: p.variants?.[0]?.id || '', quantity: 1, unit_price: p.sales_price }]);
  };

  const handleProductChange = (idx, prodId) => {
    const p = products.find(prod => prod.id === parseInt(prodId));
    if (!p) return;
    const updated = [...lines];
    updated[idx] = {
      product_id: p.id,
      variant_id: p.variants?.[0]?.id || '',
      quantity: 1,
      unit_price: p.sales_price
    };
    setLines(updated);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onCreateTemplate({
      name,
      plan_id: parseInt(planId),
      validity_days: parseInt(validityDays),
      notes,
      lines: lines.map(l => ({
        product_id: parseInt(l.product_id),
        variant_id: l.variant_id ? parseInt(l.variant_id) : null,
        quantity: parseInt(l.quantity),
        unit_price: parseFloat(l.unit_price)
      }))
    });
    setShowModal(false);
    setName('');
    setNotes('');
  };

  return (
    <div className="space-y-4 pb-12 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white border-2 border-tinker-border rounded-2xl p-4 shadow-neo-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase tracking-wider text-tinker-purple bg-tinker-purple-soft px-2 py-0.5 rounded border border-purple-200">
              Quotation Accelerators
            </span>
            <span className="text-xs text-zinc-500 font-semibold">&bull; Brightloop Sales Toolkit</span>
          </div>
          <h1 className="text-xl font-black text-black mt-1">Quotation Templates</h1>
          <p className="text-xs text-zinc-600 font-medium">
            Pre-configured offers with bundled product lines, predefined plans, and validity duration.
          </p>
        </div>

        {isAdminOrStaff && (
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-tinker-yellow hover:bg-tinker-yellow-hover text-black font-black text-xs rounded-xl border-2 border-tinker-border shadow-neo-sm hover:shadow-neo transition flex items-center gap-1.5 neo-btn"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>New Template</span>
          </button>
        )}
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {templates.map(t => (
          <div key={t.id} className="bg-white border-2 border-tinker-border rounded-2xl p-5 shadow-neo-sm hover:shadow-neo transition flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-base font-black text-black">{t.name}</h3>
                  <div className="text-xs text-zinc-500 font-semibold mt-0.5 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Valid for <b>{t.validity_days} days</b></span>
                    <span className="text-zinc-300">&bull;</span>
                    <span className="text-tinker-purple font-bold">{t.plan_name} (${t.plan_cost}/{t.billing_interval})</span>
                  </div>
                </div>
                <div className="w-8 h-8 rounded-lg bg-zinc-100 border border-zinc-300 flex items-center justify-center font-black text-xs">
                  📋
                </div>
              </div>

              {t.notes && (
                <p className="text-xs text-zinc-600 mt-2 bg-zinc-50 p-2 rounded-lg border border-zinc-200">
                  {t.notes}
                </p>
              )}

              {/* Line items list */}
              <div className="mt-4 space-y-1.5">
                <div className="text-[11px] font-black uppercase text-zinc-400">Bundled Products:</div>
                {(t.lines || []).map((l, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs p-2 bg-zinc-50 border border-zinc-200 rounded-lg">
                    <div className="font-bold text-zinc-800">
                      <span>{l.quantity}x {l.product_name}</span>
                      {l.variant_name && (
                        <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-1 py-0.2 rounded ml-1.5 border border-amber-300">
                          {l.variant_name}
                        </span>
                      )}
                    </div>
                    <div className="font-black text-zinc-900">
                      ${(l.quantity * l.unit_price).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-zinc-100 flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-500">
                {(t.lines || []).length} bundled item(s)
              </span>
              <button
                onClick={() => onApplyTemplateToQuote(t)}
                className="px-3.5 py-1.5 bg-tinker-lime hover:bg-lime-300 text-black font-black text-xs rounded-xl border-2 border-tinker-border shadow-neo-sm transition flex items-center gap-1.5 neo-btn"
              >
                <span>Create Quote From Template</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* New Template Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border-2 border-tinker-border rounded-2xl w-full max-w-lg p-6 shadow-neo max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-black text-black mb-1">Create Quotation Template</h2>
            <p className="text-xs text-zinc-500 mb-4">Define standard bundle to accelerate quotes</p>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-zinc-700">Template Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mid-Market Growth Bundle"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border-2 border-zinc-300 rounded-xl font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-zinc-700">Associated Plan</label>
                  <select
                    value={planId}
                    onChange={e => setPlanId(e.target.value)}
                    className="w-full mt-1 px-2.5 py-2 border-2 border-zinc-300 rounded-xl font-medium"
                  >
                    {plans.map(p => (
                      <option key={p.id} value={p.id}>{p.name} (${p.cost}/{p.billing_interval})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-bold text-zinc-700">Validity (Days)</label>
                  <input
                    type="number"
                    min="1"
                    value={validityDays}
                    onChange={e => setValidityDays(e.target.value)}
                    className="w-full mt-1 px-3 py-2 border-2 border-zinc-300 rounded-xl font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-zinc-700">Notes / Terms</label>
                <textarea
                  rows="2"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Notes about proposal validity and SLA guarantees..."
                  className="w-full mt-1 px-3 py-2 border-2 border-zinc-300 rounded-xl font-medium"
                />
              </div>

              {/* Product Lines */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-zinc-700">Products Included</label>
                  <button type="button" onClick={handleAddLine} className="font-bold text-blue-600 hover:underline">
                    + Add Product
                  </button>
                </div>
                <div className="space-y-2">
                  {lines.map((l, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <select
                        value={l.product_id}
                        onChange={e => handleProductChange(idx, e.target.value)}
                        className="flex-1 px-2.5 py-1.5 border border-zinc-300 rounded-lg"
                      >
                        {products.map(p => (
                          <option key={p.id} value={p.id}>{p.name} (${p.sales_price})</option>
                        ))}
                      </select>
                      <input
                        type="number"
                        min="1"
                        value={l.quantity}
                        onChange={e => {
                          const updated = [...lines];
                          updated[idx].quantity = e.target.value;
                          setLines(updated);
                        }}
                        className="w-16 px-2 py-1.5 border border-zinc-300 rounded-lg text-center font-bold"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 font-bold text-zinc-600 hover:bg-zinc-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-tinker-yellow hover:bg-tinker-yellow-hover text-black font-black rounded-xl border-2 border-tinker-border shadow-neo-sm neo-btn"
                >
                  Save Template
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
