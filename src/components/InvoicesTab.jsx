import React, { useState } from 'react';
import {
  Search, Filter, ReceiptText, Printer, Send, DollarSign,
  CheckCircle2, XCircle, AlertTriangle, FileText, ChevronRight
} from 'lucide-react';

export default function InvoicesTab({
  invoices,
  currentUser,
  onOpenInvoice,
  onOpenPayment,
  onUpdateInvoiceStatus,
  onSendInvoice
}) {
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const isCustomer = currentUser?.role === 'customer';

  const filtered = invoices.filter(inv => {
    const matchesFilter =
      filterStatus === 'all' ? true :
      filterStatus === 'overdue' ? inv.is_overdue :
      inv.status === filterStatus;

    const matchesSearch =
      inv.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (inv.customer_name && inv.customer_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (inv.subscription_number && inv.subscription_number.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-4 pb-20 animate-fade-in">
      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-3 text-zinc-400" />
        <input
          type="text"
          placeholder="Search by invoice #, customer name, subscription..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-3 py-2 bg-white border-2 border-tinker-border rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-tinker-yellow shadow-neo-sm"
        />
      </div>

      {/* Filter Status Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 hide-scrollbar">
        {[
          { id: 'all', label: 'All Invoices', count: invoices.length },
          { id: 'confirmed', label: 'Confirmed (Due)', count: invoices.filter(i => i.status === 'confirmed').length },
          { id: 'paid', label: 'Paid', count: invoices.filter(i => i.status === 'paid').length },
          { id: 'overdue', label: 'Overdue ⚠️', count: invoices.filter(i => i.is_overdue).length, alert: true },
          { id: 'draft', label: 'Draft', count: invoices.filter(i => i.status === 'draft').length },
        ].map(pill => (
          <button
            key={pill.id}
            onClick={() => setFilterStatus(pill.id)}
            className={`px-3 py-1 text-xs font-bold rounded-lg border-2 whitespace-nowrap transition ${
              filterStatus === pill.id
                ? pill.alert ? 'bg-red-600 text-white border-red-700 shadow-neo-sm' : 'bg-black text-white border-black shadow-neo-sm'
                : pill.alert ? 'bg-red-50 text-red-700 border-red-200' : 'bg-white text-zinc-700 border-zinc-200 hover:border-zinc-400'
            }`}
          >
            {pill.label} ({pill.count})
          </button>
        ))}
      </div>

      {/* Invoices List */}
      {filtered.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-zinc-300 rounded-2xl p-8 text-center">
          <ReceiptText className="w-10 h-10 text-zinc-300 mx-auto mb-2" />
          <h3 className="text-sm font-black text-zinc-700">No invoices found</h3>
          <p className="text-xs text-zinc-500 mt-1">Try another filter</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(inv => {
            const balanceDue = inv.total_amount - inv.paid_amount;

            return (
              <div
                key={inv.id}
                className="bg-white border-2 border-tinker-border rounded-2xl p-4 shadow-neo-sm hover:shadow-neo transition duration-150"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-black text-sm text-black bg-zinc-100 px-2 py-0.5 rounded-md border border-zinc-300">
                        {inv.invoice_number}
                      </span>
                      <span className="font-extrabold text-sm text-zinc-900">
                        {inv.customer_name}
                      </span>
                      {inv.company_name && (
                        <span className="text-xs text-zinc-500 font-semibold">
                          ({inv.company_name})
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-zinc-500 mt-1 flex items-center gap-2 flex-wrap">
                      {inv.subscription_number && (
                        <span className="font-semibold text-zinc-700">
                          From: {inv.subscription_number}
                        </span>
                      )}
                      <span className="text-zinc-400">&bull;</span>
                      <span>Issued: {inv.issue_date}</span>
                      <span className="text-zinc-400">&bull;</span>
                      <span className={`font-bold ${inv.is_overdue ? 'text-red-600' : 'text-zinc-700'}`}>
                        Due: {inv.due_date} {inv.is_overdue && '(OVERDUE)'}
                      </span>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <span className={`text-[11px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md border ${
                    inv.status === 'paid' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' :
                    inv.is_overdue ? 'bg-red-100 text-red-800 border-red-300 animate-pulse' :
                    inv.status === 'confirmed' ? 'bg-tinker-yellow text-black border-tinker-border' :
                    inv.status === 'cancelled' ? 'bg-zinc-200 text-zinc-600 border-zinc-400 line-through' :
                    'bg-zinc-100 text-zinc-600 border-zinc-300'
                  }`}>
                    {inv.is_overdue ? 'OVERDUE' : inv.status}
                  </span>
                </div>

                {/* Amount breakdown row */}
                <div className="mt-3 bg-zinc-50 border border-zinc-200 rounded-xl p-2.5 flex items-center justify-between text-xs flex-wrap gap-2">
                  <div className="flex items-center gap-3">
                    <div>
                      <span className="text-zinc-500">Subtotal:</span>{' '}
                      <span className="font-semibold">${inv.subtotal.toFixed(2)}</span>
                    </div>
                    {inv.discount_total > 0 && (
                      <div className="text-emerald-700 font-semibold">
                        Discount: -${inv.discount_total.toFixed(2)}
                      </div>
                    )}
                    <div>
                      <span className="text-zinc-500">Tax:</span>{' '}
                      <span className="font-semibold">${inv.tax_total.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-zinc-500 mr-2 text-[11px] uppercase font-bold">Total:</span>
                    <span className="font-black text-base text-black">
                      ${inv.total_amount.toFixed(2)}
                    </span>
                    {inv.paid_amount > 0 && inv.status !== 'paid' && (
                      <span className="text-[11px] text-emerald-600 font-semibold ml-2">
                        (${inv.paid_amount.toFixed(2)} paid)
                      </span>
                    )}
                  </div>
                </div>

                {/* Sent confirmation timestamp */}
                {inv.sent_at && (
                  <div className="mt-2 text-[10px] text-zinc-400 font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                    Sent to client email on {inv.sent_at}
                  </div>
                )}

                {/* Action Controls */}
                <div className="mt-3 pt-3 border-t border-zinc-100 flex items-center justify-between gap-1.5 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    {/* View / Print Full Invoice */}
                    <button
                      onClick={() => onOpenInvoice(inv.id)}
                      className="px-2.5 py-1 text-xs font-bold bg-white hover:bg-zinc-100 text-zinc-800 rounded-lg border-2 border-tinker-border shadow-neo-sm transition flex items-center gap-1 neo-btn"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      View & Print
                    </button>

                    {/* Send Invoice Email */}
                    {!isCustomer && !inv.sent_at && inv.status !== 'cancelled' && (
                      <button
                        onClick={() => onSendInvoice(inv.id)}
                        className="px-2 py-1 text-xs font-bold bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg border border-blue-200 transition flex items-center gap-1"
                        title="Send invoice to customer email"
                      >
                        <Send className="w-3 h-3" />
                        Send
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Confirm Draft */}
                    {!isCustomer && inv.status === 'draft' && (
                      <button
                        onClick={() => onUpdateInvoiceStatus(inv.id, 'confirmed')}
                        className="px-2.5 py-1 text-xs font-bold bg-tinker-yellow hover:bg-tinker-yellow-hover text-black rounded-lg border border-black shadow-neo-sm transition"
                      >
                        Confirm Invoice
                      </button>
                    )}

                    {/* Record Payment Button (for customer portal or staff) */}
                    {inv.status !== 'paid' && inv.status !== 'cancelled' && (
                      <button
                        onClick={() => onOpenPayment(inv)}
                        className="px-3 py-1 text-xs font-black bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg border-2 border-emerald-800 shadow-neo-sm transition flex items-center gap-1 neo-btn"
                      >
                        <DollarSign className="w-3.5 h-3.5" />
                        {isCustomer ? 'Pay Invoice' : 'Record Payment'}
                      </button>
                    )}

                    {/* Cancel Invoice */}
                    {!isCustomer && inv.status === 'draft' && (
                      <button
                        onClick={() => onUpdateInvoiceStatus(inv.id, 'cancelled')}
                        className="px-2 py-1 text-xs font-bold text-zinc-400 hover:text-red-600 transition"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
