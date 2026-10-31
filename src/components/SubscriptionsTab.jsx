import React, { useState } from 'react';
import {
  Plus, Search, Filter, Zap, Pause, Play, RefreshCw, XCircle,
  FileText, CheckCircle, Clock, ChevronRight, Tag, AlertCircle
} from 'lucide-react';

export default function SubscriptionsTab({
  subscriptions,
  currentUser,
  onOpenNewSub,
  onUpdateStatus,
  onRenewSub,
  onViewSubscriptionDetails
}) {
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const isCustomer = currentUser?.role === 'customer';

  const filtered = subscriptions.filter(sub => {
    const matchesFilter =
      filterStatus === 'all' ? true :
      filterStatus === 'pipeline' ? ['draft', 'quotation', 'confirmed'].includes(sub.status) :
      sub.status === filterStatus;

    const matchesSearch =
      sub.subscription_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (sub.customer_name && sub.customer_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (sub.plan_name && sub.plan_name.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-4 pb-20 animate-fade-in">
      {/* Top Bar with Search & New Quote/Sub Button */}
      <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-3 text-zinc-400" />
          <input
            type="text"
            placeholder="Search by sub #, customer, plan..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-white border-2 border-tinker-border rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-tinker-yellow shadow-neo-sm"
          />
        </div>

        <button
          onClick={onOpenNewSub}
          className="px-4 py-2 bg-tinker-yellow hover:bg-tinker-yellow-hover text-black font-black text-xs sm:text-sm rounded-xl border-2 border-tinker-border shadow-neo-sm hover:shadow-neo transition flex items-center justify-center gap-1.5 neo-btn whitespace-nowrap"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>{isCustomer ? 'Request Quote / Plan' : 'New Subscription / Quote'}</span>
        </button>
      </div>

      {/* Filter Status Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 hide-scrollbar">
        {[
          { id: 'all', label: 'All Subs', count: subscriptions.length },
          { id: 'active', label: 'Active', count: subscriptions.filter(s => s.status === 'active').length },
          { id: 'pipeline', label: 'Quotes / Pipeline', count: subscriptions.filter(s => ['draft', 'quotation', 'confirmed'].includes(s.status)).length },
          { id: 'paused', label: 'Paused', count: subscriptions.filter(s => s.status === 'paused').length },
          { id: 'closed', label: 'Closed', count: subscriptions.filter(s => s.status === 'closed').length },
        ].map(pill => (
          <button
            key={pill.id}
            onClick={() => setFilterStatus(pill.id)}
            className={`px-3 py-1 text-xs font-bold rounded-lg border-2 whitespace-nowrap transition ${
              filterStatus === pill.id
                ? 'bg-black text-white border-black shadow-neo-sm'
                : 'bg-white text-zinc-700 border-zinc-200 hover:border-zinc-400'
            }`}
          >
            {pill.label} ({pill.count})
          </button>
        ))}
      </div>

      {/* Subscription Cards List */}
      {filtered.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-zinc-300 rounded-2xl p-8 text-center">
          <Zap className="w-10 h-10 text-zinc-300 mx-auto mb-2" />
          <h3 className="text-sm font-black text-zinc-700">No subscriptions found</h3>
          <p className="text-xs text-zinc-500 mt-1">Try tweaking your search or filter</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(sub => {
            const subTotal = (sub.lines || []).reduce((acc, l) => acc + (l.amount || 0), 0);

            return (
              <div
                key={sub.id}
                className="bg-white border-2 border-tinker-border rounded-2xl p-4 shadow-neo-sm hover:shadow-neo transition duration-150 relative"
              >
                {/* Header: Sub Number, Customer, Status */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-black text-sm text-black bg-zinc-100 px-2 py-0.5 rounded-md border border-zinc-300 font-mono">
                        {sub.subscription_number}
                      </span>
                      <span className="font-extrabold text-sm text-zinc-900">
                        {sub.customer_name}
                      </span>
                      {sub.company_name && (
                        <span className="text-xs text-zinc-500 font-semibold">
                          ({sub.company_name})
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-zinc-600 mt-1 flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-tinker-purple bg-tinker-purple-soft px-1.5 py-0.5 rounded border border-purple-200">
                        {sub.plan_name}
                      </span>
                      <span className="text-zinc-400">&bull;</span>
                      <span className="capitalize font-medium">Billed {sub.billing_interval}</span>
                      <span className="text-zinc-400">&bull;</span>
                      <span className="font-medium">Terms: {sub.payment_terms}</span>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <span className={`text-[11px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md border ${
                    sub.status === 'active' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' :
                    sub.status === 'confirmed' ? 'bg-tinker-yellow text-black border-tinker-border' :
                    sub.status === 'quotation' ? 'bg-blue-100 text-blue-800 border-blue-300' :
                    sub.status === 'paused' ? 'bg-purple-100 text-purple-800 border-purple-300' :
                    sub.status === 'closed' ? 'bg-zinc-200 text-zinc-700 border-zinc-400' :
                    'bg-zinc-100 text-zinc-600 border-zinc-300'
                  }`}>
                    {sub.status}
                  </span>
                </div>

                {/* Product Lines Summary */}
                <div className="mt-3 bg-zinc-50 border border-zinc-200 rounded-xl p-2.5 space-y-1.5">
                  {(sub.lines || []).map((line, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 font-medium text-zinc-800">
                        <span className="font-bold text-black">{line.quantity}x</span>
                        <span>{line.product_name}</span>
                        {line.variant_name && (
                          <span className="text-[10px] font-bold bg-tinker-yellow-light text-zinc-800 px-1 py-0.2 rounded border border-amber-300">
                            {line.variant_name}
                          </span>
                        )}
                      </div>
                      <div className="font-bold text-zinc-900">
                        ${Number(line.amount || 0).toFixed(2)}
                      </div>
                    </div>
                  ))}

                  {/* Applied Discount Tag */}
                  {sub.discount_code && (
                    <div className="pt-1.5 border-t border-zinc-200 flex items-center justify-between text-xs text-emerald-700 font-semibold">
                      <span className="flex items-center gap-1">
                        <Tag className="w-3 h-3" />
                        Discount: {sub.discount_name} ({sub.discount_code})
                      </span>
                      <span>-{sub.discount_type === 'percentage' ? `${sub.discount_value}%` : `$${sub.discount_value}`}</span>
                    </div>
                  )}

                  {/* Total Value */}
                  <div className="pt-1.5 border-t border-zinc-200 flex items-center justify-between text-xs">
                    <span className="font-bold text-zinc-500 uppercase">Estimated Cycle Total:</span>
                    <span className="font-black text-sm text-black">
                      ${subTotal.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Dates & Auto-Renewal Details */}
                <div className="mt-2.5 flex items-center justify-between text-[11px] text-zinc-500 flex-wrap gap-1">
                  <div>
                    <span>Start: <b className="text-zinc-700">{sub.start_date}</b></span>
                    {sub.expiry_date && <span> &bull; Expiry: <b className="text-zinc-700">{sub.expiry_date}</b></span>}
                  </div>
                  <div>
                    <span>Next Bill: <b className="text-zinc-800">{sub.next_billing_date || 'Pending'}</b></span>
                  </div>
                </div>

                {/* Workflow Transitions / Action Buttons */}
                <div className="mt-3 pt-3 border-t border-zinc-100 flex items-center justify-end gap-1.5 flex-wrap">
                  {/* Draft -> Quotation */}
                  {sub.status === 'draft' && (
                    <button
                      onClick={() => onUpdateStatus(sub.id, 'quotation')}
                      className="px-2.5 py-1 text-xs font-bold bg-blue-500 hover:bg-blue-600 text-white rounded-lg border border-blue-700 transition"
                    >
                      Send Quotation
                    </button>
                  )}

                  {/* Quotation -> Confirmed */}
                  {sub.status === 'quotation' && (
                    <button
                      onClick={() => onUpdateStatus(sub.id, 'confirmed')}
                      className="px-2.5 py-1 text-xs font-bold bg-tinker-yellow hover:bg-tinker-yellow-hover text-black rounded-lg border border-black shadow-neo-sm transition"
                    >
                      Confirm Quote
                    </button>
                  )}

                  {/* Confirmed -> Active */}
                  {sub.status === 'confirmed' && (
                    <button
                      onClick={() => onUpdateStatus(sub.id, 'active')}
                      className="px-2.5 py-1 text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg border border-emerald-700 transition"
                    >
                      Activate Subscription
                    </button>
                  )}

                  {/* Active -> Pause (if allowed) */}
                  {sub.status === 'active' && sub.allow_pause && (
                    <button
                      onClick={() => onUpdateStatus(sub.id, 'paused')}
                      className="px-2 py-1 text-xs font-bold bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg border border-purple-300 transition flex items-center gap-1"
                    >
                      <Pause className="w-3 h-3" />
                      Pause
                    </button>
                  )}

                  {/* Paused -> Resume */}
                  {sub.status === 'paused' && (
                    <button
                      onClick={() => onUpdateStatus(sub.id, 'active')}
                      className="px-2 py-1 text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg border border-emerald-300 transition flex items-center gap-1"
                    >
                      <Play className="w-3 h-3" />
                      Resume
                    </button>
                  )}

                  {/* Renew (if allowed) */}
                  {sub.allow_renew && (sub.status === 'active' || sub.status === 'closed') && (
                    <button
                      onClick={() => onRenewSub(sub.id)}
                      className="px-2 py-1 text-xs font-bold bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-lg border border-zinc-300 transition flex items-center gap-1"
                    >
                      <RefreshCw className="w-3 h-3" />
                      Renew +1 Yr
                    </button>
                  )}

                  {/* Close Early (if allowed) */}
                  {sub.status === 'active' && sub.allow_close_early && (
                    <button
                      onClick={() => onUpdateStatus(sub.id, 'closed')}
                      className="px-2 py-1 text-xs font-bold bg-red-50 hover:bg-red-100 text-red-600 rounded-lg border border-red-300 transition"
                    >
                      Close Early
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
