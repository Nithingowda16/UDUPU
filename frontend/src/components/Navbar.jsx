import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Menu, X, Sun, Moon, Sparkles, Shirt, Heart, LayoutDashboard, UserCheck, LogOut, Wand2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const navLinks = [
    { name: 'Catalog', path: '/catalog', icon: Shirt },
    { name: 'Try-On', path: '/tryon', icon: Wand2 },
    { name: 'Smart Recommendations', path: '/recommendations', icon: Sparkles },
  ];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-apple-border-light dark:border-apple-border-dark glassmorphism transition-all duration-300">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        
        <Link to="/" className="flex items-center gap-2 font-semibold text-xl tracking-tight text-apple-text-primary-light dark:text-apple-text-primary-dark hover:scale-[1.02] active:scale-[0.98] transition-all">
          <img src="/logo.png" alt="Udupu Logo" className="h-8 w-auto object-contain apple-logo-blend" />
          <span>Udupu</span>
        </Link>

        {/* Desktop Navigation Links */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.path;
            return (
              <Link 
                key={link.name} 
                to={link.path}
                className={`relative px-1 py-2 text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  isActive 
                    ? 'text-apple-accent' 
                    : 'text-apple-text-secondary-light dark:text-apple-text-secondary-dark hover:text-apple-text-primary-light dark:hover:text-apple-text-primary-dark'
                }`}
              >
                {isActive && (
                  <motion.span 
                    layoutId="activeNavIndicator"
                    className="absolute bottom-0 left-0 right-0 h-[2px] bg-apple-accent"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                <Icon className="h-4 w-4" />
                <span>{link.name}</span>
              </Link>
            );
          })}
        </div>

        {/* Right side controls */}
        <div className="hidden md:flex items-center gap-4">
          {/* Theme Toggle */}
          <button 
            onClick={toggleTheme}
            className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 text-apple-text-secondary-light dark:text-apple-text-secondary-dark transition-colors"
            aria-label="Toggle theme"
          >
            {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
          </button>

          {user ? (
            <div className="flex items-center gap-4">
              {isAdmin && (
                <Link 
                  to="/admin"
                  className="px-4 py-1.5 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-600 dark:text-purple-400 hover:bg-purple-500/20 transition-colors flex items-center gap-1 border border-purple-500/20"
                >
                  <UserCheck className="h-3.5 w-3.5" />
                  <span>Admin Panel</span>
                </Link>
              )}
              <Link 
                to="/dashboard"
                className="px-4 py-1.5 rounded-full text-xs font-semibold bg-apple-accent/10 text-apple-accent hover:bg-apple-accent/20 transition-colors flex items-center gap-1 border border-apple-accent/20"
              >
                <LayoutDashboard className="h-3.5 w-3.5" />
                <span>Dashboard</span>
              </Link>
              <button 
                onClick={handleLogout}
                className="p-2 rounded-full text-red-500 hover:bg-red-550/10 hover:text-red-600 transition-colors"
                title="Log out"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link 
                to="/login"
                className="px-4 py-1.5 text-sm font-medium text-apple-text-secondary-light dark:text-apple-text-secondary-dark hover:text-apple-text-primary-light dark:hover:text-apple-text-primary-dark transition-colors"
              >
                Sign In
              </Link>
              <Link 
                to="/register"
                className="px-4 py-1.5 rounded-full text-sm font-medium bg-apple-accent text-white hover:bg-apple-accent/90 shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Toggle Button */}
        <div className="flex md:hidden items-center gap-2">
          <button 
            onClick={toggleTheme}
            className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 text-apple-text-secondary-light dark:text-apple-text-secondary-dark transition-colors"
          >
            {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
          </button>
          
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-apple-text-secondary-light dark:text-apple-text-secondary-dark hover:text-apple-text-primary-light dark:hover:text-apple-text-primary-dark"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

      </div>

      {/* Mobile Drawer Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-apple-border-light dark:border-apple-border-dark bg-apple-bg-light/95 dark:bg-apple-bg-dark/95 backdrop-blur-lg overflow-hidden"
          >
            <div className="px-6 py-4 flex flex-col gap-4">
              {navLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link 
                    key={link.name} 
                    to={link.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 py-2 text-base font-medium text-apple-text-secondary-light dark:text-apple-text-secondary-dark hover:text-apple-text-primary-light dark:hover:text-apple-text-primary-dark"
                  >
                    <Icon className="h-5 w-5" />
                    <span>{link.name}</span>
                  </Link>
                );
              })}
              
              <hr className="border-apple-border-light dark:border-apple-border-dark my-1" />

              {user ? (
                <div className="flex flex-col gap-3">
                  {isAdmin && (
                    <Link 
                      to="/admin"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 py-2 text-base font-medium text-purple-600 dark:text-purple-400"
                    >
                      <UserCheck className="h-5 w-5" />
                      <span>Admin Control Panel</span>
                    </Link>
                  )}
                  <Link 
                    to="/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 py-2 text-base font-medium text-apple-accent"
                  >
                    <LayoutDashboard className="h-5 w-5" />
                    <span>Dashboard</span>
                  </Link>
                  <button 
                    onClick={() => { setMobileMenuOpen(false); handleLogout(); }}
                    className="flex items-center gap-3 py-2 text-base font-medium text-red-500 text-left"
                  >
                    <LogOut className="h-5 w-5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-3 pt-2">
                  <Link 
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full text-center py-2 text-base font-medium text-apple-text-primary-light dark:text-apple-text-primary-dark border border-apple-border-light dark:border-apple-border-dark rounded-full"
                  >
                    Sign In
                  </Link>
                  <Link 
                    to="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full text-center py-2 text-base font-medium bg-apple-accent text-white rounded-full shadow-md"
                  >
                    Create Account
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
