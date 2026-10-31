import React, { useState } from 'react';
import { X, Lock, Mail, User, Building, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function AuthModal({ initialMode = 'login', onClose, onLoginSuccess }) {
  const [mode, setMode] = useState(initialMode); // 'login' | 'register' | 'forgot'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Password validation visual feedback
  const hasLength = password.length > 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
  const isPasswordValid = hasLength && hasUpper && hasLower && hasSpecial;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      if (mode === 'login') {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Login failed');
        onLoginSuccess(data.user, data.token);
        onClose();
      } else if (mode === 'register') {
        if (!isPasswordValid) {
          throw new Error('Please fulfill all password requirements before signing up');
        }

        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password, company_name: companyName })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Registration failed');
        onLoginSuccess(data.user, data.token);
        onClose();
      } else if (mode === 'forgot') {
        const res = await fetch('/api/auth/forgot-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email })
        });
        const data = await res.json();
        setSuccess(data.message || 'Reset link dispatched!');
      }
    } catch (err) {
      setError(err.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
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

        <div className="text-center mb-5">
          <div className="w-10 h-10 bg-tinker-yellow border-2 border-black rounded-xl mx-auto flex items-center justify-center text-xl font-black mb-2 shadow-neo-sm">
            ⚡
          </div>
          <h2 className="text-xl font-black text-black">
            {mode === 'login' ? 'Welcome Back!' : mode === 'register' ? 'Join Brightloop' : 'Reset Password'}
          </h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            {mode === 'login'
              ? 'Enter your credentials to access your portal'
              : mode === 'register'
              ? 'Create a unified subscription business account'
              : 'Enter your registered email to receive a reset link'}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-2.5 bg-red-50 border border-red-300 rounded-xl text-xs font-bold text-red-600 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-4 p-2.5 bg-emerald-50 border border-emerald-300 rounded-xl text-xs font-bold text-emerald-700 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          {mode === 'register' && (
            <>
              <div>
                <label className="font-bold text-zinc-700">Full Name</label>
                <div className="relative mt-1">
                  <User className="w-4 h-4 absolute left-3 top-2.5 text-zinc-400" />
                  <input
                    type="text"
                    required
                    placeholder="Jane Doe"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border-2 border-zinc-300 rounded-xl font-medium focus:outline-none focus:border-black"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-zinc-700">Company Name</label>
                <div className="relative mt-1">
                  <Building className="w-4 h-4 absolute left-3 top-2.5 text-zinc-400" />
                  <input
                    type="text"
                    placeholder="Acme Studios Ltd"
                    value={companyName}
                    onChange={e => setCompanyName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border-2 border-zinc-300 rounded-xl font-medium focus:outline-none focus:border-black"
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="font-bold text-zinc-700">Email Address</label>
            <div className="relative mt-1">
              <Mail className="w-4 h-4 absolute left-3 top-2.5 text-zinc-400" />
              <input
                type="email"
                required
                placeholder="name@company.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border-2 border-zinc-300 rounded-xl font-medium focus:outline-none focus:border-black"
              />
            </div>
          </div>

          {mode !== 'forgot' && (
            <div>
              <div className="flex items-center justify-between">
                <label className="font-bold text-zinc-700">Password</label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => { setMode('forgot'); setError(''); }}
                    className="text-[11px] font-bold text-zinc-500 hover:text-black"
                  >
                    Forgot?
                  </button>
                )}
              </div>
              <div className="relative mt-1">
                <Lock className="w-4 h-4 absolute left-3 top-2.5 text-zinc-400" />
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border-2 border-zinc-300 rounded-xl font-medium focus:outline-none focus:border-black"
                />
              </div>

              {/* Password Requirement Checklist (Prompt Rule) */}
              {mode === 'register' && (
                <div className="mt-2.5 p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl space-y-1 text-[11px]">
                  <div className="font-bold text-zinc-600 mb-1">Required Password Rules:</div>
                  <div className={`flex items-center gap-1.5 ${hasLength ? 'text-emerald-600 font-bold' : 'text-zinc-500'}`}>
                    <span>{hasLength ? '✓' : '○'}</span>
                    <span>More than 8 characters ({password.length}/9+)</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${hasUpper ? 'text-emerald-600 font-bold' : 'text-zinc-500'}`}>
                    <span>{hasUpper ? '✓' : '○'}</span>
                    <span>At least one uppercase letter (A-Z)</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${hasLower ? 'text-emerald-600 font-bold' : 'text-zinc-500'}`}>
                    <span>{hasLower ? '✓' : '○'}</span>
                    <span>At least one lowercase letter (a-z)</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${hasSpecial ? 'text-emerald-600 font-bold' : 'text-zinc-500'}`}>
                    <span>{hasSpecial ? '✓' : '○'}</span>
                    <span>At least one special character (!@#$%^&*)</span>
                  </div>
                </div>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || (mode === 'register' && !isPasswordValid)}
            className="w-full mt-2 py-2.5 bg-tinker-yellow hover:bg-tinker-yellow-hover disabled:bg-zinc-200 disabled:text-zinc-400 text-black font-black text-sm rounded-xl border-2 border-tinker-border shadow-neo-sm hover:shadow-neo transition neo-btn"
          >
            {isLoading
              ? 'Processing...'
              : mode === 'login'
              ? 'Log In to Brightloop'
              : mode === 'register'
              ? 'Create Account'
              : 'Dispatch Reset Link'}
          </button>
        </form>

        {/* Switch mode footer */}
        <div className="mt-4 pt-3 border-t border-zinc-200 text-center text-xs text-zinc-500">
          {mode === 'login' ? (
            <>
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => { setMode('register'); setError(''); }}
                className="font-bold text-black hover:underline"
              >
                Sign up
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => { setMode('login'); setError(''); }}
                className="font-bold text-black hover:underline"
              >
                Log in
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
