import React, { useState } from 'react';
import {
  Zap, ChevronDown, Check, LogOut, KeyRound, Calendar,
  Play, Shield, Sparkles, RefreshCw
} from 'lucide-react';

export default function Header({
  currentUser,
  onSwitchUser,
  onLogout,
  onOpenAuth,
  onRunBillingDay,
  isBillingRunning,
  analytics
}) {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [billingDate, setBillingDate] = useState(new Date().toISOString().split('T')[0]);
  const [showBillingDialog, setShowBillingDialog] = useState(false);

  const demoAccounts = [
    { role: 'admin', email: 'admin@brightloop.com', name: 'Brightloop Admin', label: 'Admin (Full Control)' },
    { role: 'staff', email: 'staff@brightloop.com', name: 'Sarah Sales Lead', label: 'Staff (Day-to-day Operations)' },
    { role: 'customer', email: 'elena@novatech.co', name: 'Elena Gilbert', label: 'Customer (NovaTech Portal)' },
    { role: 'customer', email: 'priya@tinkerlabs.org', name: 'Priya Sharma', label: 'Customer (TinkerLabs)' },
  ];

  const isCustomer = currentUser?.role === 'customer';

  return (
    <header className="sticky top-0 z-20 bg-white border-b-2 border-tinker-border px-6 py-3.5 shadow-sm">
      <div className="flex items-center justify-between">
        {/* Left: Platform Context Title */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2">
            <span className="text-xs font-black uppercase tracking-wider bg-tinker-yellow text-black px-2 py-0.5 rounded border border-black shadow-[1px_1px_0px_#000]">
              {isCustomer ? 'Customer Self-Service Portal' : 'Operations Management'}
            </span>
            <span className="text-xs font-semibold text-zinc-500">
              {currentUser?.company_name ? `Organization: ${currentUser.company_name}` : 'Brightloop Core'}
            </span>
          </div>
        </div>

        {/* Right: Quick Billing Day Run, SLA Indicator & Account */}
        <div className="flex items-center gap-3">
          {/* SLA Performance Pill */}
          <div className="hidden lg:flex items-center gap-1.5 text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 px-2.5 py-1 rounded-full">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Local DB &bull; {analytics?.performance?.response_time_ms || 3}ms SLA Target Met</span>
          </div>

          {/* Run Billing Day Trigger Button (Admin/Staff only) */}
          {!isCustomer && (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setShowBillingDialog(true)}
                disabled={isBillingRunning}
                className="px-3.5 py-1.5 bg-tinker-yellow hover:bg-tinker-yellow-hover text-black font-black text-xs rounded-xl border-2 border-tinker-border shadow-neo-sm hover:shadow-neo transition flex items-center gap-1.5 neo-btn"
                title="Idempotent automated billing run for all due subscriptions"
              >
                <Zap className={`w-3.5 h-3.5 ${isBillingRunning ? 'animate-spin' : 'fill-black'}`} />
                <span>Run Billing Day</span>
              </button>
            </div>
          )}

          {/* Quick Persona Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 px-3 py-1.5 bg-zinc-50 border-2 border-tinker-border rounded-xl shadow-neo-sm hover:bg-tinker-yellow-light transition neo-btn"
            >
              <div className={`w-6 h-6 rounded-lg flex items-center justify-center font-black text-xs border border-black ${
                currentUser?.role === 'admin' ? 'bg-tinker-yellow text-black' :
                currentUser?.role === 'staff' ? 'bg-tinker-blue text-white' :
                'bg-tinker-lime text-black'
              }`}>
                {currentUser?.role === 'admin' ? 'A' : currentUser?.role === 'staff' ? 'S' : 'C'}
              </div>
              <div className="text-left hidden sm:block">
                <div className="text-xs font-black leading-none text-black truncate max-w-[120px]">
                  {currentUser?.name || 'Guest User'}
                </div>
                <div className="text-[10px] uppercase font-bold text-zinc-500 mt-0.5">
                  {currentUser?.role || 'Guest'}
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-zinc-600" />
            </button>

            {showUserMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
                <div className="absolute right-0 mt-2 w-72 bg-white border-2 border-tinker-border rounded-2xl shadow-neo p-2.5 z-50 text-xs">
                  <div className="px-2 py-1.5 border-b border-zinc-100 mb-1.5">
                    <p className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">
                      Switch Role / Demo Persona
                    </p>
                    <p className="text-[11px] text-zinc-600 font-medium">
                      Test multi-role permissions in 1 click:
                    </p>
                  </div>

                  <div className="space-y-1">
                    {demoAccounts.map(acc => {
                      const isActive = currentUser?.email === acc.email;
                      return (
                        <button
                          key={acc.email}
                          onClick={() => {
                            onSwitchUser(acc.email);
                            setShowUserMenu(false);
                          }}
                          className={`w-full flex items-center justify-between p-2 rounded-xl text-left border ${
                            isActive
                              ? 'bg-tinker-yellow-light border-amber-300 font-bold text-black'
                              : 'hover:bg-zinc-50 border-transparent text-zinc-700'
                          }`}
                        >
                          <div>
                            <div className="font-bold">{acc.label}</div>
                            <div className="text-[10px] text-zinc-500">{acc.email}</div>
                          </div>
                          {isActive && <Check className="w-3.5 h-3.5 text-black stroke-[3]" />}
                        </button>
                      );
                    })}
                  </div>

                  <div className="border-t border-zinc-100 mt-2 pt-2 flex flex-col gap-1">
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        onOpenAuth('login');
                      }}
                      className="w-full text-left px-2 py-1.5 font-bold text-zinc-700 hover:bg-zinc-100 rounded-lg flex items-center gap-2"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                      Login with Custom Credentials
                    </button>
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        onLogout();
                      }}
                      className="w-full text-left px-2 py-1.5 font-bold text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-2"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Sign Out
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Billing Day Dialog with Date & Idempotency Controls */}
      {showBillingDialog && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border-2 border-tinker-border rounded-2xl w-full max-w-md p-6 shadow-neo relative">
            <h2 className="text-lg font-black text-black mb-1 flex items-center gap-2">
              <Zap className="w-5 h-5 fill-black" />
              <span>Execute Billing Day Engine</span>
            </h2>
            <p className="text-xs text-zinc-500 mb-4">
              Idempotent automated invoice generator &bull; Scans all due active subscriptions, applies discounts, calculates taxes, and prevents duplicate billing.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-zinc-700">Billing As Of Date:</label>
                <input
                  type="date"
                  value={billingDate}
                  onChange={e => setBillingDate(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border-2 border-zinc-300 rounded-xl font-bold"
                />
                <p className="text-[10px] text-zinc-500 mt-1">
                  Subscriptions with <code className="bg-zinc-100 px-1 py-0.5 rounded">next_billing_date &le; {billingDate}</code> will be invoiced.
                </p>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-1">
                <div className="font-bold text-amber-900">🛡️ Idempotent Safety Guarantee</div>
                <div className="text-[11px] text-amber-800">
                  Running this repeatedly for the same date will safely skip subscriptions already billed for the period.
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setShowBillingDialog(false)}
                  className="px-4 py-2 font-bold text-zinc-600 hover:bg-zinc-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  onClick={() => {
                    setShowBillingDialog(false);
                    onRunBillingDay(billingDate);
                  }}
                  className="px-5 py-2 bg-tinker-yellow hover:bg-tinker-yellow-hover text-black font-black rounded-xl border-2 border-tinker-border shadow-neo-sm neo-btn flex items-center gap-1.5"
                >
                  <Play className="w-3.5 h-3.5 fill-black" />
                  <span>Execute Billing Run</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
