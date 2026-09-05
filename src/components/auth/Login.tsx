import React, { FormEvent, useState } from 'react';

interface LoginProps {
  onLogin: (user: { email: string; name: string }) => void;
}

export function Login({ onLogin }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');

    if (!email.trim() || !password) {
      setError('Please enter your email and password.');
      return;
    }

    setLoading(true);
    try {
      // Keep the existing hackathon/demo credentials working locally.
      // This prevents the application shell from being accessible before login.
      if (email.trim().toLowerCase() === 'admin@aiteacher.com' && password === '123456') {
        onLogin({ email: email.trim().toLowerCase(), name: 'AI Teacher Admin' });
        return;
      }

      // If an authentication API is available, use it as well.
      try {
        const response = await fetch('http://127.0.0.1:8000/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email.trim(), password }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data?.token || data?.success) {
            localStorage.setItem('edumind_token', data.token || 'authenticated');
            onLogin(data.user || { email: email.trim(), name: email.split('@')[0] });
            return;
          }
        }
      } catch {
        // Local credentials remain available when the auth API is not configured.
      }

      setError('Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-200">
            <span className="text-2xl font-black">E</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900">Welcome to EduMind</h1>
          <p className="mt-2 text-sm text-slate-500">Sign in to continue to your AI Teacher</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-3xl shadow-xl p-7 sm:p-8 space-y-5">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              autoComplete="email"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                autoComplete="current-password"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 pr-20 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-indigo-600">
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          {error && (
            <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-bold py-3.5 transition shadow-lg shadow-indigo-100"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>

          <div className="pt-2 text-center text-xs text-slate-400">
            AI-powered personalized learning
          </div>
        </form>
      </div>
    </div>
  );
}

export default Login;
