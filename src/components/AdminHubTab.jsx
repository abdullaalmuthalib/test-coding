import React, { useState } from 'react';
import {
  Tag, Percent, Shield, UserPlus, KeyRound, CheckCircle2,
  AlertCircle, Database, Plus, Sparkles, Lock
} from 'lucide-react';

export default function AdminHubTab({
  currentUser,
  discounts,
  taxes,
  users,
  products,
  onCreateDiscount,
  onCreateTax,
  onCreateStaff,
  onResetPassword
}) {
  const isAdmin = currentUser?.role === 'admin';
  const isCustomer = currentUser?.role === 'customer';

  // Discount Form State
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [dCode, setDCode] = useState('');
  const [dName, setDName] = useState('');
  const [dType, setDType] = useState('percentage');
  const [dValue, setDValue] = useState('');
  const [dMinSpend, setDMinSpend] = useState('0');
  const [dTargetType, setDTargetType] = useState('subscription');
  const [dTargetProdId, setDTargetProdId] = useState('');
  const [dLimit, setDLimit] = useState('100');

  // Tax Form State
  const [showTaxModal, setShowTaxModal] = useState(false);
  const [tName, setTName] = useState('');
  const [tRate, setTRate] = useState('');
  const [tDesc, setTDesc] = useState('');
  const [tDefault, setTDefault] = useState(false);

  // Staff Form State
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [sName, setSName] = useState('');
  const [sEmail, setSEmail] = useState('');
  const [sPassword, setSPassword] = useState('');
  const [staffError, setStaffError] = useState('');

  // Password Reset Sandbox State
  const [resetEmail, setResetEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [resetNewPass, setResetNewPass] = useState('');
  const [resetStatus, setResetStatus] = useState('');

  const submitDiscount = (e) => {
    e.preventDefault();
    onCreateDiscount({
      code: dCode,
      name: dName,
      type: dType,
      value: parseFloat(dValue),
      min_purchase_amount: parseFloat(dMinSpend || 0),
      target_type: dTargetType,
      target_product_id: dTargetType === 'product' && dTargetProdId ? dTargetProdId : null,
      usage_limit: parseInt(dLimit || 100)
    });
    setShowDiscountModal(false);
    setDCode('');
    setDName('');
    setDValue('');
  };

  const submitTax = (e) => {
    e.preventDefault();
    onCreateTax({
      name: tName,
      rate: parseFloat(tRate),
      description: tDesc,
      is_default: tDefault
    });
    setShowTaxModal(false);
    setTName('');
    setTRate('');
    setTDesc('');
  };

  const submitStaff = async (e) => {
    e.preventDefault();
    setStaffError('');
    try {
      await onCreateStaff({ name: sName, email: sEmail, password: sPassword });
      setShowStaffModal(false);
      setSName('');
      setSEmail('');
      setSPassword('');
    } catch (err) {
      setStaffError(err.message || 'Failed to create staff');
    }
  };

  const handleTestForgotPassword = async () => {
    if (!resetEmail) return;
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail })
      });
      const data = await res.json();
      if (data.resetToken) {
        setResetToken(data.resetToken);
        setResetStatus(`Reset token generated & dispatched! Token: ${data.resetToken}`);
      } else {
        setResetStatus(data.message || 'Check email for reset instructions');
      }
    } catch (err) {
      setResetStatus('Error requesting reset');
    }
  };

  const handleTestResetPassword = async () => {
    if (!resetToken || !resetNewPass) return;
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: resetToken, newPassword: resetNewPass })
      });
      const data = await res.json();
      if (res.ok) {
        setResetStatus('✅ Password reset succeeded! You can now log in.');
      } else {
        setResetStatus(`❌ ${data.error}`);
      }
    } catch (err) {
      setResetStatus('Error updating password');
    }
  };

  if (isCustomer) {
    return (
      <div className="space-y-4 pb-20 animate-fade-in">
        <div className="bg-white border-2 border-tinker-border rounded-2xl p-5 shadow-neo">
          <h2 className="text-lg font-black text-black">Customer Profile</h2>
          <div className="mt-3 space-y-2 text-xs">
            <div><span className="text-zinc-500 font-bold">Name:</span> <b className="text-zinc-900">{currentUser?.name}</b></div>
            <div><span className="text-zinc-500 font-bold">Email:</span> <b className="text-zinc-900">{currentUser?.email}</b></div>
            <div><span className="text-zinc-500 font-bold">Company:</span> <b className="text-zinc-900">{currentUser?.company_name || 'Individual'}</b></div>
            <div><span className="text-zinc-500 font-bold">Portal Access:</span> <span className="text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded font-bold">Active Customer Portal</span></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-20 animate-fade-in">
      {/* Header Banner */}
      <div className="bg-white border-2 border-tinker-border rounded-2xl p-4 shadow-neo-sm">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black uppercase text-tinker-yellow bg-black px-2 py-0.5 rounded">
                Admin Control Room
              </span>
              <span className="text-xs font-bold text-zinc-500">&bull; Brightloop Governance</span>
            </div>
            <h2 className="text-lg font-black text-black mt-1">Rules, Discounts & Staff Directory</h2>
          </div>
          <div className="w-8 h-8 rounded-xl bg-tinker-yellow border border-black flex items-center justify-center font-black">
            ⚙️
          </div>
        </div>
      </div>

      {/* DISCOUNT RULES SECTION (Prompt Rule: Only Admin can create discount rules) */}
      <div className="bg-white border-2 border-tinker-border rounded-2xl p-4 shadow-neo-sm">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-black text-sm text-black flex items-center gap-1.5">
              <Tag className="w-4 h-4 text-emerald-600" />
              <span>Discount Rules Engine ({discounts.length})</span>
            </h3>
            <p className="text-[11px] text-zinc-500">Auto-applies on billing day invoices without manual remembering</p>
          </div>
          {isAdmin && (
            <button
              onClick={() => setShowDiscountModal(true)}
              className="px-2.5 py-1 text-xs font-bold bg-tinker-yellow hover:bg-tinker-yellow-hover text-black rounded-lg border-2 border-tinker-border shadow-neo-sm neo-btn flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span>New Rule</span>
            </button>
          )}
        </div>

        <div className="space-y-2">
          {discounts.map(d => (
            <div key={d.id} className="bg-zinc-50 border border-zinc-200 rounded-xl p-3 flex items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-black text-xs bg-emerald-100 text-emerald-900 border border-emerald-300 px-2 py-0.5 rounded">
                    {d.code}
                  </span>
                  <span className="font-extrabold text-xs text-zinc-900">{d.name}</span>
                </div>
                <div className="text-[11px] text-zinc-500 mt-1">
                  Value: <b className="text-zinc-800">{d.type === 'percentage' ? `${d.value}% OFF` : `$${d.value} OFF`}</b> &bull; Target: {d.target_type === 'product' ? `Product (${d.target_product_name || 'Specific'})` : 'Whole Subscription'} &bull; Min Spend: ${d.min_purchase_amount}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs font-black text-zinc-800">
                  {d.times_used} / {d.usage_limit} used
                </div>
                <div className={`text-[10px] font-bold uppercase ${d.times_used >= d.usage_limit ? 'text-red-600' : 'text-emerald-600'}`}>
                  {d.times_used >= d.usage_limit ? 'Exhausted' : 'Active'}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* TAX RULES SECTION */}
      <div className="bg-white border-2 border-tinker-border rounded-2xl p-4 shadow-neo-sm">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-black text-sm text-black flex items-center gap-1.5">
              <Percent className="w-4 h-4 text-blue-600" />
              <span>Automatic Tax Rules ({taxes.length})</span>
            </h3>
            <p className="text-[11px] text-zinc-500">Calculated automatically on invoice generation</p>
          </div>
          {isAdmin && (
            <button
              onClick={() => setShowTaxModal(true)}
              className="px-2.5 py-1 text-xs font-bold bg-white hover:bg-zinc-100 text-zinc-800 rounded-lg border-2 border-tinker-border shadow-neo-sm neo-btn flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span>Add Tax</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {taxes.map(t => (
            <div key={t.id} className="bg-zinc-50 border border-zinc-200 rounded-xl p-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-black">{t.name}</span>
                {t.is_default === 1 && (
                  <span className="text-[9px] bg-tinker-yellow text-black font-black px-1.5 py-0.2 rounded border border-black">
                    Default
                  </span>
                )}
              </div>
              <div className="text-xl font-black text-black mt-1">{t.rate}%</div>
              <p className="text-[10px] text-zinc-500 mt-0.5">{t.description || 'Standard calculation'}</p>
            </div>
          ))}
        </div>
      </div>

      {/* STAFF DIRECTORY & CREATION (Prompt Rule: Only the admin can add a new member of staff) */}
      <div className="bg-white border-2 border-tinker-border rounded-2xl p-4 shadow-neo-sm">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-black text-sm text-black flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-tinker-purple" />
              <span>Team & Access Control</span>
            </h3>
            <p className="text-[11px] text-zinc-500">
              Only admin can add internal staff members
            </p>
          </div>
          {isAdmin && (
            <button
              onClick={() => setShowStaffModal(true)}
              className="px-2.5 py-1 text-xs font-bold bg-tinker-purple text-white hover:bg-purple-800 rounded-lg border-2 border-tinker-border shadow-neo-sm neo-btn flex items-center gap-1"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Add Staff</span>
            </button>
          )}
        </div>

        <div className="divide-y divide-zinc-100">
          {users.map(u => (
            <div key={u.id} className="py-2 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2.5">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs border border-tinker-border ${
                  u.role === 'admin' ? 'bg-tinker-yellow text-black' :
                  u.role === 'staff' ? 'bg-tinker-blue text-white' :
                  'bg-zinc-200 text-zinc-800'
                }`}>
                  {u.name.charAt(0)}
                </div>
                <div>
                  <div className="font-bold text-zinc-900">{u.name}</div>
                  <div className="text-[11px] text-zinc-500">{u.email}</div>
                </div>
              </div>
              <div className="text-right">
                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border ${
                  u.role === 'admin' ? 'bg-tinker-yellow-light text-amber-900 border-amber-300' :
                  u.role === 'staff' ? 'bg-blue-50 text-blue-800 border-blue-200' :
                  'bg-zinc-100 text-zinc-700 border-zinc-200'
                }`}>
                  {u.role}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* PASSWORD RESET SANDBOX (Prompt Requirement: "If they forget it later, a reset link should arrive at their registered email.") */}
      <div className="bg-white border-2 border-tinker-border rounded-2xl p-4 shadow-neo-sm">
        <h3 className="font-black text-sm text-black flex items-center gap-1.5 mb-1">
          <KeyRound className="w-4 h-4 text-amber-600" />
          <span>Password Reset Tester & Validator</span>
        </h3>
        <p className="text-[11px] text-zinc-500 mb-3">
          Rule: Password must be &gt;8 chars with uppercase, lowercase, and special character.
        </p>

        <div className="space-y-2">
          <div className="flex gap-2">
            <input
              type="email"
              placeholder="Enter customer/staff email to test reset"
              value={resetEmail}
              onChange={e => setResetEmail(e.target.value)}
              className="flex-1 px-3 py-1.5 border border-zinc-300 rounded-lg text-xs"
            />
            <button
              onClick={handleTestForgotPassword}
              className="px-3 py-1.5 bg-zinc-800 hover:bg-black text-white text-xs font-bold rounded-lg border border-black shadow-neo-sm"
            >
              Dispatch Link
            </button>
          </div>

          {resetToken && (
            <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl space-y-2">
              <div className="text-[11px] font-mono text-zinc-600">Active Token: {resetToken}</div>
              <div className="flex gap-2">
                <input
                  type="password"
                  placeholder="New strong password (e.g. Secret@2026)"
                  value={resetNewPass}
                  onChange={e => setResetNewPass(e.target.value)}
                  className="flex-1 px-3 py-1.5 border border-zinc-300 rounded-lg text-xs"
                />
                <button
                  onClick={handleTestResetPassword}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg"
                >
                  Confirm Reset
                </button>
              </div>
            </div>
          )}

          {resetStatus && (
            <div className="text-xs font-bold text-zinc-700 bg-amber-50 border border-amber-200 p-2 rounded-lg">
              {resetStatus}
            </div>
          )}
        </div>
      </div>

      {/* CREATE DISCOUNT MODAL */}
      {showDiscountModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border-2 border-tinker-border rounded-2xl w-full max-w-lg p-5 shadow-neo max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-black text-black mb-1">Create Discount Rule</h2>
            <p className="text-xs text-zinc-500 mb-4">Admin only &bull; Rules apply on next invoice run automatically</p>

            <form onSubmit={submitDiscount} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-zinc-700">Discount Code</label>
                  <input
                    type="text"
                    required
                    placeholder="SUMMER25"
                    value={dCode}
                    onChange={e => setDCode(e.target.value)}
                    className="w-full mt-1 px-3 py-2 border-2 border-zinc-300 rounded-xl text-xs font-mono font-bold uppercase"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-zinc-700">Display Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Summer Growth Promo"
                    value={dName}
                    onChange={e => setDName(e.target.value)}
                    className="w-full mt-1 px-3 py-2 border-2 border-zinc-300 rounded-xl text-xs font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-xs font-bold text-zinc-700">Type</label>
                  <select
                    value={dType}
                    onChange={e => setDType(e.target.value)}
                    className="w-full mt-1 px-2.5 py-2 border-2 border-zinc-300 rounded-xl text-xs font-medium"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount ($)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-zinc-700">Value</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="15"
                    value={dValue}
                    onChange={e => setDValue(e.target.value)}
                    className="w-full mt-1 px-3 py-2 border-2 border-zinc-300 rounded-xl text-xs font-medium"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-zinc-700">Usage Limit</label>
                  <input
                    type="number"
                    value={dLimit}
                    onChange={e => setDLimit(e.target.value)}
                    className="w-full mt-1 px-3 py-2 border-2 border-zinc-300 rounded-xl text-xs font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-zinc-700">Applies To</label>
                  <select
                    value={dTargetType}
                    onChange={e => setDTargetType(e.target.value)}
                    className="w-full mt-1 px-2.5 py-2 border-2 border-zinc-300 rounded-xl text-xs font-medium"
                  >
                    <option value="subscription">Whole Subscription</option>
                    <option value="product">Specific Product</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-zinc-700">Min Purchase ($)</label>
                  <input
                    type="number"
                    value={dMinSpend}
                    onChange={e => setDMinSpend(e.target.value)}
                    className="w-full mt-1 px-3 py-2 border-2 border-zinc-300 rounded-xl text-xs font-medium"
                  />
                </div>
              </div>

              {dTargetType === 'product' && (
                <div>
                  <label className="text-xs font-bold text-zinc-700">Target Product</label>
                  <select
                    value={dTargetProdId}
                    onChange={e => setDTargetProdId(e.target.value)}
                    className="w-full mt-1 px-2.5 py-2 border-2 border-zinc-300 rounded-xl text-xs font-medium"
                  >
                    <option value="">Select a product...</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setShowDiscountModal(false)}
                  className="px-3 py-2 text-xs font-bold text-zinc-600 hover:bg-zinc-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-tinker-yellow hover:bg-tinker-yellow-hover text-black font-black text-xs rounded-xl border-2 border-tinker-border shadow-neo-sm neo-btn"
                >
                  Save Discount Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE TAX MODAL */}
      {showTaxModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border-2 border-tinker-border rounded-2xl w-full max-w-md p-5 shadow-neo">
            <h2 className="text-lg font-black text-black mb-1">Create Tax Rule</h2>
            <form onSubmit={submitTax} className="space-y-3 mt-3">
              <div>
                <label className="text-xs font-bold text-zinc-700">Tax Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. State Tech Tax"
                  value={tName}
                  onChange={e => setTName(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border-2 border-zinc-300 rounded-xl text-xs font-medium"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-zinc-700">Tax Rate (%)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="12.5"
                  value={tRate}
                  onChange={e => setTRate(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border-2 border-zinc-300 rounded-xl text-xs font-medium"
                />
              </div>
              <label className="flex items-center gap-2 text-xs font-medium text-zinc-700">
                <input
                  type="checkbox"
                  checked={tDefault}
                  onChange={e => setTDefault(e.target.checked)}
                />
                <span>Set as default tax rule for new quotes</span>
              </label>

              <div className="flex justify-end gap-2 pt-3 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setShowTaxModal(false)}
                  className="px-3 py-2 text-xs font-bold text-zinc-600 hover:bg-zinc-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-tinker-yellow text-black font-black text-xs rounded-xl border-2 border-tinker-border shadow-neo-sm neo-btn"
                >
                  Save Tax
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE STAFF MODAL */}
      {showStaffModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border-2 border-tinker-border rounded-2xl w-full max-w-md p-5 shadow-neo">
            <h2 className="text-lg font-black text-black mb-1">Add Staff Member</h2>
            <p className="text-xs text-zinc-500 mb-3">Admin exclusive privilege &bull; Internal team member access</p>

            {staffError && (
              <div className="mb-3 p-2.5 bg-red-50 border border-red-300 rounded-xl text-xs font-bold text-red-600">
                {staffError}
              </div>
            )}

            <form onSubmit={submitStaff} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-zinc-700">Staff Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Jordan Lee"
                  value={sName}
                  onChange={e => setSName(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border-2 border-zinc-300 rounded-xl text-xs font-medium"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-zinc-700">Staff Work Email</label>
                <input
                  type="email"
                  required
                  placeholder="jordan@brightloop.com"
                  value={sEmail}
                  onChange={e => setSEmail(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border-2 border-zinc-300 rounded-xl text-xs font-medium"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-zinc-700">Initial Password</label>
                <input
                  type="password"
                  required
                  placeholder="Must be >8 chars, uppercase, lowercase, special"
                  value={sPassword}
                  onChange={e => setSPassword(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border-2 border-zinc-300 rounded-xl text-xs font-medium"
                />
                <p className="text-[10px] text-zinc-400 mt-0.5">Example: Bright@2026</p>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setShowStaffModal(false)}
                  className="px-3 py-2 text-xs font-bold text-zinc-600 hover:bg-zinc-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-tinker-purple text-white font-black text-xs rounded-xl border-2 border-tinker-border shadow-neo-sm neo-btn"
                >
                  Create Staff Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
