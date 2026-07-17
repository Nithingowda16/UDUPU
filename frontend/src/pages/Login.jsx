import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { KeyRound, Mail, AlertCircle, Smartphone, Lock, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

export default function Login() {
  const { login, loginWithOtp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // View states
  const [loginMode, setLoginMode] = useState('email'); // 'email' or 'phone'
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Email form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Phone form fields
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [simulatedOtp, setSimulatedOtp] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [showIsland, setShowIsland] = useState(false);

  // CAPTCHA security states
  const [captchaCode, setCaptchaCode] = useState('');
  const [captchaInput, setCaptchaInput] = useState('');

  const redirectPath = location.state?.from?.pathname || '/catalog';

  // Generate random 5-character CAPTCHA
  const generateCaptcha = () => {
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz';
    let code = '';
    for (let i = 0; i < 5; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCaptchaCode(code);
    setCaptchaInput('');
  };

  // Re-generate captcha when switching to phone login mode
  useEffect(() => {
    if (loginMode === 'phone') {
      generateCaptcha();
    }
  }, [loginMode]);

  // Resend Timer Effect
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate(redirectPath, { replace: true });
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!phoneNumber) return;
    
    // Captcha Validation check
    if (captchaInput.trim().toLowerCase() !== captchaCode.toLowerCase()) {
      setError('Incorrect CAPTCHA security code. Please try again.');
      generateCaptcha();
      return;
    }

    setError('');
    setLoading(true);
    setShowIsland(false);

    try {
      const res = await axios.post('/api/auth/otp/send', { phone_number: phoneNumber });
      setOtpSent(true);
      setSimulatedOtp(res.data.simulation_otp);
      setResendCooldown(30);
      setOtpCode('');
      
      // Trigger Dynamic Island pop-up simulation
      setTimeout(() => {
        setShowIsland(true);
      }, 400);

      // Auto-hide Dynamic Island after 8 seconds
      setTimeout(() => {
        setShowIsland(false);
      }, 8500);

    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Could not send verification code. Please check the number.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otpCode) return;
    setError('');
    setLoading(true);

    try {
      await loginWithOtp(phoneNumber, otpCode);
      setShowIsland(false);
      navigate(redirectPath, { replace: true });
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Invalid or expired code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-6 py-12 transition-colors duration-300 relative">
      
      {/* Apple Dynamic Island Notification Pop-up */}
      <AnimatePresence>
        {showIsland && (
          <motion.div
            initial={{ y: -100, x: '-50%', scale: 0.85, opacity: 0 }}
            animate={{ 
              y: 0, 
              x: '-50%',
              scale: 1, 
              opacity: 1,
              transition: { type: 'spring', stiffness: 350, damping: 22 }
            }}
            exit={{ 
              y: -100, 
              scale: 0.85, 
              opacity: 0,
              transition: { duration: 0.25 }
            }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-[#09090b] text-white rounded-[24px] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] border border-neutral-800/80 px-5 py-3.5 flex items-center justify-between gap-4 w-[90%] max-w-[380px]"
          >
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-[#1c1c1e] flex items-center justify-center text-green-500 border border-neutral-800 shrink-0">
                <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
                  <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 9h12v2H6V9zm8 5H6v-2h8v2zm4-6H6V6h12v2z"/>
                </svg>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[9px] text-green-400 font-extrabold uppercase tracking-widest">Messages</span>
                <span className="text-xs font-semibold text-neutral-300">Udupu Auth Dispatch</span>
                <span className="text-xs font-bold text-white tracking-wide mt-0.5">Your code is: {simulatedOtp}</span>
              </div>
            </div>
            
            <button
              type="button"
              onClick={() => {
                setOtpCode(simulatedOtp);
                setShowIsland(false);
              }}
              className="px-3.5 py-1.5 text-[9px] font-extrabold bg-apple-accent text-white rounded-full hover:bg-apple-accent/90 transition-all border-0 cursor-pointer active:scale-95 shrink-0 uppercase tracking-widest"
            >
              Auto-fill
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-[440px] p-8 rounded-[30px] glassmorphism-premium flex flex-col gap-6"
      >
        {/* Header Branding */}
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="w-fit mx-auto mb-2">
            <img src="/logo.png" alt="Udupu Logo" className="h-12 w-auto object-contain apple-logo-blend" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-apple-text-primary-light dark:text-apple-text-primary-dark">Welcome back</h2>
          <p className="text-sm text-apple-text-secondary-light dark:text-apple-text-secondary-dark">
            Access your custom virtual fashion studio wardrobe
          </p>
        </div>

        {/* Toggle Mode Tabs (iOS Segmented Control design style) */}
        <div className="flex bg-neutral-100 dark:bg-black/30 p-1.5 rounded-2xl border border-apple-border-light dark:border-apple-border-dark">
          <button
            type="button"
            onClick={() => {
              setLoginMode('email');
              setError('');
            }}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all border-0 cursor-pointer ${
              loginMode === 'email'
                ? 'bg-white dark:bg-[#2c2c2e] text-apple-text-primary-light dark:text-apple-text-primary-dark shadow-sm'
                : 'bg-transparent text-apple-text-secondary-light hover:text-apple-text-primary-light'
            }`}
          >
            Email Login
          </button>
          <button
            type="button"
            onClick={() => {
              setLoginMode('phone');
              setError('');
            }}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all border-0 cursor-pointer ${
              loginMode === 'phone'
                ? 'bg-white dark:bg-[#2c2c2e] text-apple-text-primary-light dark:text-apple-text-primary-dark shadow-sm'
                : 'bg-transparent text-apple-text-secondary-light hover:text-apple-text-primary-light'
            }`}
          >
            Phone OTP
          </button>
        </div>

        {/* Error Feedback */}
        {error && (
          <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm flex items-center gap-2.5">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Conditional forms based on tabs mode */}
        {loginMode === 'email' ? (
          <form onSubmit={handleEmailSubmit} className="flex flex-col gap-5">
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
              <div className="flex justify-between items-center">
                <label htmlFor="pass" className="text-xs font-semibold uppercase tracking-wider text-apple-text-secondary-light dark:text-apple-text-secondary-dark">Password</label>
                <Link to="/forgot-password" className="text-xs text-apple-accent hover:underline">Forgot password?</Link>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-apple-text-secondary-light dark:text-apple-text-secondary-dark">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type="password"
                  id="pass"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-apple-border-light dark:border-apple-border-dark bg-transparent text-apple-text-primary-light dark:text-apple-text-primary-dark focus:outline-none focus:border-apple-accent focus:ring-1 focus:ring-apple-accent transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 mt-2 rounded-full bg-apple-accent text-white font-medium hover:bg-apple-accent/90 shadow-md hover:shadow-lg disabled:opacity-55 disabled:cursor-not-allowed transition-all transform hover:-translate-y-0.5 border-0 cursor-pointer"
            >
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>
        ) : (
          <form onSubmit={otpSent ? handleVerifyOtp : handleSendOtp} className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="phone" className="text-xs font-semibold uppercase tracking-wider text-apple-text-secondary-light dark:text-apple-text-secondary-dark">Phone Number</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-apple-text-secondary-light dark:text-apple-text-secondary-dark">
                  <Smartphone className="h-4 w-4" />
                </div>
                <input
                  type="tel"
                  id="phone"
                  required
                  disabled={otpSent}
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-apple-border-light dark:border-apple-border-dark bg-transparent text-apple-text-primary-light dark:text-apple-text-primary-dark focus:outline-none focus:border-apple-accent focus:ring-1 focus:ring-apple-accent transition-all disabled:opacity-60"
                  placeholder="+91 98765 43210"
                />
              </div>
            </div>

            {/* Captcha Section */}
            {!otpSent && (
              <div className="flex flex-col gap-2.5 p-4 rounded-2xl bg-neutral-100/50 dark:bg-black/20 border border-apple-border-light dark:border-apple-border-dark animate-fade-in">
                <span className="text-[10px] font-bold uppercase tracking-wider text-apple-text-secondary-light flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5 text-apple-accent" /> Security Verification
                </span>
                
                <div className="flex items-center gap-3">
                  {/* Stylized Security Captcha box */}
                  <div className="relative select-none overflow-hidden h-10 px-5 rounded-xl flex items-center justify-center bg-gradient-to-r from-purple-500/15 to-indigo-500/15 border border-indigo-500/30 font-mono text-base font-extrabold tracking-[0.3em] text-indigo-600 dark:text-indigo-400">
                    <span className="relative z-10 italic select-none pointer-events-none">{captchaCode}</span>
                    <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #4f46e5 1px, transparent 1px)', backgroundSize: '6px 6px' }} />
                    <div className="absolute top-2 left-0 right-0 h-[1.5px] bg-indigo-500/25 transform rotate-[5deg] pointer-events-none" />
                    <div className="absolute top-6 left-0 right-0 h-[1.5px] bg-purple-500/25 transform -rotate-[4deg] pointer-events-none" />
                  </div>

                  <button
                    type="button"
                    onClick={generateCaptcha}
                    className="text-xs font-semibold text-apple-accent hover:underline bg-transparent border-0 cursor-pointer p-1"
                  >
                    Refresh
                  </button>
                </div>

                <input
                  type="text"
                  required
                  value={captchaInput}
                  onChange={(e) => setCaptchaInput(e.target.value)}
                  placeholder="Enter security code above"
                  className="w-full px-3 py-2.5 rounded-xl border border-apple-border-light dark:border-apple-border-dark bg-transparent text-apple-text-primary-light dark:text-apple-text-primary-dark focus:outline-none focus:border-apple-accent focus:ring-1 focus:ring-apple-accent text-xs font-semibold"
                />
              </div>
            )}

            {/* OTP Entry */}
            {otpSent && (
              <div className="flex flex-col gap-1.5 animate-fade-in">
                <label htmlFor="otp" className="text-xs font-semibold uppercase tracking-wider text-apple-text-secondary-light dark:text-apple-text-secondary-dark">Verification Code (OTP)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-apple-text-secondary-light dark:text-apple-text-secondary-dark">
                    <KeyRound className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    id="otp"
                    required
                    maxLength="6"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-apple-border-light dark:border-apple-border-dark bg-transparent text-apple-text-primary-light dark:text-apple-text-primary-dark focus:outline-none focus:border-apple-accent focus:ring-1 focus:ring-apple-accent transition-all text-center font-mono tracking-wider font-semibold"
                    placeholder="000000"
                  />
                </div>
              </div>
            )}

            {/* Controls */}
            {otpSent ? (
              <div className="flex flex-col gap-3.5">
                <button
                  type="submit"
                  disabled={loading || !otpCode}
                  className="w-full py-3 rounded-full bg-apple-accent text-white font-medium hover:bg-apple-accent/90 shadow-md hover:shadow-lg disabled:opacity-55 disabled:cursor-not-allowed transition-all transform hover:-translate-y-0.5 border-0 cursor-pointer"
                >
                  {loading ? 'Verifying...' : 'Verify & Login'}
                </button>
                <div className="flex justify-between items-center text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setOtpSent(false);
                      setOtpCode('');
                      setSimulatedOtp('');
                      setShowIsland(false);
                      generateCaptcha();
                    }}
                    className="text-apple-text-secondary-light hover:underline font-semibold bg-transparent border-0 cursor-pointer p-0"
                  >
                    Change phone number
                  </button>
                  {resendCooldown > 0 ? (
                    <span className="text-apple-text-secondary-light">Resend in {resendCooldown}s</span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      className="text-apple-accent hover:underline font-semibold bg-transparent border-0 cursor-pointer p-0"
                    >
                      Resend Code
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <button
                onClick={handleSendOtp}
                type="button"
                disabled={loading || !phoneNumber || !captchaInput}
                className="w-full py-3 mt-2 rounded-full bg-apple-accent text-white font-medium hover:bg-apple-accent/90 shadow-md hover:shadow-lg disabled:opacity-55 disabled:cursor-not-allowed transition-all transform hover:-translate-y-0.5 border-0 cursor-pointer"
              >
                {loading ? 'Sending Code...' : 'Send Verification Code'}
              </button>
            )}
          </form>
        )}

        {/* Footer Actions */}
        <div className="text-center text-sm text-apple-text-secondary-light dark:text-apple-text-secondary-dark mt-2 border-t border-apple-border-light dark:border-apple-border-dark pt-4">
          Don't have an account? <Link to="/register" className="text-apple-accent hover:underline font-medium">Create one now</Link>
        </div>
      </motion.div>
    </div>
  );
}
