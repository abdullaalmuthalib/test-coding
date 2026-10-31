import React, { useState } from 'react';
import {
  LayoutDashboard, Zap, ReceiptText, Package, Tag, Shield,
  FileSpreadsheet, Gauge, ChevronDown, Check, LogOut, KeyRound, Sparkles
} from 'lucide-react';

export default function Sidebar({
  activeTab,
  setActiveTab,
  currentUser,
  onSwitchUser,
  onLogout,
  onOpenAuth,
  overdueCount,
  quotesCount,
  analytics
}) {
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const isCustomer = currentUser?.role === 'customer';

  const demoAccounts = [
    { role: 'admin', email: 'admin@brightloop.com', name: 'Brightloop Admin', label: 'Admin (Full Control)' },
    { role: 'staff', email: 'staff@brightloop.com', name: 'Sarah Sales Lead', label: 'Staff (Day-to-day Operations)' },
    { role: 'customer', email: 'elena@novatech.co', name: 'Elena Gilbert', label: 'Customer (NovaTech Portal)' },
    { role: 'customer', email: 'priya@tinkerlabs.org', name: 'Priya Sharma', label: 'Customer (TinkerLabs)' },
  ];

  const navItems = [
    { id: 'dashboard', label: 'Finance Overview', icon: LayoutDashboard },
    { id: 'subscriptions', label: 'Subscriptions', icon: Zap, badge: quotesCount > 0 ? quotesCount : null },
    { id: 'invoices', label: 'Invoices & Billing', icon: ReceiptText, badge: overdueCount > 0 ? overdueCount : null, badgeColor: 'bg-red-500' },
    { id: 'templates', label: 'Quotation Templates', icon: FileSpreadsheet, hidden: isCustomer },
    { id: 'catalog', label: 'Products & Plans', icon: Package },
    { id: 'discounts', label: 'Discount Rules', icon: Tag, hidden: isCustomer },
    { id: 'admin', label: isCustomer ? 'Account Portal' : 'Admin & Staff Hub', icon: Shield },
    { id: 'benchmark', label: 'Scale SLA Benchmark', icon: Gauge, hidden: isCustomer },
  ];

  return (
    <aside className="w-64 bg-white border-r-2 border-tinker-border flex flex-col shrink-0 h-screen sticky top-0 z-30 select-none">
      {/* Brand Header */}
      <div className="p-4 border-b-2 border-tinker-border flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-tinker-yellow border-2 border-tinker-border rounded-xl shadow-neo-sm flex items-center justify-center font-black text-black text-lg">
            ⚡
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-black tracking-tight text-lg text-black">BRIGHTLOOP</span>
              <span className="text-[9px] font-bold px-1.5 py-0.2 bg-tinker-lime border border-black rounded shadow-[1px_1px_0px_#000]">
                OS
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 font-semibold -mt-0.5">
              Subscription Management
            </p>
          </div>
        </div>
      </div>

      {/* Role / Current Persona Switcher */}
      <div className="p-3 border-b-2 border-zinc-100 relative">
        <div className="text-[10px] font-black uppercase tracking-wider text-zinc-400 mb-1 px-1">
          Active Persona
        </div>
        <button
          onClick={() => setShowUserDropdown(!showUserDropdown)}
          className="w-full flex items-center justify-between p-2 bg-zinc-50 hover:bg-tinker-yellow-light border-2 border-tinker-border rounded-xl shadow-neo-sm transition text-left neo-btn"
        >
          <div className="flex items-center gap-2 overflow-hidden">
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs border border-black shrink-0 ${
              currentUser?.role === 'admin' ? 'bg-tinker-yellow text-black' :
              currentUser?.role === 'staff' ? 'bg-tinker-blue text-white' :
              'bg-tinker-lime text-black'
            }`}>
              {currentUser?.role === 'admin' ? 'A' : currentUser?.role === 'staff' ? 'S' : 'C'}
            </div>
            <div className="truncate">
              <div className="text-xs font-black text-black truncate">{currentUser?.name}</div>
              <div className="text-[10px] uppercase font-bold text-zinc-500">{currentUser?.role}</div>
            </div>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
        </button>

        {showUserDropdown && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setShowUserDropdown(false)} />
            <div className="absolute left-3 right-3 top-16 bg-white border-2 border-tinker-border rounded-2xl shadow-neo p-2 z-50 text-xs">
              <div className="px-2 py-1 text-[10px] font-black uppercase text-zinc-400 border-b border-zinc-100 mb-1">
                Switch Role / Test Persona
              </div>
              <div className="space-y-1">
                {demoAccounts.map(acc => {
                  const isActive = currentUser?.email === acc.email;
                  return (
                    <button
                      key={acc.email}
                      onClick={() => {
                        onSwitchUser(acc.email);
                        setShowUserDropdown(false);
                      }}
                      className={`w-full text-left p-1.5 rounded-lg border flex items-center justify-between ${
                        isActive
                          ? 'bg-tinker-yellow-light border-amber-300 font-bold'
                          : 'border-transparent hover:bg-zinc-50'
                      }`}
                    >
                      <div>
                        <div className="font-bold text-zinc-900">{acc.label}</div>
                        <div className="text-[10px] text-zinc-500">{acc.email}</div>
                      </div>
                      {isActive && <Check className="w-3.5 h-3.5 text-black stroke-[3]" />}
                    </button>
                  );
                })}
              </div>

              <div className="border-t border-zinc-100 mt-2 pt-1 flex flex-col gap-0.5">
                <button
                  onClick={() => {
                    setShowUserDropdown(false);
                    onOpenAuth('login');
                  }}
                  className="w-full text-left px-2 py-1 text-zinc-700 hover:bg-zinc-100 rounded font-semibold flex items-center gap-1.5 text-[11px]"
                >
                  <KeyRound className="w-3 h-3" />
                  Custom Login
                </button>
                <button
                  onClick={() => {
                    setShowUserDropdown(false);
                    onLogout();
                  }}
                  className="w-full text-left px-2 py-1 text-red-600 hover:bg-red-50 rounded font-semibold flex items-center gap-1.5 text-[11px]"
                >
                  <LogOut className="w-3 h-3" />
                  Sign Out
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1.5">
        {navItems.filter(item => !item.hidden).map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl border-2 transition neo-btn text-left ${
                isActive
                  ? 'bg-tinker-yellow border-tinker-border text-black font-black shadow-neo-sm'
                  : 'bg-transparent border-transparent hover:bg-zinc-100 text-zinc-700 font-bold'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon className={`w-4 h-4 ${isActive ? 'stroke-[2.5]' : 'stroke-[2]'}`} />
                <span className="text-xs">{item.label}</span>
              </div>
              {item.badge && (
                <span className={`text-[10px] font-black text-white px-1.5 py-0.2 rounded-full border border-black ${
                  item.badgeColor || 'bg-tinker-purple'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer SLA Performance Badge */}
      <div className="p-3 border-t-2 border-tinker-border bg-zinc-50">
        <div className="flex items-center justify-between text-[11px] font-bold text-zinc-600 mb-1">
          <span>Engine Status</span>
          <span className="text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded font-black border border-emerald-300">
            ONLINE
          </span>
        </div>
        <div className="text-[10px] text-zinc-500">
          Local SQLite WAL &bull; <b className="text-zinc-800">{analytics?.performance?.response_time_ms || 4}ms</b> SLA
        </div>
        <div className="text-[9px] text-zinc-400 mt-0.5">
          Target: &lt;2000ms at scale
        </div>
      </div>
    </aside>
  );
}
