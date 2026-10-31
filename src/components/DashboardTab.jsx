import React, { useState } from 'react';
import {
  TrendingUp, Calendar, Zap, AlertTriangle, ArrowUpRight,
  CheckCircle2, Clock, DollarSign, RefreshCw, Send, PlayCircle, Sparkles
} from 'lucide-react';

export default function DashboardTab({
  analytics,
  invoices,
  subscriptions,
  currentUser,
  onRunBillingDay,
  onOpenInvoice,
  onOpenPayment,
  onOpenNewSub,
  isBillingRunning
}) {
  const isCustomer = currentUser?.role === 'customer';
  const metrics = analytics?.metrics || {};

  // Find overdue invoices
  const overdueInvoices = invoices.filter(inv => inv.is_overdue);

  return (
    <div className="space-y-4 pb-20 animate-fade-in">
      {/* Welcome Banner with TinkerHub Maker Styling */}
      <div className="bg-white border-2 border-tinker-border rounded-2xl p-4 shadow-neo relative overflow-hidden">
        <div className="absolute -right-4 -bottom-4 w-28 h-28 bg-tinker-yellow opacity-30 rounded-full blur-xl pointer-events-none"></div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 relative z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-tinker-purple bg-tinker-purple-soft px-2 py-0.5 rounded-md border border-purple-200">
                {isCustomer ? 'Customer Portal' : 'Brightloop Operations'}
              </span>
              <span className="text-xs font-semibold text-zinc-500">
                Today: {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-black mt-1">
              Welcome back, {currentUser?.name?.split(' ')[0]}! 🚀
            </h1>
            <p className="text-xs sm:text-sm text-zinc-600 font-medium">
              {isCustomer
                ? `Managing subscriptions & billing for ${currentUser?.company_name || 'your account'}.`
                : 'Automated recurring billing, quote-to-cash pipeline & real-time revenue.'}
            </p>
          </div>

          {/* Quick Action Button */}
          {!isCustomer ? (
            <button
              onClick={onRunBillingDay}
              disabled={isBillingRunning}
              className="w-full sm:w-auto px-4 py-2.5 bg-tinker-yellow hover:bg-tinker-yellow-hover text-black font-extrabold text-sm rounded-xl border-2 border-tinker-border shadow-neo-sm hover:shadow-neo transition flex items-center justify-center gap-2 neo-btn"
            >
              <Zap className={`w-4 h-4 ${isBillingRunning ? 'animate-spin' : 'fill-black'}`} />
              <span>{isBillingRunning ? 'Processing Billing...' : 'Run Billing Day ⚡'}</span>
            </button>
          ) : (
            <button
              onClick={onOpenNewSub}
              className="w-full sm:w-auto px-4 py-2.5 bg-tinker-lime text-black font-extrabold text-sm rounded-xl border-2 border-tinker-border shadow-neo-sm hover:shadow-neo transition flex items-center justify-center gap-2 neo-btn"
            >
              <Sparkles className="w-4 h-4" />
              <span>Explore New Plan</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Stats Grid */}
      {!isCustomer ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {/* MRR Card */}
          <div className="bg-white border-2 border-tinker-border rounded-2xl p-3.5 shadow-neo-sm relative">
            <div className="flex items-center justify-between text-zinc-500 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider">MRR</span>
              <div className="w-6 h-6 rounded-lg bg-tinker-yellow/20 flex items-center justify-center border border-tinker-yellow">
                <TrendingUp className="w-3.5 h-3.5 text-zinc-900" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-black text-black">
              ${Number(metrics.mrr || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-[11px] font-semibold text-emerald-600 mt-0.5 flex items-center gap-1">
              <span>ARR: ${Number(metrics.arr || 0).toLocaleString('en-US')}</span>
            </div>
          </div>

          {/* Revenue Collected */}
          <div className="bg-white border-2 border-tinker-border rounded-2xl p-3.5 shadow-neo-sm">
            <div className="flex items-center justify-between text-zinc-500 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider">Total Collected</span>
              <div className="w-6 h-6 rounded-lg bg-emerald-100 flex items-center justify-center border border-emerald-300">
                <DollarSign className="w-3.5 h-3.5 text-emerald-700" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-black text-black">
              ${Number(metrics.total_revenue_collected || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-[11px] font-medium text-zinc-500 mt-0.5">
              Verified in bank/Stripe
            </div>
          </div>

          {/* Active Subscriptions */}
          <div className="bg-white border-2 border-tinker-border rounded-2xl p-3.5 shadow-neo-sm">
            <div className="flex items-center justify-between text-zinc-500 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider">Active Subs</span>
              <div className="w-6 h-6 rounded-lg bg-tinker-lime/40 flex items-center justify-center border border-tinker-border">
                <Zap className="w-3.5 h-3.5 text-black" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-black text-black">
              {metrics.active_subscriptions || 0}
              <span className="text-xs text-zinc-400 font-normal ml-1">/ {metrics.total_subscriptions || 0} total</span>
            </div>
            <div className="text-[11px] font-medium text-zinc-500 mt-0.5">
              {metrics.paused_subscriptions || 0} paused &bull; {metrics.pipeline_subscriptions || 0} quotes
            </div>
          </div>

          {/* Overdue Receivables */}
          <div className="bg-white border-2 border-tinker-border rounded-2xl p-3.5 shadow-neo-sm">
            <div className="flex items-center justify-between text-zinc-500 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider">Overdue</span>
              <div className="w-6 h-6 rounded-lg bg-red-100 flex items-center justify-center border border-red-300">
                <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-black text-red-600">
              ${Number(metrics.overdue_amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-[11px] font-bold text-red-600 mt-0.5">
              {metrics.overdue_count || 0} invoices need chasing
            </div>
          </div>
        </div>
      ) : (
        /* Customer-specific Metrics */
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white border-2 border-tinker-border rounded-2xl p-3.5 shadow-neo-sm">
            <div className="text-xs font-bold uppercase text-zinc-500">Your Subscriptions</div>
            <div className="text-2xl font-black text-black mt-1">
              {subscriptions.length}
            </div>
            <div className="text-[11px] font-semibold text-emerald-600">
              {subscriptions.filter(s => s.status === 'active').length} currently active
            </div>
          </div>
          <div className="bg-white border-2 border-tinker-border rounded-2xl p-3.5 shadow-neo-sm">
            <div className="text-xs font-bold uppercase text-zinc-500">Pending Invoices</div>
            <div className="text-2xl font-black text-zinc-900 mt-1">
              {invoices.filter(i => i.status !== 'paid' && i.status !== 'cancelled').length}
            </div>
            <div className="text-[11px] font-semibold text-amber-600">
              ${invoices.filter(i => i.status !== 'paid').reduce((a, b) => a + (b.total_amount - b.paid_amount), 0).toFixed(2)} due
            </div>
          </div>
        </div>
      )}

      {/* Overdue Chasing Section (Per Prompt: "so overdue ones can be chased before they turn into lost revenue") */}
      {overdueInvoices.length > 0 && !isCustomer && (
        <div className="bg-red-50 border-2 border-red-400 rounded-2xl p-4 shadow-neo-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping"></span>
              <h2 className="text-sm font-black text-red-900 uppercase tracking-tight">
                Overdue Receivables Chasing Queue ({overdueInvoices.length})
              </h2>
            </div>
            <span className="text-xs font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded-full border border-red-300">
              Needs Follow-Up
            </span>
          </div>

          <div className="space-y-2">
            {overdueInvoices.map(inv => (
              <div
                key={inv.id}
                className="bg-white border border-red-300 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-sm text-black">{inv.invoice_number}</span>
                    <span className="text-xs font-bold text-zinc-600">&bull; {inv.customer_name}</span>
                    <span className="text-[10px] bg-red-100 text-red-800 font-bold px-1.5 py-0.5 rounded">
                      Due: {inv.due_date}
                    </span>
                  </div>
                  <div className="text-xs text-zinc-500 mt-0.5">
                    Unpaid Balance: <span className="font-bold text-red-600">${(inv.total_amount - inv.paid_amount).toFixed(2)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <button
                    onClick={() => onOpenInvoice(inv.id)}
                    className="px-2.5 py-1 text-xs font-bold bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-lg border border-zinc-300 transition"
                  >
                    View
                  </button>
                  <button
                    onClick={() => onOpenPayment(inv)}
                    className="px-2.5 py-1 text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg border border-emerald-700 transition"
                  >
                    Record Payment
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Subscription Lifecycle Pipeline Visualizer */}
      <div className="bg-white border-2 border-tinker-border rounded-2xl p-4 shadow-neo-sm">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-black uppercase tracking-tight text-black flex items-center gap-2">
            <span className="w-3 h-3 bg-tinker-yellow border border-black rounded-sm inline-block"></span>
            Subscription Lifecycle Pipeline
          </h2>
          <span className="text-xs text-zinc-500 font-medium">Draft &rarr; Quote &rarr; Active &rarr; Closed</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
          <div className="p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl">
            <div className="font-bold text-zinc-500 uppercase text-[10px]">1. Draft</div>
            <div className="font-black text-lg text-zinc-800 mt-0.5">
              {subscriptions.filter(s => s.status === 'draft').length}
            </div>
          </div>
          <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-xl">
            <div className="font-bold text-blue-600 uppercase text-[10px]">2. Quotation</div>
            <div className="font-black text-lg text-blue-900 mt-0.5">
              {subscriptions.filter(s => s.status === 'quotation').length}
            </div>
          </div>
          <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl">
            <div className="font-bold text-amber-700 uppercase text-[10px]">3. Confirmed</div>
            <div className="font-black text-lg text-amber-900 mt-0.5">
              {subscriptions.filter(s => s.status === 'confirmed').length}
            </div>
          </div>
          <div className="p-2.5 bg-emerald-50 border border-emerald-300 rounded-xl">
            <div className="font-bold text-emerald-700 uppercase text-[10px]">4. Active</div>
            <div className="font-black text-lg text-emerald-900 mt-0.5">
              {subscriptions.filter(s => s.status === 'active').length}
            </div>
          </div>
          <div className="col-span-2 sm:col-span-1 p-2.5 bg-purple-50 border border-purple-200 rounded-xl">
            <div className="font-bold text-purple-700 uppercase text-[10px]">Paused / Closed</div>
            <div className="font-black text-lg text-purple-900 mt-0.5">
              {subscriptions.filter(s => s.status === 'paused' || s.status === 'closed').length}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Recent Invoices Table / Feed */}
      <div className="bg-white border-2 border-tinker-border rounded-2xl p-4 shadow-neo-sm">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-black uppercase tracking-tight text-black">
            Recent Invoices Activity
          </h2>
          <span className="text-xs font-semibold text-zinc-500">Live Sync</span>
        </div>

        <div className="divide-y divide-zinc-100">
          {invoices.slice(0, 5).map(inv => (
            <div
              key={inv.id}
              onClick={() => onOpenInvoice(inv.id)}
              className="py-2.5 flex items-center justify-between cursor-pointer hover:bg-zinc-50 px-2 rounded-lg transition"
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-xl border border-black flex items-center justify-center font-black text-xs ${
                  inv.status === 'paid' ? 'bg-emerald-200 text-emerald-950' :
                  inv.is_overdue ? 'bg-red-200 text-red-950' :
                  inv.status === 'confirmed' ? 'bg-tinker-yellow text-black' : 'bg-zinc-200'
                }`}>
                  {inv.status === 'paid' ? '✓' : '$'}
                </div>
                <div>
                  <div className="font-extrabold text-xs text-black flex items-center gap-1.5">
                    {inv.invoice_number}
                    <span className="font-medium text-zinc-500">&bull; {inv.customer_name}</span>
                  </div>
                  <div className="text-[11px] text-zinc-500">
                    Period: {inv.billing_period_start || inv.issue_date} &rarr; {inv.billing_period_end || inv.due_date}
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="font-black text-sm text-black">
                  ${inv.total_amount.toFixed(2)}
                </div>
                <div className={`text-[10px] font-bold uppercase ${
                  inv.status === 'paid' ? 'text-emerald-600' :
                  inv.is_overdue ? 'text-red-600' : 'text-amber-600'
                }`}>
                  {inv.is_overdue ? 'OVERDUE' : inv.status}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
