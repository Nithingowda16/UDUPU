import React from 'react';
import { Link } from 'react-router-dom';
import { Shirt } from 'lucide-react';

export default function Footer() {
  const year = new Date().getFullYear();
  
  return (
    <footer className="w-full bg-apple-bg-light dark:bg-[#09090b] border-t border-apple-border-light dark:border-apple-border-dark py-12 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-8">
        
        {/* Info Column */}
        <div className="flex flex-col gap-4">
          <Link to="/" className="flex items-center gap-2 font-semibold text-lg text-apple-text-primary-light dark:text-apple-text-primary-dark">
            <img src="/logo.png" alt="Udupu Logo" className="h-6 w-auto object-contain apple-logo-blend" />
            <span>Udupu</span>
          </Link>
          <p className="text-sm text-apple-text-secondary-light dark:text-apple-text-secondary-dark leading-relaxed">
            Revolutionizing digital fashion through OpenCV try-on rendering and personalized matching rules.
          </p>
        </div>

        {/* Links Column 1 */}
        <div>
          <h4 className="text-xs font-semibold text-apple-text-primary-light dark:text-apple-text-primary-dark uppercase tracking-wider mb-4">Explore</h4>
          <ul className="flex flex-col gap-2.5 text-sm text-apple-text-secondary-light dark:text-apple-text-secondary-dark">
            <li><Link to="/catalog" className="hover:text-apple-accent transition-colors">Clothing Catalog</Link></li>
            <li><Link to="/tryon" className="hover:text-apple-accent transition-colors">Virtual Fitting Room</Link></li>
            <li><Link to="/recommendations" className="hover:text-apple-accent transition-colors">Smart Styling</Link></li>
          </ul>
        </div>

        {/* Links Column 2 */}
        <div>
          <h4 className="text-xs font-semibold text-apple-text-primary-light dark:text-apple-text-primary-dark uppercase tracking-wider mb-4">Support</h4>
          <ul className="flex flex-col gap-2.5 text-sm text-apple-text-secondary-light dark:text-apple-text-secondary-dark">
            <li><a href="#faq" className="hover:text-apple-accent transition-colors">Frequently Asked Questions</a></li>
            <li><a href="#contact" className="hover:text-apple-accent transition-colors">Contact Service Desk</a></li>
            <li><a href="#security" className="hover:text-apple-accent transition-colors">Security Policy</a></li>
          </ul>
        </div>

        {/* Legal Column */}
        <div>
          <h4 className="text-xs font-semibold text-apple-text-primary-light dark:text-apple-text-primary-dark uppercase tracking-wider mb-4">Legal</h4>
          <ul className="flex flex-col gap-2.5 text-sm text-apple-text-secondary-light dark:text-apple-text-secondary-dark">
            <li><a href="#privacy" className="hover:text-apple-accent transition-colors">Privacy Charter</a></li>
            <li><a href="#terms" className="hover:text-apple-accent transition-colors">Terms & Conditions</a></li>
            <li><a href="#cookies" className="hover:text-apple-accent transition-colors">Cookie Preferences</a></li>
          </ul>
        </div>

      </div>

      <div className="max-w-7xl mx-auto px-6 mt-12 pt-6 border-t border-apple-border-light/60 dark:border-apple-border-dark/60 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-apple-text-secondary-light dark:text-apple-text-secondary-dark">
        <span>&copy; {year} Udupu Inc. All rights reserved.</span>
        <div className="flex gap-6">
          <a href="#privacy" className="hover:underline">Privacy Policy</a>
          <a href="#terms" className="hover:underline">Terms of Use</a>
          <a href="#map" className="hover:underline">Site Map</a>
        </div>
      </div>
    </footer>
  );
}
