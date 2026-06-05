import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Sparkles, LogIn, ArrowRight } from 'lucide-react';

const Login = () => {
  const { login, register, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [isRegistering, setIsRegistering] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegistering) {
        await register(name, email, password);
      } else {
        await login(email, password);
      }
      navigate('/');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Authentication failed. Please check inputs.');
    } finally {
      setLoading(false);
    }
  };

  // Simulate Google Sign-In
  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      // Pick a random mockup identity to sign in
      const mockProfiles = [
        { email: 'alex.jones@gmail.com', name: 'Alex Jones', googleId: 'g_1234567890', profilePic: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80' },
        { email: 'priya.sharma@gmail.com', name: 'Priya Sharma', googleId: 'g_0987654321', profilePic: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&h=150&q=80' },
        { email: 'admin.tracker@finvibe.com', name: 'System Admin', googleId: 'g_admin_999', profilePic: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=150&h=150&q=80' }
      ];
      
      // Rotate profiles or let user choose (we just pick the first standard user)
      const profile = mockProfiles[0];
      await loginWithGoogle(profile);
      navigate('/');
    } catch (err) {
      console.error(err);
      setError('Google Sign-In simulation failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleAdminGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      const profile = { 
        email: 'admin.tracker@finvibe.com', 
        name: 'System Admin', 
        googleId: 'g_admin_999', 
        profilePic: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=150&h=150&q=80' 
      };
      await loginWithGoogle(profile);
      navigate('/');
    } catch (err) {
      console.error(err);
      setError('Admin Sign-In simulation failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md glass-panel p-8 shadow-2xl relative overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute -top-24 -left-24 w-48 h-48 rounded-full bg-brand-primary/10 blur-3xl" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 rounded-full bg-brand-secondary/10 blur-3xl" />

        {/* Branding header */}
        <div className="text-center mb-8">
          <div className="inline-flex w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-primary to-brand-secondary items-center justify-center text-white font-bold text-2xl shadow-lg shadow-brand-primary/30 mb-3">
            FV
          </div>
          <h2 className="text-2xl font-bold text-white tracking-wide">Welcome to FinVibe</h2>
          <p className="text-xs text-dark-muted mt-1">Smart AI-powered wealth and budgeting manager</p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-dark-border/60 mb-6">
          <button
            onClick={() => { setIsRegistering(false); setError(''); }}
            className={`flex-1 pb-3 text-sm font-medium transition-colors border-b-2 cursor-pointer ${
              !isRegistering ? 'border-brand-primary text-white' : 'border-transparent text-dark-muted hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => { setIsRegistering(true); setError(''); }}
            className={`flex-1 pb-3 text-sm font-medium transition-colors border-b-2 cursor-pointer ${
              isRegistering ? 'border-brand-primary text-white' : 'border-transparent text-dark-muted hover:text-white'
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* Alert box */}
        {error && (
          <div className="mb-4 p-3 bg-brand-danger/10 border border-brand-danger/30 text-brand-danger text-xs rounded-xl text-left">
            {error}
          </div>
        )}

        {/* Form fields */}
        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          {isRegistering && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-dark-muted">Full Name</label>
              <div className="relative flex items-center">
                <User size={16} className="absolute left-4 text-dark-muted" />
                <input
                  type="text"
                  required
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full glass-input pl-11"
                />
              </div>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-dark-muted">Email Address</label>
            <div className="relative flex items-center">
              <Mail size={16} className="absolute left-4 text-dark-muted" />
              <input
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full glass-input pl-11"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-dark-muted">Password</label>
            <div className="relative flex items-center">
              <Lock size={16} className="absolute left-4 text-dark-muted" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full glass-input pl-11"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full glass-btn-primary mt-6 text-sm font-semibold py-3 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? 'Processing...' : isRegistering ? 'Create Account' : 'Sign In'}
            <ArrowRight size={16} />
          </button>
        </form>

        <div className="relative my-6 text-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-dark-border/40" />
          </div>
          <span className="relative px-3 text-[10px] text-dark-muted bg-[#121624] font-medium uppercase tracking-wider">
            Quick Connect & Testing
          </span>
        </div>

        {/* Demo login buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="glass-btn-secondary text-xs flex items-center justify-center gap-2 py-2.5 cursor-pointer hover:bg-dark-border/50 text-white disabled:opacity-50"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            Google User Login
          </button>
          <button
            onClick={handleAdminGoogleSignIn}
            disabled={loading}
            className="glass-btn-secondary border-brand-accent/25 text-brand-accent flex items-center justify-center gap-2 py-2.5 cursor-pointer hover:bg-brand-accent/10 disabled:opacity-50 text-xs font-semibold"
          >
            <Sparkles size={14} className="text-brand-accent animate-pulse" />
            Quick Admin Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
