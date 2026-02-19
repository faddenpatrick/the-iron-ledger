import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const LoginPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await login({ email, password });
      } else {
        await register({ email, password });
      }
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[radial-gradient(ellipse_at_top,_#1f2937_0%,_#111827_60%,_#0a0f1a_100%)]">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-5">
            <img
              src="/assets/logo.png"
              alt="The Iron Ledger"
              className="h-32 w-32 object-contain animate-fade-in drop-shadow-[0_0_24px_rgba(201,169,97,0.25)]"
            />
          </div>
          <h1 className="text-5xl font-bold font-display tracking-wide text-gradient-gold mb-2">
            The Iron Ledger
          </h1>
          <div className="flex items-center justify-center gap-3 my-3">
            <span className="h-px flex-1 bg-gradient-to-r from-transparent to-brand-gold/40" />
            <p className="text-brand-gold font-display font-semibold tracking-widest uppercase text-xs">
              Balance Your Fitness Journey
            </p>
            <span className="h-px flex-1 bg-gradient-to-l from-transparent to-brand-gold/40" />
          </div>
          <p className="text-gray-500 text-sm tracking-wide">
            Track strength. Monitor nutrition. Build consistency.
          </p>
        </div>

        <div className="card card-brand">
          <div className="flex gap-2 mb-6">
            <button
              type="button"
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2 rounded-lg font-display font-semibold tracking-wide transition-all duration-150 active:scale-95 ${
                isLogin
                  ? 'bg-primary-600 text-white shadow-md shadow-primary-900/40'
                  : 'bg-gray-700/60 text-gray-400 border border-gray-600/50'
              }`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2 rounded-lg font-display font-semibold tracking-wide transition-all duration-150 active:scale-95 ${
                !isLogin
                  ? 'bg-primary-600 text-white shadow-md shadow-primary-900/40'
                  : 'bg-gray-700/60 text-gray-400 border border-gray-600/50'
              }`}
            >
              Register
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                placeholder="your@email.com"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input"
                placeholder="••••••••"
                required
                minLength={8}
              />
            </div>

            {error && (
              <div className="text-red-500 text-sm">{error}</div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full btn btn-primary"
            >
              {loading ? 'Loading...' : isLogin ? 'Login' : 'Register'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
