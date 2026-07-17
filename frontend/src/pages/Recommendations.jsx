import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Sparkles, ArrowRight, HelpCircle, RefreshCw, Shirt, Sliders, CheckCircle2, ChevronRight, Bookmark, ChevronDown, Ruler } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Skeleton from '../components/Skeleton';

export default function Recommendations() {
  const { user, updateProfile } = useAuth();
  const navigate = useNavigate();

  // Step indicator
  const [step, setStep] = useState(1); // 1 = Form, 2 = Results

  // Questionnaire form states
  const [formData, setFormData] = useState({
    gender: 'Men',
    age: '25',
    body_type: 'Rectangle',
    preferred_style: 'Casual',
    occasion: 'Casual',
    season: 'Summer',
    preferred_colors: [],
    height: '175',
    weight: '70',
    fit_pref: 'Regular'
  });

  const calculateRecommendedSize = (h, w, pref) => {
    const height = parseFloat(h);
    const weight = parseFloat(w);
    if (isNaN(height) || isNaN(weight)) return 'M';
    
    let baseSize = 'M';
    if (height < 160) {
      if (weight < 55) baseSize = 'S';
      else if (weight < 70) baseSize = 'M';
      else baseSize = 'L';
    } else if (height < 178) {
      if (weight < 65) baseSize = 'S';
      else if (weight < 80) baseSize = 'M';
      else if (weight < 95) baseSize = 'L';
      else baseSize = 'XL';
    } else {
      if (weight < 75) baseSize = 'M';
      else if (weight < 90) baseSize = 'L';
      else if (weight < 105) baseSize = 'XL';
      else baseSize = 'XXL';
    }
    
    const sizes = ['S', 'M', 'L', 'XL', 'XXL'];
    let idx = sizes.indexOf(baseSize);
    if (pref === 'Slim' && idx > 0) idx--;
    if (pref === 'Oversized' && idx < sizes.length - 1) idx++;
    return sizes[idx];
  };

  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Pre-populate form details if user logged in has a profile
  useEffect(() => {
    if (user) {
      setFormData({
        gender: user.gender || 'Men',
        age: user.age ? String(user.age) : '25',
        body_type: user.body_type || 'Rectangle',
        preferred_style: user.preferred_style || 'Casual',
        occasion: 'Casual', // Reset search targets
        season: 'Summer',
        preferred_colors: user.preferred_colors || []
      });
      
      // Auto fetch recommendations on load if user profile already has content
      if (user.gender && user.body_type) {
        fetchRecommendations(true);
      }
    }
  }, [user]);

  const bodyTypes = [
    { name: 'Hourglass', desc: 'Balanced shoulders and hips, defined waist.' },
    { name: 'Rectangle', desc: 'Shoulders, waist, and hips are of similar width.' },
    { name: 'Triangle', desc: 'Hips are wider than the shoulders.' },
    { name: 'Inverted Triangle', desc: 'Shoulders are broader than the hips.' },
    { name: 'Oval', desc: 'Soft silhouette with width centered around the torso.' }
  ];

  const colorsList = ['Red', 'Gold', 'Blue', 'Black', 'Green', 'Grey', 'Yellow', 'Amber', 'White'];

  const handleColorToggle = (color) => {
    setFormData(prev => {
      const colors = [...prev.preferred_colors];
      if (colors.includes(color)) {
        return { ...prev, preferred_colors: colors.filter(c => c !== color) };
      } else {
        return { ...prev, preferred_colors: [...colors, color] };
      }
    });
  };

  const fetchRecommendations = async (useProfileDefaults = false) => {
    setLoading(true);
    setErrorMsg('');
    try {
      let res;
      if (user && useProfileDefaults) {
        // GET profile-based recommendation from backend
        res = await axios.get('/api/recommendations');
      } else {
        // POST questionnaire details to custom endpoint
        res = await axios.post('/api/recommendations/custom', {
          ...formData,
          age: parseInt(formData.age) || 25
        });
      }
      setRecommendations(res.data.recommendations);
      setStep(2); // Show results view
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to process recommendations. Please verify backend status.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setSavingProfile(true);
    setSuccessMsg('');
    try {
      await updateProfile({
        gender: formData.gender,
        age: parseInt(formData.age),
        body_type: formData.body_type,
        preferred_colors: formData.preferred_colors,
        preferred_style: formData.preferred_style
      });
      setSuccessMsg('Your fashion style profile has been synchronized successfully.');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      console.error("Error saving style profile:", err);
      setErrorMsg('Failed to update your database profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 flex flex-col gap-8 w-full transition-colors duration-300">
      
      {/* Top Header */}
      <div className="flex justify-between items-center border-b border-apple-border-light dark:border-apple-border-dark pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-apple-text-primary-light dark:text-apple-text-primary-dark">Smart Styling Engine</h1>
          <p className="text-sm text-apple-text-secondary-light dark:text-apple-text-secondary-dark mt-1">
            Outfit recommendations tailored to body structures, weather coordinates, and occasion rules.
          </p>
        </div>
        
        {step === 2 && (
          <button
            onClick={() => setStep(1)}
            className="px-4 py-2 text-xs flex items-center gap-1.5 apple-btn-secondary"
          >
            <Sliders className="h-3.5 w-3.5" /> Adjust Profile
          </button>
        )}
      </div>

      {successMsg && (
        <div className="p-4 rounded-2xl bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 text-sm flex items-center gap-2.5">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm flex items-center gap-2.5">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Workflow container */}
      <div>
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <RefreshCw className="h-10 w-10 text-apple-accent animate-spin" />
            <span className="text-sm text-apple-text-secondary-light dark:text-apple-text-secondary-dark">Consulting coordinate matrices...</span>
          </div>
        ) : step === 1 ? (
          
          /* Questionnaire Step */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Column Form inputs */}
            <div className="lg:col-span-8 p-8 rounded-[30px] bg-white dark:bg-[#1b1b1c] border border-apple-border-light dark:border-apple-border-dark flex flex-col gap-6">
              
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold uppercase tracking-wider text-apple-text-secondary-light dark:text-apple-text-secondary-dark">Fashion Parameters</span>
                {user && (
                  <button 
                    onClick={handleSaveProfile}
                    disabled={savingProfile}
                    className="text-xs font-semibold text-apple-accent hover:underline flex items-center gap-1"
                  >
                    <Bookmark className="h-3.5 w-3.5" /> {savingProfile ? 'Saving...' : 'Sync defaults'}
                  </button>
                )}
              </div>

              {/* Gender & Age */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-apple-text-secondary-light dark:text-apple-text-secondary-dark">Gender Profile</label>
                  <div className="relative w-full">
                    <select
                      value={formData.gender}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                      className="w-full appearance-none pr-10 px-3.5 py-2.5 rounded-xl border border-apple-border-light dark:border-apple-border-dark bg-white/40 dark:bg-black/20 text-apple-text-primary-light dark:text-apple-text-primary-dark focus:outline-none focus:ring-1 focus:ring-apple-accent focus:border-apple-accent text-sm font-medium transition-all"
                    >
                      <option value="Men">Men</option>
                      <option value="Women">Women</option>
                      <option value="Kids">Kids</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-apple-text-secondary-light">
                      <ChevronDown className="h-4 w-4" />
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-apple-text-secondary-light dark:text-apple-text-secondary-dark">Age Target</label>
                  <input
                    type="number"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-apple-border-light dark:border-apple-border-dark bg-transparent text-apple-text-primary-light dark:text-apple-text-primary-dark focus:outline-none text-sm font-medium"
                    min="1"
                    max="120"
                  />
                </div>
              </div>

              {/* Occasion & Season */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-apple-text-secondary-light dark:text-apple-text-secondary-dark">Occasion context</label>
                  <div className="relative w-full">
                    <select
                      value={formData.occasion}
                      onChange={(e) => setFormData({ ...formData, occasion: e.target.value })}
                      className="w-full appearance-none pr-10 px-3.5 py-2.5 rounded-xl border border-apple-border-light dark:border-apple-border-dark bg-white/40 dark:bg-black/20 text-apple-text-primary-light dark:text-apple-text-primary-dark focus:outline-none focus:ring-1 focus:ring-apple-accent focus:border-apple-accent text-sm font-medium transition-all"
                    >
                      <option value="Casual">Casual Rules</option>
                      <option value="Office">Office Rules (Formal focus)</option>
                      <option value="Wedding">Wedding Rules (Luxury focus)</option>
                      <option value="College">College Rules (Streetwear focus)</option>
                      <option value="Festival">Festival Rules (Vibrant focus)</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-apple-text-secondary-light">
                      <ChevronDown className="h-4 w-4" />
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-apple-text-secondary-light dark:text-apple-text-secondary-dark">Season / Weather</label>
                  <div className="relative w-full">
                    <select
                      value={formData.season}
                      onChange={(e) => setFormData({ ...formData, season: e.target.value })}
                      className="w-full appearance-none pr-10 px-3.5 py-2.5 rounded-xl border border-apple-border-light dark:border-apple-border-dark bg-white/40 dark:bg-black/20 text-apple-text-primary-light dark:text-apple-text-primary-dark focus:outline-none focus:ring-1 focus:ring-apple-accent focus:border-apple-accent text-sm font-medium transition-all"
                    >
                      <option value="Summer">Summer (Hot Climate)</option>
                      <option value="Winter">Winter (Cold Climate)</option>
                      <option value="Spring">Spring</option>
                      <option value="Autumn">Autumn</option>
                      <option value="All">All weather</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-apple-text-secondary-light">
                      <ChevronDown className="h-4 w-4" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Preferred Style */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold uppercase tracking-wider text-apple-text-secondary-light dark:text-apple-text-secondary-dark">Preferred Style</label>
                <div className="relative w-full">
                  <select
                    value={formData.preferred_style}
                    onChange={(e) => setFormData({ ...formData, preferred_style: e.target.value })}
                    className="w-full appearance-none pr-10 px-3.5 py-2.5 rounded-xl border border-apple-border-light dark:border-apple-border-dark bg-white/40 dark:bg-black/20 text-apple-text-primary-light dark:text-apple-text-primary-dark focus:outline-none focus:ring-1 focus:ring-apple-accent focus:border-apple-accent text-sm font-medium transition-all"
                  >
                    <option value="Casual">Casual wear</option>
                    <option value="Formal">Formal Suitings</option>
                    <option value="Sporty">Sportswear</option>
                    <option value="Chic">Modern Chic</option>
                    <option value="Vintage">Traditional/Vintage</option>
                    <option value="Streetwear">Streetwear</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-apple-text-secondary-light">
                    <ChevronDown className="h-4 w-4" />
                  </div>
                </div>
              </div>

              {/* Color Preferences */}
              <div className="flex flex-col gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-apple-text-secondary-light dark:text-apple-text-secondary-dark">Favorite Colors</span>
                <div className="flex flex-wrap gap-2 pt-1">
                  {colorsList.map(c => {
                    const selected = formData.preferred_colors.includes(c);
                    return (
                      <button
                        key={c}
                        type="button"
                        onClick={() => handleColorToggle(c)}
                        className={`px-4 py-1.5 rounded-full text-xs font-medium border transition-all active:scale-95 ${
                          selected 
                            ? 'bg-apple-accent border-apple-accent text-white shadow-md' 
                            : 'border-apple-border-light dark:border-apple-border-dark text-apple-text-secondary-light dark:text-apple-text-secondary-dark hover:border-apple-accent'
                        }`}
                      >
                        {c}
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                onClick={() => fetchRecommendations(false)}
                className="w-full mt-4 py-3.5 text-sm flex items-center justify-center gap-2 apple-btn-primary"
              >
                <span>Calculate Recommendations</span>
                <ChevronRight className="h-4 w-4" />
              </button>

            </div>

            {/* Right Column Body Type cards */}
            <div className="lg:col-span-4 flex flex-col gap-5">
              <span className="text-xs font-bold uppercase tracking-wider text-apple-text-secondary-light dark:text-apple-text-secondary-dark">Body Type Silhouettes</span>
              
              <div className="flex flex-col gap-3">
                {bodyTypes.map((body) => {
                  const selected = formData.body_type === body.name;
                  return (
                    <div 
                      key={body.name}
                      onClick={() => setFormData({ ...formData, body_type: body.name })}
                      className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                        selected 
                          ? 'border-apple-accent bg-apple-accent/5 dark:bg-apple-accent/10 shadow' 
                          : 'border-apple-border-light dark:border-apple-border-dark bg-white dark:bg-[#1b1b1c] hover:border-apple-accent/50'
                      }`}
                    >
                      <h4 className="font-semibold text-sm text-apple-text-primary-light dark:text-apple-text-primary-dark">{body.name}</h4>
                      <p className="text-xs text-apple-text-secondary-light dark:text-apple-text-secondary-dark leading-normal mt-1">{body.desc}</p>
                    </div>
                  );
                })}
              </div>

              {/* Smart Size & Fit Calculator */}
              <span className="text-xs font-bold uppercase tracking-wider text-apple-text-secondary-light dark:text-apple-text-secondary-dark mt-4 flex items-center gap-1.5">
                <Ruler className="h-4 w-4 text-apple-accent" /> Smart Size Calculator
              </span>
              
              <div className="p-6 rounded-2xl bg-white dark:bg-[#1b1b1c] border border-apple-border-light dark:border-apple-border-dark flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-apple-text-secondary-light dark:text-apple-text-secondary-dark">Height (cm)</label>
                    <input 
                      type="number"
                      value={formData.height}
                      onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-apple-border-light dark:border-apple-border-dark bg-transparent text-apple-text-primary-light dark:text-apple-text-primary-dark text-xs font-medium focus:outline-none focus:ring-1 focus:ring-apple-accent"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-apple-text-secondary-light dark:text-apple-text-secondary-dark">Weight (kg)</label>
                    <input 
                      type="number"
                      value={formData.weight}
                      onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-apple-border-light dark:border-apple-border-dark bg-transparent text-apple-text-primary-light dark:text-apple-text-primary-dark text-xs font-medium focus:outline-none focus:ring-1 focus:ring-apple-accent"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-apple-text-secondary-light dark:text-apple-text-secondary-dark">Fit Preference</label>
                  <div className="relative w-full">
                    <select
                      value={formData.fit_pref}
                      onChange={(e) => setFormData({ ...formData, fit_pref: e.target.value })}
                      className="w-full appearance-none pr-10 px-3.5 py-2 rounded-xl border border-apple-border-light dark:border-apple-border-dark bg-white/40 dark:bg-black/20 text-apple-text-primary-light dark:text-apple-text-primary-dark focus:outline-none text-xs font-medium"
                    >
                      <option value="Slim">Slim Fit</option>
                      <option value="Regular">Regular Fit</option>
                      <option value="Oversized">Oversized Fit</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-apple-text-secondary-light">
                      <ChevronDown className="h-3.5 w-3.5" />
                    </div>
                  </div>
                </div>

                {/* Sizing result badge */}
                <div className="p-3.5 rounded-xl bg-gradient-to-r from-blue-500/10 to-sky-500/10 border border-blue-500/20 text-center flex flex-col gap-1">
                  <span className="text-[9px] font-bold uppercase text-blue-600 dark:text-blue-400 tracking-wider">Calculated size Recommendation</span>
                  <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
                    Size {calculateRecommendedSize(formData.height, formData.weight, formData.fit_pref)}
                  </span>
                </div>
              </div>
            </div>

          </div>
        ) : (
          
          /* Results Step */
          <div className="flex flex-col gap-8">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold uppercase tracking-widest text-green-500 flex items-center gap-1">
                <Sparkles className="h-4 w-4 fill-green-500" /> TOP STYLING RESULTS
              </span>
              <span className="text-xs text-apple-text-secondary-light dark:text-apple-text-secondary-dark">
                Ruleset context: {formData.occasion} & {formData.season}
              </span>
            </div>

            {recommendations.length === 0 ? (
              <div className="text-center py-20 bg-white dark:bg-[#151516] border border-apple-border-light dark:border-apple-border-dark rounded-[30px] flex flex-col items-center gap-3">
                <Shirt className="h-12 w-12 text-apple-accent/35" />
                <h3 className="text-lg font-bold text-apple-text-primary-light dark:text-apple-text-primary-dark">No recommendations matched</h3>
                <p className="text-sm text-apple-text-secondary-light dark:text-apple-text-secondary-dark max-w-xs leading-relaxed">
                  Our algorithm couldn't find items matching these occasion constraints. Try broadening your parameters.
                </p>
                <button 
                  onClick={() => setStep(1)}
                  className="mt-2 px-6 py-2.5 rounded-full text-xs font-medium bg-apple-accent text-white"
                >
                  Adjust Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-fade-in">
                {recommendations.map((prod) => (
                  <div
                    key={prod.id}
                    className="group flex flex-col justify-between rounded-[24px] bg-white dark:bg-[#1b1b1c] border border-apple-border-light dark:border-apple-border-dark overflow-hidden hover:shadow-premium-hover hover:border-apple-accent/20 transition-all duration-300"
                  >
                    <div className="relative aspect-[4/5] bg-apple-bg-light dark:bg-black/20 overflow-hidden flex items-center justify-center">
                      <img
                        src={window.getMediaUrl(prod.image_url)}
                        alt={prod.name}
                        className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
                      />
                      
                      <span className="absolute top-4 left-4 px-2.5 py-0.5 rounded-full text-[9px] font-semibold bg-white/80 dark:bg-black/80 text-apple-text-primary-light dark:text-apple-text-primary-dark border border-white/20 backdrop-blur">
                        {prod.style}
                      </span>
                    </div>

                    <div className="p-4 flex flex-col gap-3">
                      <div className="flex flex-col gap-0.5">
                        <div className="flex justify-between items-start gap-1">
                          <h4 className="font-semibold text-sm text-apple-text-primary-light dark:text-apple-text-primary-dark line-clamp-2">
                            {prod.name}
                          </h4>
                          {prod.gender.toLowerCase() !== 'accessories' && (
                            <span className="text-[9px] bg-blue-500/10 dark:bg-blue-400/10 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded font-bold shrink-0">
                              Size {calculateRecommendedSize(formData.height, formData.weight, formData.fit_pref)}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-apple-text-secondary-light dark:text-apple-text-secondary-dark line-clamp-1">
                          {prod.description}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center pt-2 border-t border-apple-border-light/40 dark:border-apple-border-dark/40 text-xs">
                        <span className="font-bold text-apple-text-primary-light dark:text-apple-text-primary-dark">
                          ₹{prod.price.toFixed(2)}
                        </span>
                        
                        <button
                          onClick={() => navigate(`/tryon?product_id=${prod.id}`)}
                          className="px-3 py-1 rounded-full bg-apple-accent text-white font-semibold hover:bg-apple-accent/90 shadow transition-colors flex items-center gap-0.5"
                        >
                          <Sparkles className="h-2.5 w-2.5" /> Try On
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
}
