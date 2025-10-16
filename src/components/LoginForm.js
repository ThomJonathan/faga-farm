'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function LoginForm() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const raw = searchParams?.get('error') || searchParams?.get('message') || '';
    if (raw) {
      // replace '+' (form-encoded spaces) with space, then decode any percent-encoding
      const normalized = decodeURIComponent(raw.replace(/\+/g, ' '));
      setError(normalized);
    }
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      // changed: handle non-JSON responses safely
      let data = {};
      const ct = response.headers.get('content-type') || '';
      if (ct.includes('application/json')) {
        try {
          data = await response.json();
        } catch (parseErr) {
          data = {};
        }
      }

      if (response.ok) {
        // Redirect based on role
        switch (data.user?.role) {
          case 'admin':
          case 'manager':
            router.push('/manager');
            break;
          case 'sales_person':
            router.push('/sales-person');
            break;
          case 'farm_worker':
            router.push('/farm-worker');
            break;
          default:
            router.push('/');
        }
      } else {
        // Show server message if available, otherwise a clear fallback
        const msg = data?.message || `Login failed${response.status ? ` (${response.status})` : ''}`;
        setError(msg);
      }
    } catch (err) {
      // Network or parse error
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 via-yellow-50 to-white">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-xl shadow-xl p-8 mx-4">
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-md mb-4">
              <img src="/fagaFarm.png" alt="Faga Farm Logo" className="w-14 h-14 rounded-full" />
            </div>

            <h1 className="text-center text-2xl font-extrabold text-red-600 tracking-wider">FAGA POULTRY FARM</h1>
            <p className="text-center text-xs text-gray-500 mt-1">Production Inventory Management System</p>
          </div>

          <form className="mt-6 space-y-5" onSubmit={handleSubmit} action="/api/auth/login" method="post">
            <div>
              <label htmlFor="username" className="sr-only">Username or Email</label>
              <input
                id="username"
                name="username"
                type="text"
                required
                placeholder="Username or Email"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-blue-50 border border-yellow-200 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-200"
              />
            </div>

            <div>
              <label htmlFor="password" className="sr-only">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                required
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-blue-50 border border-yellow-200 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-200"
              />
            </div>

            {error && (
              <div className="text-red-600 text-sm text-center">{error}</div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-md text-white font-semibold bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-700 hover:to-orange-600 shadow-md disabled:opacity-50"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </div>

            <div className="mt-4">
              <div className="flex items-center">
                <div className="flex-grow border-t border-gray-200" />
                <div className="mx-3 text-xs text-gray-300">OR</div>
                <div className="flex-grow border-t border-gray-200" />
              </div>

              <div className="mt-4 text-center space-y-2">
                <a href="/signup" className="block text-sm text-red-500 hover:underline">Create new account</a>
                <a href="/forgot-password" className="block text-sm text-red-400 hover:underline">Forgot your password?</a>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
