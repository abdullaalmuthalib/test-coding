import React from 'react';
import { LayoutDashboard, Zap, ReceiptText, Package, SlidersHorizontal } from 'lucide-react';

export default function BottomNav({ activeTab, setActiveTab, userRole, overdueCount, quotesCount }) {
  const tabs = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'subscriptions', label: 'Subs', icon: Zap, badge: quotesCount > 0 ? quotesCount : null },
    { id: 'invoices', label: 'Invoices', icon: ReceiptText, badge: overdueCount > 0 ? overdueCount : null, badgeColor: 'bg-red-500' },
    { id: 'catalog', label: 'Catalog', icon: Package },
    { id: 'admin', label: userRole === 'customer' ? 'Profile' : 'Admin Hub', icon: SlidersHorizontal },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t-2 border-tinker-border px-2 py-1.5 shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
      <div className="max-w-md mx-auto flex items-center justify-around">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition-all duration-150 ${
                isActive
                  ? 'bg-tinker-yellow border-2 border-tinker-border shadow-neo-sm text-black -translate-y-1'
                  : 'text-zinc-600 hover:text-black hover:bg-zinc-100'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-[2]'}`} />
                {tab.badge && (
                  <span className={`absolute -top-1.5 -right-2.5 min-w-[16px] h-4 text-[10px] font-black text-white px-1 flex items-center justify-center rounded-full border border-black shadow-sm ${
                    tab.badgeColor || 'bg-tinker-purple'
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className={`text-[10.5px] mt-0.5 tracking-tight ${isActive ? 'font-black' : 'font-semibold'}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
