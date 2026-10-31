import React, { useState } from 'react';
import { X, DollarSign, CheckCircle2 } from 'lucide-react';

export default function PaymentModal({ invoice, onClose, onRecord }) {
  if (!invoice) return null;

  const remainingBalance = Math.max(0, invoice.total_amount - invoice.paid_amount);

  const [method, setMethod] = useState('Credit Card');
  const [amount, setAmount] = useState(remainingBalance.toFixed(2));
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onRecord({
      invoice_id: invoice.id,
      method,
      amount: parseFloat(amount),
      payment_date: paymentDate,
      note
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border-2 border-tinker-border rounded-2xl w-full max-w-md p-6 shadow-neo relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-zinc-500 hover:text-black rounded-lg hover:bg-zinc-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-lg font-black text-black">Record Payment</h2>
        <p className="text-xs text-zinc-500 mb-4">
          Invoice: <b className="font-mono text-zinc-800">{invoice.invoice_number}</b> &bull; Customer: {invoice.customer_name}
        </p>

        <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl mb-4 text-xs space-y-1">
          <div className="flex justify-between">
            <span className="text-zinc-500">Invoice Total:</span>
            <span className="font-bold">${invoice.total_amount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">Already Paid:</span>
            <span className="font-bold text-emerald-600">${invoice.paid_amount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-black pt-1 border-t border-zinc-200 text-sm">
            <span>Remaining Due:</span>
            <span className="text-red-600">${remainingBalance.toFixed(2)}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="font-bold text-zinc-700">Payment Method</label>
            <select
              value={method}
              onChange={e => setMethod(e.target.value)}
              className="w-full mt-1 px-3 py-2 border-2 border-zinc-300 rounded-xl font-medium focus:outline-none focus:border-black"
            >
              <option value="Credit Card">Credit Card / Stripe</option>
              <option value="Bank Transfer">Bank Wire Transfer / ACH</option>
              <option value="UPI">UPI Instant Pay</option>
              <option value="Cash">Cash / Cheque</option>
            </select>
          </div>

          <div>
            <label className="font-bold text-zinc-700">Amount Received ($)</label>
            <input
              type="number"
              step="0.01"
              required
              max={remainingBalance}
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="w-full mt-1 px-3 py-2 border-2 border-zinc-300 rounded-xl font-black text-sm focus:outline-none focus:border-black"
            />
          </div>

          <div>
            <label className="font-bold text-zinc-700">Payment Date</label>
            <input
              type="date"
              required
              value={paymentDate}
              onChange={e => setPaymentDate(e.target.value)}
              className="w-full mt-1 px-3 py-2 border-2 border-zinc-300 rounded-xl font-medium"
            />
          </div>

          <div>
            <label className="font-bold text-zinc-700">Transaction Note / Reference</label>
            <input
              type="text"
              placeholder="e.g. Stripe charge ch_3M5q, or bank slip #9921"
              value={note}
              onChange={e => setNote(e.target.value)}
              className="w-full mt-1 px-3 py-2 border-2 border-zinc-300 rounded-xl font-medium"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-zinc-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-zinc-600 hover:bg-zinc-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs rounded-xl border-2 border-emerald-800 shadow-neo-sm neo-btn"
            >
              Confirm Payment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
