import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shirt, User, Mail, KeyRound, AlertCircle, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (password !== confirmPassword) {
      return setError('Passwords do not match');
    }
    
    if (password.length < 6) {
      return setError('Password must be at least 6 characters');
    }

    setLoading(true);
    try {
      await register(name, email, password);
      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Error creating account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-6 py-12 transition-colors duration-300">
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-[460px] p-8 rounded-[30px] glassmorphism-premium flex flex-col gap-6"
      >
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="w-fit mx-auto mb-2">
            <img src="/logo.png" alt="Udupu Logo" className="h-12 w-auto object-contain apple-logo-blend" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-apple-text-primary-light dark:text-apple-text-primary-dark">Create account</h2>
          <p className="text-sm text-apple-text-secondary-light dark:text-apple-text-secondary-dark">
            Join Udupu and start your virtual try-on journey
          </p>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm flex items-center gap-2.5">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-4 rounded-2xl bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 text-sm flex items-center gap-2.5">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>Registration successful! Redirecting to login...</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="name" className="text-xs font-semibold uppercase tracking-wider text-apple-text-secondary-light dark:text-apple-text-secondary-dark">Full Name</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-apple-text-secondary-light dark:text-apple-text-secondary-dark">
                <User className="h-4 w-4" />
              </div>
              <input
                type="text"
                id="name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-apple-border-light dark:border-apple-border-dark bg-transparent text-apple-text-primary-light dark:text-apple-text-primary-dark focus:outline-none focus:border-apple-accent focus:ring-1 focus:ring-apple-accent transition-all"
                placeholder="John Doe"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-apple-text-secondary-light dark:text-apple-text-secondary-dark">Email Address</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-apple-text-secondary-light dark:text-apple-text-secondary-dark">
                <Mail className="h-4 w-4" />
              </div>
              <input
                type="email"
                id="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-apple-border-light dark:border-apple-border-dark bg-transparent text-apple-text-primary-light dark:text-apple-text-primary-dark focus:outline-none focus:border-apple-accent focus:ring-1 focus:ring-apple-accent transition-all"
                placeholder="name@example.com"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="pass" className="text-xs font-semibold uppercase tracking-wider text-apple-text-secondary-light dark:text-apple-text-secondary-dark">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-apple-text-secondary-light dark:text-apple-text-secondary-dark">
                <KeyRound className="h-4 w-4" />
              </div>
              <input
                type="password"
                id="pass"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-apple-border-light dark:border-apple-border-dark bg-transparent text-apple-text-primary-light dark:text-apple-text-primary-dark focus:outline-none focus:border-apple-accent focus:ring-1 focus:ring-apple-accent transition-all"
                placeholder="At least 6 characters"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="confirmPass" className="text-xs font-semibold uppercase tracking-wider text-apple-text-secondary-light dark:text-apple-text-secondary-dark">Confirm Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-apple-text-secondary-light dark:text-apple-text-secondary-dark">
                <KeyRound className="h-4 w-4" />
              </div>
              <input
                type="password"
                id="confirmPass"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-apple-border-light dark:border-apple-border-dark bg-transparent text-apple-text-primary-light dark:text-apple-text-primary-dark focus:outline-none focus:border-apple-accent focus:ring-1 focus:ring-apple-accent transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || success}
            className="w-full py-3 mt-2 rounded-full bg-apple-accent text-white font-medium hover:bg-apple-accent/90 shadow-md hover:shadow-lg disabled:opacity-55 disabled:cursor-not-allowed transition-all transform hover:-translate-y-0.5"
          >
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>

        <div className="text-center text-sm text-apple-text-secondary-light dark:text-apple-text-secondary-dark mt-2 border-t border-apple-border-light dark:border-apple-border-dark pt-4">
          Already have an account? <Link to="/login" className="text-apple-accent hover:underline font-medium">Sign In</Link>
        </div>
      </motion.div>
    </div>
  );
}
