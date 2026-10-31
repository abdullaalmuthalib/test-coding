import React from 'react';
import { X, Printer, CheckCircle2, AlertTriangle, ShieldCheck, Download } from 'lucide-react';

export default function InvoiceModal({ invoice, onClose, onPrint }) {
  if (!invoice) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white border-2 border-tinker-border rounded-2xl w-full max-w-2xl p-6 sm:p-8 shadow-neo max-h-[92vh] overflow-y-auto relative">
        {/* Modal Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-zinc-500 hover:text-black rounded-lg hover:bg-zinc-100 transition print:hidden"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Invoice Header */}
        <div className="flex items-start justify-between border-b-2 border-zinc-900 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-tinker-yellow border-2 border-black rounded-lg flex items-center justify-center font-black text-sm">
                ⚡
              </div>
              <span className="font-black text-xl text-black tracking-tight">BRIGHTLOOP SOFTWARE</span>
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              Cloud Solutions &amp; Subscription Platform<br />
              support@brightloop.com &bull; +1 (800) 555-LOOP
            </p>
          </div>

          <div className="text-right">
            <h1 className="text-2xl font-black text-black tracking-tight">INVOICE</h1>
            <div className="font-mono font-bold text-sm text-zinc-800">{invoice.invoice_number}</div>
            <div className={`inline-block mt-1 text-[10px] font-black uppercase px-2 py-0.5 rounded border ${
              invoice.status === 'paid' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' :
              invoice.is_overdue ? 'bg-red-100 text-red-800 border-red-300' :
              'bg-tinker-yellow text-black border-black'
            }`}>
              {invoice.is_overdue ? 'OVERDUE' : invoice.status}
            </div>
          </div>
        </div>

        {/* Client & Period Meta */}
        <div className="grid grid-cols-2 gap-4 py-4 border-b border-zinc-200 text-xs">
          <div>
            <div className="font-bold text-zinc-400 uppercase text-[10px]">Billed To:</div>
            <div className="font-extrabold text-sm text-black mt-0.5">{invoice.customer_name}</div>
            {invoice.company_name && <div className="font-medium text-zinc-700">{invoice.company_name}</div>}
            <div className="text-zinc-500">{invoice.customer_email}</div>
          </div>

          <div className="text-right space-y-1">
            <div><span className="text-zinc-400">Issue Date:</span> <b className="text-zinc-800">{invoice.issue_date}</b></div>
            <div><span className="text-zinc-400">Due Date:</span> <b className={invoice.is_overdue ? 'text-red-600 font-bold' : 'text-zinc-800'}>{invoice.due_date}</b></div>
            {invoice.subscription_number && (
              <div><span className="text-zinc-400">Subscription:</span> <b className="font-mono text-zinc-800">{invoice.subscription_number}</b></div>
            )}
            {invoice.billing_period_start && (
              <div className="text-[11px] text-zinc-500">
                Period: {invoice.billing_period_start} to {invoice.billing_period_end}
              </div>
            )}
          </div>
        </div>

        {/* Invoice Line Items */}
        <div className="py-4">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b-2 border-zinc-300 text-zinc-500 text-left">
                <th className="pb-2 font-black uppercase text-[10px]">Description &amp; Variant</th>
                <th className="pb-2 font-black uppercase text-[10px] text-center">Qty</th>
                <th className="pb-2 font-black uppercase text-[10px] text-right">Unit Price</th>
                <th className="pb-2 font-black uppercase text-[10px] text-right">Tax (%)</th>
                <th className="pb-2 font-black uppercase text-[10px] text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {(invoice.lines || []).map((l, i) => (
                <tr key={i} className="py-2">
                  <td className="py-2.5">
                    <div className="font-bold text-zinc-900">{l.product_name}</div>
                    {l.variant_name && (
                      <div className="text-[11px] text-amber-800 font-semibold">
                        Variant: {l.variant_name}
                      </div>
                    )}
                  </td>
                  <td className="py-2.5 text-center font-bold text-zinc-800">{l.quantity}</td>
                  <td className="py-2.5 text-right font-medium text-zinc-700">${l.unit_price.toFixed(2)}</td>
                  <td className="py-2.5 text-right font-medium text-zinc-700">{l.tax_rate}%</td>
                  <td className="py-2.5 text-right font-bold text-black">${l.line_total.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals Calculation Box */}
        <div className="pt-3 border-t-2 border-zinc-900 flex justify-end">
          <div className="w-64 space-y-1.5 text-xs">
            <div className="flex justify-between text-zinc-600">
              <span>Subtotal:</span>
              <span className="font-semibold text-black">${invoice.subtotal.toFixed(2)}</span>
            </div>
            {invoice.discount_total > 0 && (
              <div className="flex justify-between text-emerald-700 font-semibold">
                <span>Applied Discount:</span>
                <span>-${invoice.discount_total.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-zinc-600">
              <span>Taxes (Auto Calculated):</span>
              <span className="font-semibold text-black">${invoice.tax_total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-base font-black text-black pt-2 border-t border-zinc-200">
              <span>Total Due:</span>
              <span>${invoice.total_amount.toFixed(2)}</span>
            </div>
            {invoice.paid_amount > 0 && (
              <div className="flex justify-between text-xs font-bold text-emerald-700">
                <span>Total Paid:</span>
                <span>-${invoice.paid_amount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-black text-black pt-1 border-t border-zinc-200">
              <span>Balance Remaining:</span>
              <span className={invoice.total_amount - invoice.paid_amount > 0 ? 'text-red-600' : 'text-emerald-600'}>
                ${Math.max(0, invoice.total_amount - invoice.paid_amount).toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Payment History Recorded */}
        {invoice.payments && invoice.payments.length > 0 && (
          <div className="mt-5 pt-3 border-t border-zinc-200">
            <div className="text-xs font-black uppercase text-zinc-500 mb-2">
              Payments Recorded Against This Invoice:
            </div>
            <div className="space-y-1 text-xs">
              {invoice.payments.map(p => (
                <div key={p.id} className="p-2 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between">
                  <div>
                    <span className="font-mono font-bold text-emerald-950">{p.payment_number}</span> &bull;{' '}
                    <span className="font-semibold text-emerald-800">{p.method}</span>{' '}
                    <span className="text-zinc-500 text-[11px]">({p.payment_date})</span>
                    {p.note && <span className="text-zinc-600 text-[11px]"> &mdash; {p.note}</span>}
                  </div>
                  <div className="font-black text-emerald-900">${p.amount.toFixed(2)}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons: Print & Close */}
        <div className="mt-6 pt-4 border-t border-zinc-200 flex justify-end gap-2 print:hidden">
          <button
            onClick={() => window.print()}
            className="px-4 py-2 bg-black hover:bg-zinc-800 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-neo-sm neo-btn"
          >
            <Printer className="w-4 h-4" />
            Print or Save PDF
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-bold text-xs rounded-xl border border-zinc-300"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
