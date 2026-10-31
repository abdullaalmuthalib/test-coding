import React, { useState } from 'react';
import { Sparkles, Shield, User, Smartphone, Monitor, ChevronDown, Check, LogOut, KeyRound } from 'lucide-react';

export default function Header({
  currentUser,
  onSwitchUser,
  onLogout,
  onOpenAuth,
  isMobileFrame,
  setIsMobileFrame,
  analytics
}) {
  const [showUserMenu, setShowUserMenu] = useState(false);

  const demoAccounts = [
    { role: 'admin', email: 'admin@brightloop.com', name: 'Brightloop Admin', label: 'Admin (Full Control)' },
    { role: 'staff', email: 'staff@brightloop.com', name: 'Sarah Sales Lead', label: 'Staff (Operations & Billing)' },
    { role: 'customer', email: 'elena@novatech.co', name: 'Elena Gilbert', label: 'Customer (NovaTech Portal)' },
    { role: 'customer', email: 'priya@tinkerlabs.org', name: 'Priya Sharma', label: 'Customer (TinkerLabs)' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white border-b-2 border-tinker-border px-4 py-3 shadow-sm">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        {/* Brand with TinkerHub Vibe */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-tinker-yellow border-2 border-tinker-border rounded-xl shadow-neo-sm flex items-center justify-center font-black text-black text-lg">
            ⚡
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold tracking-tight text-lg text-black">BRIGHTLOOP</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 bg-tinker-lime border border-tinker-border rounded-md shadow-[1px_1px_0px_#121316]">
                MAKER OS
              </span>
            </div>
            <p className="text-[11px] text-gray-500 font-medium -mt-0.5 hidden sm:block">
              Subscription & Recurring Billing
            </p>
          </div>
        </div>

        {/* Right Controls: Device Mode, SLA Badge, User Dropdown */}
        <div className="flex items-center gap-2">
          {/* SLA Performance Pill */}
          <div className="hidden md:flex items-center gap-1 text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-300 px-2 py-1 rounded-full">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Local DB &bull; {analytics?.performance?.response_time_ms || 4}ms SLA</span>
          </div>

          {/* Toggle Device Frame (Mobile Frame vs Fluid View) */}
          <button
            onClick={() => setIsMobileFrame(!isMobileFrame)}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold bg-tinker-canvas border-2 border-tinker-border rounded-lg shadow-neo-sm hover:bg-tinker-yellow transition neo-btn"
            title="Toggle Mobile Viewport Simulator"
          >
            {isMobileFrame ? (
              <>
                <Monitor className="w-3.5 h-3.5 text-zinc-800" />
                <span>Desktop Fluid</span>
              </>
            ) : (
              <>
                <Smartphone className="w-3.5 h-3.5 text-zinc-800" />
                <span>Mobile Shell</span>
              </>
            )}
          </button>

          {/* User Account / Role Switcher Pill */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 px-3 py-1.5 bg-white border-2 border-tinker-border rounded-xl shadow-neo-sm hover:bg-zinc-50 transition neo-btn"
            >
              <div className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs border border-tinker-border ${
                currentUser?.role === 'admin' ? 'bg-tinker-yellow text-black' :
                currentUser?.role === 'staff' ? 'bg-tinker-blue text-white' :
                'bg-tinker-lime text-black'
              }`}>
                {currentUser?.role === 'admin' ? 'A' : currentUser?.role === 'staff' ? 'S' : 'C'}
              </div>
              <div className="text-left hidden xs:block">
                <div className="text-xs font-bold leading-none text-zinc-900 truncate max-w-[110px]">
                  {currentUser?.name || 'Guest User'}
                </div>
                <div className="text-[10px] uppercase font-bold text-zinc-500 mt-0.5">
                  {currentUser?.role || 'Guest'}
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-zinc-600" />
            </button>

            {/* Switcher Dropdown */}
            {showUserMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
                <div className="absolute right-0 mt-2 w-72 bg-white border-2 border-tinker-border rounded-2xl shadow-neo p-2.5 z-50 text-sm">
                  <div className="px-2 py-1.5 border-b border-zinc-100 mb-2">
                    <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                      Switch Role / Demo Persona
                    </p>
                    <p className="text-xs text-zinc-600 font-medium">
                      Test multi-role permissions instantly:
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
                              ? 'bg-tinker-yellow-light border-tinker-yellow font-bold text-zinc-900'
                              : 'hover:bg-zinc-50 border-transparent text-zinc-700'
                          }`}
                        >
                          <div>
                            <div className="text-xs font-bold">{acc.label}</div>
                            <div className="text-[11px] text-zinc-500 font-normal">{acc.email}</div>
                          </div>
                          {isActive && <Check className="w-4 h-4 text-zinc-900 stroke-[3]" />}
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
                      className="w-full text-left px-2 py-1.5 text-xs font-bold text-zinc-700 hover:bg-zinc-100 rounded-lg flex items-center gap-2"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                      Login with Custom Credentials
                    </button>
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        onLogout();
                      }}
                      className="w-full text-left px-2 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-2"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Log out
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
