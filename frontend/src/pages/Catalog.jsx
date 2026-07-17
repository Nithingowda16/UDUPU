import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Search, SlidersHorizontal, Eye, Heart, Sparkles, AlertCircle, ChevronLeft, ChevronRight, ChevronDown, Mic } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Skeleton from '../components/Skeleton';

export default function Catalog() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // State variables
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [wishlistIds, setWishlistIds] = useState(new Set());
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Pagination & Count
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);

  // Filters state from URL query
  const categoryId = searchParams.get('category_id') || '';
  const gender = searchParams.get('gender') || '';
  const occasion = searchParams.get('occasion') || '';
  const style = searchParams.get('style') || '';
  const season = searchParams.get('season') || '';
  const search = searchParams.get('search') || '';
  const sortBy = searchParams.get('sort_by') || 'created_at';
  const page = parseInt(searchParams.get('page') || '1');

  // Toggle filter drawer (mobile)
  const [showFilters, setShowFilters] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const startVoiceSearch = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice search is not supported in this browser. Please use Chrome.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onerror = (e) => {
      console.error(e);
      setIsListening(false);
    };

    recognition.onresult = (event) => {
      // Strip ending punctuation (periods, question marks, commas) that speech recognition engines append
      const transcript = event.results[0][0].transcript.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "").trim();
      
      const filters = {};
      let cleanSearch = transcript;

      const stripKeyword = (word) => {
        cleanSearch = cleanSearch.replace(word, '').trim();
      };

      // Season filter
      if (transcript.includes('summer')) {
        filters.season = 'Summer';
        stripKeyword('summer');
      } else if (transcript.includes('winter')) {
        filters.season = 'Winter';
        stripKeyword('winter');
      } else if (transcript.includes('autumn') || transcript.includes('fall')) {
        filters.season = 'Autumn';
        stripKeyword(transcript.includes('autumn') ? 'autumn' : 'fall');
      } else if (transcript.includes('spring')) {
        filters.season = 'Spring';
        stripKeyword('spring');
      }

      // Gender filter
      if (transcript.includes('women') || transcript.includes('woman') || transcript.includes('girl') || transcript.includes('dresses') || transcript.includes('dress')) {
        filters.gender = 'Women';
        ['women', 'woman', 'girl', 'dresses', 'dress'].forEach(w => stripKeyword(w));
      } else if (transcript.includes('men') || transcript.includes('man') || transcript.includes('boy')) {
        filters.gender = 'Men';
        ['men', 'man', 'boy'].forEach(w => stripKeyword(w));
      } else if (transcript.includes('kids') || transcript.includes('child')) {
        filters.gender = 'Kids';
        ['kids', 'child'].forEach(w => stripKeyword(w));
      }

      // Occasion filter
      if (transcript.includes('wedding') || transcript.includes('bridal') || transcript.includes('festive') || transcript.includes('sherwani')) {
        filters.occasion = 'Wedding';
        ['wedding', 'bridal', 'festive', 'sherwani'].forEach(w => stripKeyword(w));
      } else if (transcript.includes('formal') || transcript.includes('office') || transcript.includes('business') || transcript.includes('blazer')) {
        filters.occasion = 'Office';
        ['formal', 'office', 'business', 'blazer'].forEach(w => stripKeyword(w));
      } else if (transcript.includes('casual') || transcript.includes('daily') || transcript.includes('home')) {
        filters.occasion = 'Casual';
        ['casual', 'daily', 'home'].forEach(w => stripKeyword(w));
      }

      // Style filter
      if (transcript.includes('ethnic') || transcript.includes('traditional')) {
        filters.style = 'Casual';
        ['ethnic', 'traditional'].forEach(w => stripKeyword(w));
      } else if (transcript.includes('sport') || transcript.includes('gym') || transcript.includes('athletic')) {
        filters.style = 'Sporty';
        ['sport', 'gym', 'athletic'].forEach(w => stripKeyword(w));
      } else if (transcript.includes('western') || transcript.includes('modern')) {
        filters.style = 'Casual';
        ['western', 'modern'].forEach(w => stripKeyword(w));
      }

      // Clean up common filler words
      const fillers = ['show me', 'find', 'search', 'clothes', 'garments', 'wear', 'outfits', 'outfit', 'looks', 'look', 'some', 'a', 'the', 'for'];
      fillers.forEach(f => {
        const regex = new RegExp(`\\b${f}\\b`, 'g');
        cleanSearch = cleanSearch.replace(regex, '').trim();
      });

      // Remove extra spaces
      cleanSearch = cleanSearch.replace(/\s+/g, ' ').trim();

      filters.search = cleanSearch;
      filters.page = 1;

      updateParams(filters);
    };

    recognition.start();
  };

  // Load Categories & Wishlist on Mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axios.get('/api/categories');
        setCategories(res.data);
      } catch (err) {
        console.error("Error fetching categories:", err);
      }
    };

    fetchCategories();
  }, []);

  // Fetch Wishlist Items to highlight heart icons
  useEffect(() => {
    const fetchWishlist = async () => {
      if (!user) return;
      try {
        const res = await axios.get('/api/wishlist');
        const ids = new Set(res.data.map(item => item.product_id));
        setWishlistIds(ids);
      } catch (err) {
        console.error("Error fetching wishlist IDs:", err);
      }
    };
    fetchWishlist();
  }, [user]);

  // Fetch Products on filter changes
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setError('');
      try {
        const params = {
          page,
          limit: 9,
          sort_by: sortBy
        };
        if (categoryId) params.category_id = categoryId;
        if (gender) params.gender = gender;
        if (occasion) params.occasion = occasion;
        if (style) params.style = style;
        if (season) params.season = season;
        if (search) params.search = search;

        const res = await axios.get('/api/products', { params });
        setProducts(res.data.products);
        setTotalPages(res.data.pages);
        setTotalProducts(res.data.total);
      } catch (err) {
        console.error("Error fetching products:", err);
        setError('Could not connect to service. Please verify your backend server is active.');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [categoryId, gender, occasion, style, season, search, sortBy, page]);

  // Helper to update query parameters
  const updateParams = (newParams) => {
    const updated = new URLSearchParams(searchParams);
    
    // Always reset to page 1 on filter modification (unless explicitly changing page)
    if (!newParams.page) {
      updated.set('page', '1');
    }

    Object.entries(newParams).forEach(([key, val]) => {
      if (val === '') {
        updated.delete(key);
      } else {
        updated.set(key, val);
      }
    });
    setSearchParams(updated);
  };

  const handleWishlistToggle = async (productId) => {
    if (!user) {
      navigate('/login', { state: { from: { pathname: '/catalog' } } });
      return;
    }

    const isFav = wishlistIds.has(productId);
    try {
      if (isFav) {
        await axios.delete(`/api/wishlist/${productId}`);
        setWishlistIds(prev => {
          const updated = new Set(prev);
          updated.delete(productId);
          return updated;
        });
      } else {
        await axios.post('/api/wishlist', { product_id: productId });
        setWishlistIds(prev => new Set([...prev, productId]));
      }
    } catch (err) {
      console.error("Error updating wishlist:", err);
    }
  };

  const clearFilters = () => {
    setSearchParams({});
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 flex flex-col gap-8 w-full">
      
      {/* Header Area */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-apple-text-primary-light dark:text-apple-text-primary-dark">Design Collection</h1>
          <p className="text-sm text-apple-text-secondary-light dark:text-apple-text-secondary-dark mt-1">
            Browse our premium catalogs and try garments in real-time.
          </p>
        </div>
        
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-apple-text-secondary-light dark:text-apple-text-secondary-dark">
            <Search className="h-4 w-4" />
          </div>
          <input
            type="text"
            placeholder={isListening ? "Listening... speak now" : "Search clothes..."}
            value={isListening ? "" : search}
            onChange={(e) => updateParams({ search: e.target.value })}
            className="w-full pl-9 pr-10 py-2 rounded-full border border-apple-border-light dark:border-apple-border-dark bg-transparent text-apple-text-primary-light dark:text-apple-text-primary-dark focus:outline-none focus:border-apple-accent transition-all text-sm"
          />
          <button
            onClick={startVoiceSearch}
            className={`absolute inset-y-0 right-0 pr-3 flex items-center bg-transparent border-0 cursor-pointer ${
              isListening ? 'text-red-500 animate-pulse' : 'text-apple-text-secondary-light hover:text-apple-accent'
            }`}
            title="Voice Search"
          >
            <Mic className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Left Side Filters Sidebar (Desktop) */}
        <aside className="hidden lg:flex flex-col gap-6 p-6 rounded-[24px] glassmorphism h-fit border border-apple-border-light dark:border-apple-border-dark">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-apple-text-primary-light dark:text-apple-text-primary-dark flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4" /> Filters
            </h3>
            <button 
              onClick={clearFilters}
              className="text-xs text-apple-accent hover:underline font-medium"
            >
              Clear all
            </button>
          </div>

          <hr className="border-apple-border-light dark:border-apple-border-dark" />

          {/* Gender */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-apple-text-secondary-light dark:text-apple-text-secondary-dark">Gender</span>
            <div className="relative w-full">
              <select
                value={gender}
                onChange={(e) => updateParams({ gender: e.target.value })}
                className="w-full appearance-none pr-10 px-3 py-2 rounded-xl border border-apple-border-light dark:border-apple-border-dark bg-white/40 dark:bg-black/20 text-apple-text-primary-light dark:text-apple-text-primary-dark focus:outline-none focus:ring-1 focus:ring-apple-accent focus:border-apple-accent text-sm"
              >
                <option value="">All Genders</option>
                <option value="Men">Men</option>
                <option value="Women">Women</option>
                <option value="Kids">Kids</option>
                <option value="Accessories">Accessories</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-apple-text-secondary-light">
                <ChevronDown className="h-4 w-4" />
              </div>
            </div>
          </div>

          {/* Category */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-apple-text-secondary-light dark:text-apple-text-secondary-dark">Category</span>
            <div className="relative w-full">
              <select
                value={categoryId}
                onChange={(e) => updateParams({ category_id: e.target.value })}
                className="w-full appearance-none pr-10 px-3 py-2 rounded-xl border border-apple-border-light dark:border-apple-border-dark bg-white/40 dark:bg-black/20 text-apple-text-primary-light dark:text-apple-text-primary-dark focus:outline-none focus:ring-1 focus:ring-apple-accent focus:border-apple-accent text-sm"
              >
                <option value="">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-apple-text-secondary-light">
                <ChevronDown className="h-4 w-4" />
              </div>
            </div>
          </div>

          {/* Occasion */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-apple-text-secondary-light dark:text-apple-text-secondary-dark">Occasion</span>
            <div className="relative w-full">
              <select
                value={occasion}
                onChange={(e) => updateParams({ occasion: e.target.value })}
                className="w-full appearance-none pr-10 px-3 py-2 rounded-xl border border-apple-border-light dark:border-apple-border-dark bg-white/40 dark:bg-black/20 text-apple-text-primary-light dark:text-apple-text-primary-dark focus:outline-none focus:ring-1 focus:ring-apple-accent focus:border-apple-accent text-sm"
              >
                <option value="">All Occasions</option>
                <option value="Casual">Casual</option>
                <option value="Office">Office</option>
                <option value="Wedding">Wedding</option>
                <option value="College">College</option>
                <option value="Festival">Festival</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-apple-text-secondary-light">
                <ChevronDown className="h-4 w-4" />
              </div>
            </div>
          </div>

          {/* Style */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-apple-text-secondary-light dark:text-apple-text-secondary-dark">Style</span>
            <div className="relative w-full">
              <select
                value={style}
                onChange={(e) => updateParams({ style: e.target.value })}
                className="w-full appearance-none pr-10 px-3 py-2 rounded-xl border border-apple-border-light dark:border-apple-border-dark bg-white/40 dark:bg-black/20 text-apple-text-primary-light dark:text-apple-text-primary-dark focus:outline-none focus:ring-1 focus:ring-apple-accent focus:border-apple-accent text-sm"
              >
                <option value="">All Styles</option>
                <option value="Casual">Casual</option>
                <option value="Formal">Formal</option>
                <option value="Sporty">Sporty</option>
                <option value="Chic">Chic</option>
                <option value="Vintage">Vintage</option>
                <option value="Streetwear">Streetwear</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-apple-text-secondary-light">
                <ChevronDown className="h-4 w-4" />
              </div>
            </div>
          </div>

          {/* Season */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-apple-text-secondary-light dark:text-apple-text-secondary-dark">Season</span>
            <div className="relative w-full">
              <select
                value={season}
                onChange={(e) => updateParams({ season: e.target.value })}
                className="w-full appearance-none pr-10 px-3 py-2 rounded-xl border border-apple-border-light dark:border-apple-border-dark bg-white/40 dark:bg-black/20 text-apple-text-primary-light dark:text-apple-text-primary-dark focus:outline-none focus:ring-1 focus:ring-apple-accent focus:border-apple-accent text-sm"
              >
                <option value="">All Seasons</option>
                <option value="Summer">Summer</option>
                <option value="Winter">Winter</option>
                <option value="Spring">Spring</option>
                <option value="Autumn">Autumn</option>
                <option value="All">Year-round</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-apple-text-secondary-light">
                <ChevronDown className="h-4 w-4" />
              </div>
            </div>
          </div>
        </aside>

        {/* Right Side Cards Grid */}
        <main className="lg:col-span-3 flex flex-col gap-8">
          
          {/* Controls Bar */}
          <div className="flex items-center justify-between bg-white dark:bg-[#151516] p-4 rounded-2xl border border-apple-border-light dark:border-apple-border-dark transition-colors duration-300">
            <span className="text-xs text-apple-text-secondary-light dark:text-apple-text-secondary-dark">
              Showing <span className="font-semibold text-apple-text-primary-light dark:text-apple-text-primary-dark">{products.length}</span> of {totalProducts} items
            </span>
            
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setShowFilters(!showFilters)}
                className="lg:hidden px-3.5 py-1.5 rounded-full text-xs border border-apple-border-light dark:border-apple-border-dark flex items-center gap-1.5 text-apple-text-primary-light dark:text-apple-text-primary-dark hover:bg-black/5"
              >
                <SlidersHorizontal className="h-3.5 w-3.5" /> Filters
              </button>
              
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => updateParams({ sort_by: e.target.value })}
                  className="appearance-none pr-8 px-4 py-1.5 rounded-full border border-apple-border-light dark:border-apple-border-dark bg-white/40 dark:bg-black/20 text-apple-text-primary-light dark:text-apple-text-primary-dark focus:outline-none text-xs font-semibold"
                >
                  <option value="created_at">Latest Arrivals</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-2.5 pointer-events-none text-apple-text-secondary-light">
                  <ChevronDown className="h-3 w-3" />
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Filters Drawer */}
          <AnimatePresence>
            {showFilters && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="lg:hidden flex flex-col gap-4 p-5 bg-white dark:bg-[#151516] border border-apple-border-light dark:border-apple-border-dark rounded-2xl overflow-hidden"
              >
                {/* Mobile Filters Content (Duplicate selector list for space efficiency) */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-apple-text-secondary-light">Gender</span>
                    <select value={gender} onChange={(e) => updateParams({ gender: e.target.value })} className="px-2 py-1.5 rounded-xl border border-apple-border-light dark:border-apple-border-dark bg-transparent text-xs text-apple-text-primary-light dark:text-apple-text-primary-dark">
                      <option value="">All Genders</option>
                      <option value="Men">Men</option>
                      <option value="Women">Women</option>
                      <option value="Kids">Kids</option>
                      <option value="Accessories">Accessories</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-apple-text-secondary-light">Category</span>
                    <select value={categoryId} onChange={(e) => updateParams({ category_id: e.target.value })} className="px-2 py-1.5 rounded-xl border border-apple-border-light dark:border-apple-border-dark bg-transparent text-xs text-apple-text-primary-light dark:text-apple-text-primary-dark">
                      <option value="">All Categories</option>
                      {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-apple-text-secondary-light">Occasion</span>
                    <select value={occasion} onChange={(e) => updateParams({ occasion: e.target.value })} className="px-2 py-1.5 rounded-xl border border-apple-border-light dark:border-apple-border-dark bg-transparent text-xs text-apple-text-primary-light dark:text-apple-text-primary-dark">
                      <option value="">All Occasions</option>
                      <option value="Casual">Casual</option>
                      <option value="Office">Office</option>
                      <option value="Wedding">Wedding</option>
                      <option value="College">College</option>
                      <option value="Festival">Festival</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-apple-text-secondary-light">Style</span>
                    <select value={style} onChange={(e) => updateParams({ style: e.target.value })} className="px-2 py-1.5 rounded-xl border border-apple-border-light dark:border-apple-border-dark bg-transparent text-xs text-apple-text-primary-light dark:text-apple-text-primary-dark">
                      <option value="">All Styles</option>
                      <option value="Casual">Casual</option>
                      <option value="Formal">Formal</option>
                      <option value="Sporty">Sporty</option>
                      <option value="Chic">Chic</option>
                      <option value="Vintage">Vintage</option>
                      <option value="Streetwear">Streetwear</option>
                    </select>
                  </div>
                </div>
                <button 
                  onClick={() => setShowFilters(false)}
                  className="w-full mt-2 py-2 rounded-xl text-xs font-semibold bg-apple-accent text-white"
                >
                  Apply Filters
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Cards Display */}
          {error && (
            <div className="p-6 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm flex items-center gap-3">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="flex flex-col gap-4">
                  <Skeleton className="w-full aspect-[4/5]" />
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-4 w-1/3" />
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20 bg-white dark:bg-[#151516] border border-apple-border-light dark:border-apple-border-dark rounded-[30px] flex flex-col items-center gap-3">
              <span className="text-4xl">🔎</span>
              <h3 className="text-lg font-bold text-apple-text-primary-light dark:text-apple-text-primary-dark">No garments found</h3>
              <p className="text-sm text-apple-text-secondary-light dark:text-apple-text-secondary-dark max-w-xs leading-relaxed">
                We couldn't find items matching your active filter combinations. Try clearing some filters.
              </p>
              <button 
                onClick={clearFilters}
                className="mt-2 px-6 py-2 rounded-full text-xs font-medium bg-apple-accent text-white"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {products.map((prod) => {
                const isFav = wishlistIds.has(prod.id);
                return (
                  <motion.div
                    key={prod.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4 }}
                    className="group flex flex-col justify-between apple-card overflow-hidden hover:border-apple-accent/25"
                  >
                    {/* Image preview area */}
                    <div className="relative aspect-[4/5] bg-apple-bg-light dark:bg-black/20 overflow-hidden flex items-center justify-center">
                      <img
                        src={window.getMediaUrl(prod.image_url)}
                        alt={prod.name}
                        className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
                        loading="lazy"
                      />
                      
                      {/* Floating badging */}
                      <span className="absolute top-4 left-4 px-3 py-1 rounded-full text-[10px] font-semibold bg-white/80 dark:bg-black/80 text-apple-text-primary-light dark:text-apple-text-primary-dark border border-white/20 backdrop-blur">
                        {prod.gender}
                      </span>
                      
                      {/* Heart Button */}
                      <button
                        onClick={() => handleWishlistToggle(prod.id)}
                        className={`absolute top-4 right-4 p-2 rounded-full border border-white/20 backdrop-blur transition-all active:scale-90 ${
                          isFav 
                            ? 'bg-red-500 text-white' 
                            : 'bg-white/80 dark:bg-black/80 text-apple-text-secondary-light dark:text-apple-text-secondary-dark hover:text-red-500'
                        }`}
                      >
                        <Heart className={`h-4 w-4 ${isFav ? 'fill-white' : ''}`} />
                      </button>
                    </div>

                    {/* Meta data card */}
                    <div className="p-5 flex flex-col gap-4">
                      <div className="flex flex-col gap-1">
                        <h4 className="font-semibold text-base text-apple-text-primary-light dark:text-apple-text-primary-dark group-hover:text-apple-accent transition-colors">
                          {prod.name}
                        </h4>
                        <span className="text-xs text-apple-text-secondary-light dark:text-apple-text-secondary-dark line-clamp-2">
                          {prod.description}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center pt-2 border-t border-apple-border-light/40 dark:border-apple-border-dark/40">
                        <span className="text-base font-bold text-apple-text-primary-light dark:text-apple-text-primary-dark">
                          ₹{prod.price.toFixed(2)}
                        </span>
                        
                        <div className="flex gap-2">
                          <button
                            onClick={() => navigate(`/tryon?product_id=${prod.id}`)}
                            className="px-4 py-2 text-xs flex items-center gap-1.5 apple-btn-primary"
                          >
                            <Sparkles className="h-3 w-3" /> Fit
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-3 mt-4">
              <button
                disabled={page === 1}
                onClick={() => updateParams({ page: page - 1 })}
                className="p-2.5 rounded-full border border-apple-border-light dark:border-apple-border-dark text-apple-text-primary-light dark:text-apple-text-primary-dark hover:bg-black/5 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              
              <span className="text-xs text-apple-text-secondary-light dark:text-apple-text-secondary-dark">
                Page <span className="font-semibold text-apple-text-primary-light dark:text-apple-text-primary-dark">{page}</span> of {totalPages}
              </span>
              
              <button
                disabled={page === totalPages}
                onClick={() => updateParams({ page: page + 1 })}
                className="p-2.5 rounded-full border border-apple-border-light dark:border-apple-border-dark text-apple-text-primary-light dark:text-apple-text-primary-dark hover:bg-black/5 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}

        </main>
      </div>

    </div>
  );
}
