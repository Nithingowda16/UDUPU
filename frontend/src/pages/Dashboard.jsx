import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Heart, Sparkles, Trash2, Download, User, LayoutDashboard, Clock, History, AlertCircle, FolderHeart } from 'lucide-react';
import { motion } from 'framer-motion';
import Skeleton from '../components/Skeleton';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Tab views
  const [activeTab, setActiveTab] = useState('tryons'); // tryons, favorites, wardrobe

  // Data states
  const [tryonHistory, setTryonHistory] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [savedLooks, setSavedLooks] = useState([]);
  
  useEffect(() => {
    const looks = JSON.parse(localStorage.getItem('udupu_saved_looks') || '[]');
    setSavedLooks(looks);
  }, []);

  const handleDeleteSavedLook = (id) => {
    const updated = savedLooks.filter(l => l.id !== id);
    setSavedLooks(updated);
    localStorage.setItem('udupu_saved_looks', JSON.stringify(updated));
  };

  const [loadingHistory, setLoadingHistory] = useState(true);
  const [loadingWishlist, setLoadingWishlist] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Load User Tryons history
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await axios.get('/api/tryon/history');
        setTryonHistory(res.data);
      } catch (err) {
        console.error("Error fetching try-on logs:", err);
        setErrorMsg('Failed to load try-on history from server.');
      } finally {
        setLoadingHistory(false);
      }
    };
    if (user) fetchHistory();
  }, [user]);

  // Load User Wishlist
  useEffect(() => {
    const fetchWishlist = async () => {
      try {
        const res = await axios.get('/api/wishlist');
        setWishlist(res.data);
      } catch (err) {
        console.error("Error fetching wishlist logs:", err);
      } finally {
        setLoadingWishlist(false);
      }
    };
    if (user) fetchWishlist();
  }, [user]);

  const handleDeleteHistory = async (id) => {
    try {
      await axios.delete(`/api/tryon/history/${id}`);
      setTryonHistory(prev => prev.filter(h => h.id !== id));
    } catch (err) {
      console.error("Error deleting log:", err);
    }
  };

  const handleRemoveWishlist = async (productId) => {
    try {
      await axios.delete(`/api/wishlist/${productId}`);
      setWishlist(prev => prev.filter(item => item.product_id !== productId));
    } catch (err) {
      console.error("Error removing favorite:", err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 flex flex-col gap-10 w-full transition-colors duration-300">
      
      {/* Welcome Banner */}
      <div className="p-8 rounded-[32px] bg-white dark:bg-[#1b1b1c] border border-apple-border-light dark:border-apple-border-dark flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-premium transition-all duration-300">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-apple-accent/10 dark:bg-apple-accent/20 flex items-center justify-center text-apple-accent shrink-0">
            <User className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-apple-text-primary-light dark:text-apple-text-primary-dark">
              Hello, {user?.name || 'User'}
            </h1>
            <p className="text-sm text-apple-text-secondary-light dark:text-apple-text-secondary-dark mt-0.5">
              Personalized wardrobe vault. Account Email: {user?.email}
            </p>
          </div>
        </div>
        
        <button
          onClick={logout}
          className="px-6 py-2 rounded-full border border-red-500/20 text-red-500 hover:bg-red-500/10 text-xs font-semibold transition-colors"
        >
          Sign Out Account
        </button>
      </div>

      {/* Grid: Left side Profile detail, Right side Listings */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: Profile style values */}
        <div className="lg:col-span-4 p-6 rounded-[24px] bg-white dark:bg-[#1b1b1c] border border-apple-border-light dark:border-apple-border-dark flex flex-col gap-5 shadow-premium">
          <h3 className="font-bold text-sm text-apple-text-primary-light dark:text-apple-text-primary-dark uppercase tracking-wider">
            Fashion Attributes
          </h3>
          
          <hr className="border-apple-border-light dark:border-apple-border-dark" />
          
          <div className="flex flex-col gap-4 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-apple-text-secondary-light dark:text-apple-text-secondary-dark">Gender:</span>
              <span className="font-semibold text-apple-text-primary-light dark:text-apple-text-primary-dark">{user?.gender || 'Not set'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-apple-text-secondary-light dark:text-apple-text-secondary-dark">Body Silhouette:</span>
              <span className="font-semibold text-apple-text-primary-light dark:text-apple-text-primary-dark">{user?.body_type || 'Not set'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-apple-text-secondary-light dark:text-apple-text-secondary-dark">Target Age:</span>
              <span className="font-semibold text-apple-text-primary-light dark:text-apple-text-primary-dark">{user?.age || 'Not set'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-apple-text-secondary-light dark:text-apple-text-secondary-dark">Preferred Style:</span>
              <span className="font-semibold text-apple-text-primary-light dark:text-apple-text-primary-dark">{user?.preferred_style || 'Not set'}</span>
            </div>
            
            <div className="flex flex-col gap-1.5 pt-2 border-t border-apple-border-light/40 dark:border-apple-border-dark/40">
              <span className="text-xs font-bold text-apple-text-secondary-light uppercase tracking-wider block">Palette Colors:</span>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {user?.preferred_colors && user.preferred_colors.length > 0 ? (
                  user.preferred_colors.map(c => (
                    <span key={c} className="px-2.5 py-0.5 rounded-full text-[10px] bg-apple-bg-light dark:bg-black/40 text-apple-text-primary-light dark:text-apple-text-primary-dark border border-apple-border-light dark:border-apple-border-dark">
                      {c}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-apple-text-secondary-light italic">No colors selected</span>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={() => navigate('/recommendations')}
            className="w-full mt-4 py-2.5 rounded-full bg-apple-accent text-white font-medium hover:bg-apple-accent/90 shadow text-xs"
          >
            Update Styling Profile
          </button>
        </div>

        {/* Right Side: Navigation Tab views & Content list */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          
          {/* Navigation tabs */}
          <div className="flex border-b border-apple-border-light dark:border-apple-border-dark gap-6 text-sm font-semibold">
            <button
              onClick={() => setActiveTab('tryons')}
              className={`pb-3 flex items-center gap-2 relative ${
                activeTab === 'tryons' 
                  ? 'text-apple-accent' 
                  : 'text-apple-text-secondary-light hover:text-apple-text-primary-light dark:text-apple-text-secondary-dark'
              }`}
            >
              <Clock className="h-4 w-4" /> Recent Try-Ons ({tryonHistory.length})
              {activeTab === 'tryons' && (
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-apple-accent" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('favorites')}
              className={`pb-3 flex items-center gap-2 relative ${
                activeTab === 'favorites' 
                  ? 'text-apple-accent' 
                  : 'text-apple-text-secondary-light hover:text-apple-text-primary-light dark:text-apple-text-secondary-dark'
              }`}
            >
              <Heart className="h-4 w-4" /> Wishlist ({wishlist.length})
              {activeTab === 'favorites' && (
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-apple-accent" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('wardrobe')}
              className={`pb-3 flex items-center gap-2 relative ${
                activeTab === 'wardrobe' 
                  ? 'text-apple-accent' 
                  : 'text-apple-text-secondary-light hover:text-apple-text-primary-light dark:text-apple-text-secondary-dark'
              }`}
            >
              <FolderHeart className="h-4 w-4" /> My Wardrobe ({savedLooks.length})
              {activeTab === 'wardrobe' && (
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-apple-accent" />
              )}
            </button>
          </div>

          {errorMsg && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 text-sm flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Tab content displays */}
          <div>
            {activeTab === 'tryons' ? (
              
              /* TryOn History */
              loadingHistory ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Skeleton className="h-40 w-full" />
                  <Skeleton className="h-40 w-full" />
                </div>
              ) : tryonHistory.length === 0 ? (
                <div className="text-center py-20 bg-white dark:bg-[#151516] border border-apple-border-light dark:border-apple-border-dark rounded-[30px] flex flex-col items-center gap-3">
                  <History className="h-8 w-8 text-neutral-400" />
                  <h4 className="font-bold text-apple-text-primary-light dark:text-apple-text-primary-dark">No try-on history</h4>
                  <p className="text-xs text-apple-text-secondary-light max-w-xs leading-relaxed">
                    You haven't run any virtual clothes composites yet. Head over to the try-on page to design fittings.
                  </p>
                  <button 
                    onClick={() => navigate('/tryon')}
                    className="mt-2 px-5 py-2 rounded-full text-xs font-semibold bg-apple-accent text-white"
                  >
                    Go to Fitting Room
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {tryonHistory.map((history) => (
                    <div 
                      key={history.id}
                      className="p-4 rounded-2xl bg-white dark:bg-[#1b1b1c] border border-apple-border-light dark:border-apple-border-dark flex gap-4 hover:shadow-premium transition-all group"
                    >
                      <div className="h-24 w-20 rounded-xl overflow-hidden bg-neutral-100 shrink-0 border border-apple-border-light">
                        <img src={window.getMediaUrl(history.result_image_url)} alt="fit result" className="h-full w-full object-cover" />
                      </div>
                      
                      <div className="flex flex-col justify-between flex-1 py-1">
                        <div>
                          <h4 className="font-bold text-sm text-apple-text-primary-light dark:text-apple-text-primary-dark line-clamp-1">
                            {history.product?.name || 'Custom Outfit Fit'}
                          </h4>
                          <span className="text-[10px] text-apple-text-secondary-light dark:text-apple-text-secondary-dark block mt-1">
                            Rendered: {new Date(history.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        
                        <div className="flex gap-3 justify-end items-center pt-2">
                          <a 
                            href={window.getMediaUrl(history.result_image_url)}
                            download
                            className="p-1.5 rounded-full hover:bg-black/5 text-apple-text-secondary-light dark:text-apple-text-secondary-dark hover:text-apple-accent transition-colors"
                            title="Download PNG"
                          >
                            <Download className="h-4 w-4" />
                          </a>
                          <button
                            onClick={() => handleDeleteHistory(history.id)}
                            className="p-1.5 rounded-full hover:bg-red-550/10 text-apple-text-secondary-light dark:text-apple-text-secondary-dark hover:text-red-500 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )
              
            ) : activeTab === 'favorites' ? (
              
              /* Wishlist Items */
              loadingWishlist ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Skeleton className="h-32 w-full" />
                  <Skeleton className="h-32 w-full" />
                </div>
              ) : wishlist.length === 0 ? (
                <div className="text-center py-20 bg-white dark:bg-[#151516] border border-apple-border-light dark:border-apple-border-dark rounded-[30px] flex flex-col items-center gap-3">
                  <Heart className="h-8 w-8 text-neutral-400" />
                  <h4 className="font-bold text-apple-text-primary-light dark:text-apple-text-primary-dark">Your Wishlist is empty</h4>
                  <p className="text-xs text-apple-text-secondary-light max-w-xs leading-relaxed">
                    Save clothing cards from the design catalog to build your wishlist collection.
                  </p>
                  <button 
                    onClick={() => navigate('/catalog')}
                    className="mt-2 px-5 py-2 rounded-full text-xs font-semibold bg-apple-accent text-white border-0 cursor-pointer"
                  >
                    Browse Catalog
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {wishlist.map((item) => (
                    <div 
                      key={item.id}
                      className="p-4 rounded-2xl bg-white dark:bg-[#1b1b1c] border border-apple-border-light dark:border-apple-border-dark flex gap-4 hover:shadow-premium transition-all"
                    >
                      <div className="h-20 w-16 rounded-xl overflow-hidden bg-neutral-100 shrink-0 border border-apple-border-light">
                        <img src={window.getMediaUrl(item.product?.image_url)} alt="product" className="h-full w-full object-cover" />
                      </div>
                      
                      <div className="flex flex-col justify-between flex-1 py-0.5">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-bold text-sm text-apple-text-primary-light dark:text-apple-text-primary-dark line-clamp-1">{item.product?.name}</h4>
                            <span className="text-[10px] text-apple-text-secondary-light dark:text-apple-text-secondary-dark block mt-0.5">₹{item.product?.price.toFixed(2)}</span>
                          </div>
                        </div>
                        
                        <div className="flex justify-end gap-3 items-center pt-2">
                          <button
                            onClick={() => navigate(`/tryon?product_id=${item.product_id}`)}
                            className="px-3.5 py-1 rounded-full text-[10px] font-bold bg-apple-accent/15 text-apple-accent flex items-center gap-1 hover:bg-apple-accent/25 transition-colors border-0 cursor-pointer"
                          >
                            <Sparkles className="h-3 w-3" /> Fit Room
                          </button>
                          <button
                            onClick={() => handleRemoveWishlist(item.product_id)}
                            className="p-1.5 rounded-full hover:bg-red-550/10 text-apple-text-secondary-light dark:text-apple-text-secondary-dark hover:text-red-500 transition-colors border-0 cursor-pointer"
                            title="Remove Favorite"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )
              
            ) : (
              
              /* Virtual Wardrobe Saved Looks */
              savedLooks.length === 0 ? (
                <div className="text-center py-20 bg-white dark:bg-[#151516] border border-apple-border-light dark:border-apple-border-dark rounded-[30px] flex flex-col items-center gap-3">
                  <FolderHeart className="h-8 w-8 text-neutral-400" />
                  <h4 className="font-bold text-apple-text-primary-light dark:text-apple-text-primary-dark">Your Wardrobe is empty</h4>
                  <p className="text-xs text-apple-text-secondary-light max-w-xs leading-relaxed">
                    Style outfits in the virtual fitting room and click "Save Look" to see them here.
                  </p>
                  <button 
                    onClick={() => navigate('/tryon')}
                    className="mt-2 px-5 py-2 rounded-full text-xs font-semibold bg-apple-accent text-white border-0 cursor-pointer"
                  >
                    Go to Fitting Room
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {savedLooks.map((look) => (
                    <div 
                      key={look.id}
                      className="p-4 rounded-2xl bg-white dark:bg-[#1b1b1c] border border-apple-border-light dark:border-apple-border-dark flex gap-4 hover:shadow-premium transition-all"
                    >
                      <div className="h-24 w-20 rounded-xl overflow-hidden bg-neutral-100 shrink-0 border border-apple-border-light">
                        <img src={look.resultImageUrl} alt="saved look" className="h-full w-full object-cover" />
                      </div>
                      
                      <div className="flex flex-col justify-between flex-1 py-0.5">
                        <div>
                          <h4 className="font-bold text-sm text-apple-text-primary-light dark:text-apple-text-primary-dark line-clamp-2">
                            {look.selectedProducts.map(p => p.name).join(' + ') || 'Custom Style'}
                          </h4>
                          <span className="text-[10px] text-apple-text-secondary-light dark:text-apple-text-secondary-dark block mt-1">
                            Saved: {new Date(look.timestamp).toLocaleDateString()}
                          </span>
                        </div>
                        
                        <div className="flex justify-end gap-3 items-center pt-2">
                          <button
                            onClick={() => navigate(`/tryon?load_look_id=${look.id}`)}
                            className="px-3.5 py-1 rounded-full text-[10px] font-bold bg-apple-accent/15 text-apple-accent flex items-center gap-1 hover:bg-apple-accent/25 transition-colors border-0 cursor-pointer"
                          >
                            <Sparkles className="h-3 w-3" /> Load Outfit
                          </button>
                          <button
                            onClick={() => handleDeleteSavedLook(look.id)}
                            className="p-1.5 rounded-full hover:bg-red-550/10 text-apple-text-secondary-light dark:text-apple-text-secondary-dark hover:text-red-500 transition-colors border-0 cursor-pointer"
                            title="Delete Look"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )
              
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
