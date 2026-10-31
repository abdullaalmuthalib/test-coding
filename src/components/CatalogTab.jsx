import React, { useState } from 'react';
import {
  Package, Plus, Tag, Check, Calendar, Settings2, Sparkles, AlertCircle
} from 'lucide-react';

export default function CatalogTab({
  products,
  plans,
  currentUser,
  onCreateProduct,
  onCreatePlan
}) {
  const [activeSubTab, setActiveSubTab] = useState('products');
  const [showNewProductModal, setShowNewProductModal] = useState(false);
  const [showNewPlanModal, setShowNewPlanModal] = useState(false);

  // New Product Form State
  const [newProdName, setNewProdName] = useState('');
  const [newProdType, setNewProdType] = useState('software');
  const [newProdSalesPrice, setNewProdSalesPrice] = useState('');
  const [newProdCostPrice, setNewProdCostPrice] = useState('');
  const [newProdNotes, setNewProdNotes] = useState('');
  const [newProdVariants, setNewProdVariants] = useState([
    { variant_name: 'Standard Edition', price_adjustment: 0 },
    { variant_name: 'Odoo Brand Edition', price_adjustment: 560 }
  ]);

  // New Plan Form State
  const [newPlanName, setNewPlanName] = useState('');
  const [newPlanCost, setNewPlanCost] = useState('');
  const [newPlanInterval, setNewPlanInterval] = useState('monthly');
  const [newPlanMinQty, setNewPlanMinQty] = useState(1);
  const [newPlanAutoClose, setNewPlanAutoClose] = useState(false);
  const [newPlanAllowCloseEarly, setNewPlanAllowCloseEarly] = useState(true);
  const [newPlanAllowPause, setNewPlanAllowPause] = useState(true);
  const [newPlanAllowRenew, setNewPlanAllowRenew] = useState(true);

  const isAdmin = currentUser?.role === 'admin';

  const handleAddVariantRow = () => {
    setNewProdVariants([...newProdVariants, { variant_name: '', price_adjustment: 0 }]);
  };

  const handleVariantChange = (index, field, val) => {
    const updated = [...newProdVariants];
    updated[index][field] = val;
    setNewProdVariants(updated);
  };

  const submitProduct = (e) => {
    e.preventDefault();
    onCreateProduct({
      name: newProdName,
      type: newProdType,
      sales_price: parseFloat(newProdSalesPrice),
      cost_price: parseFloat(newProdCostPrice || 0),
      notes: newProdNotes,
      variants: newProdVariants.filter(v => v.variant_name.trim())
    });
    setShowNewProductModal(false);
    setNewProdName('');
    setNewProdSalesPrice('');
    setNewProdCostPrice('');
    setNewProdNotes('');
  };

  const submitPlan = (e) => {
    e.preventDefault();
    onCreatePlan({
      name: newPlanName,
      cost: parseFloat(newPlanCost),
      billing_interval: newPlanInterval,
      min_quantity: parseInt(newPlanMinQty || 1),
      auto_close: newPlanAutoClose,
      allow_close_early: newPlanAllowCloseEarly,
      allow_pause: newPlanAllowPause,
      allow_renew: newPlanAllowRenew
    });
    setShowNewPlanModal(false);
    setNewPlanName('');
    setNewPlanCost('');
  };

  return (
    <div className="space-y-4 pb-20 animate-fade-in">
      {/* Switcher: Products vs Plans */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 bg-zinc-200 p-1 rounded-xl border border-zinc-300">
          <button
            onClick={() => setActiveSubTab('products')}
            className={`px-4 py-1.5 text-xs font-black rounded-lg transition ${
              activeSubTab === 'products'
                ? 'bg-white text-black shadow-neo-sm'
                : 'text-zinc-600 hover:text-black'
            }`}
          >
            Products & Variants ({products.length})
          </button>
          <button
            onClick={() => setActiveSubTab('plans')}
            className={`px-4 py-1.5 text-xs font-black rounded-lg transition ${
              activeSubTab === 'plans'
                ? 'bg-white text-black shadow-neo-sm'
                : 'text-zinc-600 hover:text-black'
            }`}
          >
            Billing Plans ({plans.length})
          </button>
        </div>

        {isAdmin && (
          <button
            onClick={() => activeSubTab === 'products' ? setShowNewProductModal(true) : setShowNewPlanModal(true)}
            className="px-3 py-1.5 bg-tinker-yellow hover:bg-tinker-yellow-hover text-black font-black text-xs rounded-xl border-2 border-tinker-border shadow-neo-sm transition flex items-center gap-1 neo-btn"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>{activeSubTab === 'products' ? 'Add Product' : 'Add Plan'}</span>
          </button>
        )}
      </div>

      {/* PRODUCTS TAB */}
      {activeSubTab === 'products' && (
        <div className="space-y-3">
          {products.map(prod => (
            <div
              key={prod.id}
              className="bg-white border-2 border-tinker-border rounded-2xl p-4 shadow-neo-sm"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-black text-base text-black">{prod.name}</h3>
                    <span className="text-[10px] font-black uppercase tracking-wider bg-zinc-100 text-zinc-700 px-2 py-0.5 rounded border border-zinc-300">
                      {prod.type}
                    </span>
                  </div>
                  {prod.notes && (
                    <p className="text-xs text-zinc-500 mt-0.5">{prod.notes}</p>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-xs text-zinc-400 font-bold uppercase">Base Price</div>
                  <div className="font-black text-base text-black">
                    ${prod.sales_price.toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Variants Section */}
              {prod.variants && prod.variants.length > 0 && (
                <div className="mt-3 pt-3 border-t border-zinc-100">
                  <div className="text-xs font-bold text-zinc-500 mb-1.5 flex items-center gap-1">
                    <Tag className="w-3 h-3 text-tinker-yellow" />
                    Available Variants & Pricing Addons:
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {prod.variants.map((v, i) => {
                      const isOdoo = v.variant_name.toLowerCase().includes('odoo');
                      return (
                        <div
                          key={i}
                          className={`px-2.5 py-1 rounded-lg border text-xs font-bold flex items-center gap-1.5 ${
                            isOdoo
                              ? 'bg-amber-50 border-amber-300 text-amber-900 shadow-sm'
                              : 'bg-zinc-50 border-zinc-200 text-zinc-800'
                          }`}
                        >
                          <span>{v.variant_name}</span>
                          <span className={`text-[11px] font-black ${isOdoo ? 'text-amber-700' : 'text-zinc-600'}`}>
                            {v.price_adjustment > 0 ? `(+$${v.price_adjustment})` : '(Included)'}
                          </span>
                          {isOdoo && (
                            <span className="text-[9px] bg-tinker-yellow text-black px-1 rounded uppercase font-black">
                              Prompt Rule
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* PLANS TAB */}
      {activeSubTab === 'plans' && (
        <div className="space-y-3">
          {plans.map(plan => (
            <div
              key={plan.id}
              className="bg-white border-2 border-tinker-border rounded-2xl p-4 shadow-neo-sm"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-black text-base text-black">{plan.name}</h3>
                    <span className="text-[10px] font-black uppercase tracking-wider bg-tinker-yellow-light text-amber-900 px-2 py-0.5 rounded border border-amber-300">
                      Billed {plan.billing_interval}
                    </span>
                  </div>
                  <div className="text-xs text-zinc-500 mt-1">
                    Min quantity: <b className="text-zinc-700">{plan.min_quantity} unit(s)</b>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-black text-xl text-black">
                    ${plan.cost.toFixed(2)}
                    <span className="text-xs font-semibold text-zinc-400">/{plan.billing_interval}</span>
                  </div>
                </div>
              </div>

              {/* Policy Behavior Badges */}
              <div className="mt-3 pt-3 border-t border-zinc-100 flex flex-wrap gap-1.5 text-[11px] font-bold">
                <span className={`px-2 py-0.5 rounded-md border ${
                  plan.auto_close ? 'bg-zinc-100 text-zinc-700 border-zinc-300' : 'bg-blue-50 text-blue-700 border-blue-200'
                }`}>
                  {plan.auto_close ? 'Auto-closes on end' : 'Continuous auto-renew'}
                </span>

                <span className={`px-2 py-0.5 rounded-md border ${
                  plan.allow_pause ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-zinc-100 text-zinc-400 border-zinc-200'
                }`}>
                  {plan.allow_pause ? '✓ Pause Allowed' : '✗ No Pausing'}
                </span>

                <span className={`px-2 py-0.5 rounded-md border ${
                  plan.allow_renew ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-zinc-100 text-zinc-400 border-zinc-200'
                }`}>
                  {plan.allow_renew ? '✓ Renew Allowed' : '✗ No Renewal'}
                </span>

                <span className={`px-2 py-0.5 rounded-md border ${
                  plan.allow_close_early ? 'bg-zinc-50 text-zinc-700 border-zinc-300' : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}>
                  {plan.allow_close_early ? 'Close Early: Yes' : 'Fixed Lock-in'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Product Modal */}
      {showNewProductModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border-2 border-tinker-border rounded-2xl w-full max-w-lg p-5 shadow-neo max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-black text-black mb-1">Add New Product & Variants</h2>
            <p className="text-xs text-zinc-500 mb-4">Admin only &bull; Configure core price & brand additions</p>

            <form onSubmit={submitProduct} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-zinc-700">Product Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Brightloop Analytics Engine"
                  value={newProdName}
                  onChange={e => setNewProdName(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border-2 border-zinc-300 rounded-xl text-xs font-medium focus:outline-none focus:border-black"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-xs font-bold text-zinc-700">Type</label>
                  <select
                    value={newProdType}
                    onChange={e => setNewProdType(e.target.value)}
                    className="w-full mt-1 px-2.5 py-2 border-2 border-zinc-300 rounded-xl text-xs font-medium focus:outline-none focus:border-black"
                  >
                    <option value="software">Software</option>
                    <option value="service">Service</option>
                    <option value="addon">Add-on</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-zinc-700">Sales Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="1200"
                    value={newProdSalesPrice}
                    onChange={e => setNewProdSalesPrice(e.target.value)}
                    className="w-full mt-1 px-3 py-2 border-2 border-zinc-300 rounded-xl text-xs font-medium focus:outline-none focus:border-black"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-zinc-700">Cost Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="300"
                    value={newProdCostPrice}
                    onChange={e => setNewProdCostPrice(e.target.value)}
                    className="w-full mt-1 px-3 py-2 border-2 border-zinc-300 rounded-xl text-xs font-medium focus:outline-none focus:border-black"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-700">Notes / Scope</label>
                <textarea
                  rows="2"
                  placeholder="Notes about product variants and licensing..."
                  value={newProdNotes}
                  onChange={e => setNewProdNotes(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border-2 border-zinc-300 rounded-xl text-xs font-medium focus:outline-none focus:border-black"
                />
              </div>

              {/* Variants Builder */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-zinc-700">Variants (e.g. Odoo brand +560)</label>
                  <button
                    type="button"
                    onClick={handleAddVariantRow}
                    className="text-xs font-bold text-blue-600 hover:underline"
                  >
                    + Add Variant
                  </button>
                </div>
                <div className="space-y-1.5">
                  {newProdVariants.map((v, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Variant Name"
                        value={v.variant_name}
                        onChange={e => handleVariantChange(i, 'variant_name', e.target.value)}
                        className="flex-1 px-2.5 py-1.5 border border-zinc-300 rounded-lg text-xs"
                      />
                      <input
                        type="number"
                        placeholder="Price Adj ($)"
                        value={v.price_adjustment}
                        onChange={e => handleVariantChange(i, 'price_adjustment', e.target.value)}
                        className="w-24 px-2 py-1.5 border border-zinc-300 rounded-lg text-xs text-right"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setShowNewProductModal(false)}
                  className="px-3 py-2 text-xs font-bold text-zinc-600 hover:bg-zinc-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-tinker-yellow hover:bg-tinker-yellow-hover text-black font-black text-xs rounded-xl border-2 border-tinker-border shadow-neo-sm neo-btn"
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Plan Modal */}
      {showNewPlanModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border-2 border-tinker-border rounded-2xl w-full max-w-lg p-5 shadow-neo max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-black text-black mb-1">Create Billing Plan</h2>
            <p className="text-xs text-zinc-500 mb-4">Admin only &bull; Set cadence & auto-close behavior</p>

            <form onSubmit={submitPlan} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-zinc-700">Plan Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Enterprise Annual Tier"
                  value={newPlanName}
                  onChange={e => setNewPlanName(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border-2 border-zinc-300 rounded-xl text-xs font-medium focus:outline-none focus:border-black"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-xs font-bold text-zinc-700">Billing Interval</label>
                  <select
                    value={newPlanInterval}
                    onChange={e => setNewPlanInterval(e.target.value)}
                    className="w-full mt-1 px-2.5 py-2 border-2 border-zinc-300 rounded-xl text-xs font-medium focus:outline-none focus:border-black"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-zinc-700">Cost ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="299"
                    value={newPlanCost}
                    onChange={e => setNewPlanCost(e.target.value)}
                    className="w-full mt-1 px-3 py-2 border-2 border-zinc-300 rounded-xl text-xs font-medium focus:outline-none focus:border-black"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-zinc-700">Min Quantity</label>
                  <input
                    type="number"
                    value={newPlanMinQty}
                    onChange={e => setNewPlanMinQty(e.target.value)}
                    className="w-full mt-1 px-3 py-2 border-2 border-zinc-300 rounded-xl text-xs font-medium focus:outline-none focus:border-black"
                  />
                </div>
              </div>

              {/* Behavior Flags */}
              <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-3 space-y-2">
                <div className="text-xs font-black text-zinc-800">Plan Policy Rules:</div>
                <label className="flex items-center gap-2 text-xs font-medium text-zinc-700">
                  <input
                    type="checkbox"
                    checked={newPlanAutoClose}
                    onChange={e => setNewPlanAutoClose(e.target.checked)}
                    className="rounded border-zinc-300"
                  />
                  <span>Auto-close on end date (stops billing automatically)</span>
                </label>
                <label className="flex items-center gap-2 text-xs font-medium text-zinc-700">
                  <input
                    type="checkbox"
                    checked={newPlanAllowCloseEarly}
                    onChange={e => setNewPlanAllowCloseEarly(e.target.checked)}
                    className="rounded border-zinc-300"
                  />
                  <span>Allow customers to close subscription early</span>
                </label>
                <label className="flex items-center gap-2 text-xs font-medium text-zinc-700">
                  <input
                    type="checkbox"
                    checked={newPlanAllowPause}
                    onChange={e => setNewPlanAllowPause(e.target.checked)}
                    className="rounded border-zinc-300"
                  />
                  <span>Allow subscription to be paused and resumed</span>
                </label>
                <label className="flex items-center gap-2 text-xs font-medium text-zinc-700">
                  <input
                    type="checkbox"
                    checked={newPlanAllowRenew}
                    onChange={e => setNewPlanAllowRenew(e.target.checked)}
                    className="rounded border-zinc-300"
                  />
                  <span>Allow subscription renewal</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setShowNewPlanModal(false)}
                  className="px-3 py-2 text-xs font-bold text-zinc-600 hover:bg-zinc-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-tinker-yellow hover:bg-tinker-yellow-hover text-black font-black text-xs rounded-xl border-2 border-tinker-border shadow-neo-sm neo-btn"
                >
                  Save Plan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
