import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Users, PlusCircle, Terminal, AlertCircle, CheckCircle2, Trash2, ShieldAlert, Cpu, HardDrive } from 'lucide-react';
import { motion } from 'framer-motion';
import Skeleton from '../components/Skeleton';

export default function Admin() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Tab Views: dashboard, users, products, logs
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Data states
  const [stats, setStats] = useState(null);
  const [recentTryons, setRecentTryons] = useState([]);
  const [recentUsers, setRecentUsers] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [productsList, setProductsList] = useState([]);
  const [categoriesList, setCategoriesList] = useState([]);
  const [logsData, setLogsData] = useState([]);
  const [systemInfo, setSystemInfo] = useState(null);

  // Forms
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    price: '',
    category_id: '',
    gender: 'Men',
    style: 'Casual',
    season: 'Summer',
    occasion: 'Casual',
    body_type: 'Rectangle,Hourglass,Triangle,Inverted Triangle,Oval',
    colors: '',
    stock: '10'
  });
  const [imageFile, setImageFile] = useState(null);
  const [garmentFile, setGarmentFile] = useState(null);

  // UI state
  const [loading, setLoading] = useState(true);
  const [submittingProduct, setSubmittingProduct] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const imageInputRef = useRef(null);
  const garmentInputRef = useRef(null);

  // Redirect if not signed in or not admin
  useEffect(() => {
    if (!user) {
      navigate('/login');
    } else if (user.role !== 'admin') {
      navigate('/catalog');
    }
  }, [user, navigate]);

  // Load Dashboard stats & logs
  useEffect(() => {
    if (!user || user.role !== 'admin') return;

    const fetchAdminData = async () => {
      setLoading(true);
      setErrorMsg('');
      try {
        // Load stats
        const statsRes = await axios.get('/api/admin/dashboard');
        setStats(statsRes.data.stats);
        setRecentTryons(statsRes.data.recent_tryons);
        setRecentUsers(statsRes.data.recent_users);
        
        // Load users list
        const usersRes = await axios.get('/api/admin/users');
        setUsersList(usersRes.data);

        // Load categories for product creation dropdown
        const catsRes = await axios.get('/api/categories');
        setCategoriesList(catsRes.data);
        if (catsRes.data.length > 0 && !newProduct.category_id) {
          setNewProduct(prev => ({ ...prev, category_id: String(catsRes.data[0].id) }));
        }

        // Load active products list
        const prodsRes = await axios.get('/api/products?limit=100');
        setProductsList(prodsRes.data.products);

        // Load logs
        const logsRes = await axios.get('/api/admin/logs');
        setLogsData(logsRes.data.logs);
        setSystemInfo(logsRes.data.system_info);

      } catch (err) {
        console.error("Admin dashboard fetch error:", err);
        setErrorMsg('Error connecting to administration services. Ensure backend is running.');
      } finally {
        setLoading(false);
      }
    };
    fetchAdminData();
  }, [user, activeTab]);

  const handleRoleShift = async (targetId, currentRole) => {
    setErrorMsg('');
    setSuccessMsg('');
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    try {
      const res = await axios.put(`/api/admin/users/${targetId}`, { role: newRole });
      setUsersList(prev => prev.map(u => u.id === targetId ? res.data : u));
      setSuccessMsg(`User role modified successfully.`);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to update user role.');
    }
  };

  const handleUserDelete = async (targetId) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    setErrorMsg('');
    setSuccessMsg('');
    try {
      await axios.delete(`/api/admin/users/${targetId}`);
      setUsersList(prev => prev.filter(u => u.id !== targetId));
      setSuccessMsg('User account deleted.');
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to delete user.');
    }
  };

  const handleProductDelete = async (productId) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    setErrorMsg('');
    setSuccessMsg('');
    try {
      await axios.delete(`/api/products/${productId}`);
      setProductsList(prev => prev.filter(p => p.id !== productId));
      setSuccessMsg('Garment deleted from catalog.');
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to delete product.');
    }
  };

  const handleProductCreate = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    
    if (!imageFile || !garmentFile) {
      return setErrorMsg('Both catalog display image and transparent garment PNG overlays are required.');
    }

    const formData = new FormData();
    Object.entries(newProduct).forEach(([key, val]) => {
      formData.append(key, val);
    });
    formData.append('image', imageFile);
    formData.append('garment', garmentFile);

    setSubmittingProduct(true);
    try {
      const res = await axios.post('/api/products', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setProductsList(prev => [res.data, ...prev]);
      setSuccessMsg('New product added to catalog successfully!');
      
      // Reset Form
      setNewProduct({
        name: '',
        description: '',
        price: '',
        category_id: categoriesList[0]?.id ? String(categoriesList[0].id) : '',
        gender: 'Men',
        style: 'Casual',
        season: 'Summer',
        occasion: 'Casual',
        body_type: 'Rectangle,Hourglass,Triangle,Inverted Triangle,Oval',
        colors: '',
        stock: '10'
      });
      setImageFile(null);
      setGarmentFile(null);
      if (imageInputRef.current) imageInputRef.current.value = '';
      if (garmentInputRef.current) garmentInputRef.current.value = '';

    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.message || 'Error creating product.');
    } finally {
      setSubmittingProduct(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 flex flex-col gap-8 w-full transition-colors duration-300">
      
      {/* Top Banner */}
      <div className="flex justify-between items-center border-b border-apple-border-light dark:border-apple-border-dark pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-apple-text-primary-light dark:text-apple-text-primary-dark">Administrative Control</h1>
          <p className="text-sm text-apple-text-secondary-light dark:text-apple-text-secondary-dark mt-1">
            Manage user roles, catalog stock, uploads and view hardware systems logs.
          </p>
        </div>
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

      {/* Tabs */}
      <div className="flex border-b border-apple-border-light dark:border-apple-border-dark gap-6 text-sm font-semibold">
        <button 
          onClick={() => setActiveTab('dashboard')} 
          className={`pb-3 flex items-center gap-2 relative ${activeTab === 'dashboard' ? 'text-apple-accent' : 'text-apple-text-secondary-light hover:text-apple-text-primary-light'}`}
        >
          <LayoutDashboard className="h-4 w-4" /> Statistics
          {activeTab === 'dashboard' && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-apple-accent" />}
        </button>
        <button 
          onClick={() => setActiveTab('users')} 
          className={`pb-3 flex items-center gap-2 relative ${activeTab === 'users' ? 'text-apple-accent' : 'text-apple-text-secondary-light hover:text-apple-text-primary-light'}`}
        >
          <Users className="h-4 w-4" /> Users List
          {activeTab === 'users' && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-apple-accent" />}
        </button>
        <button 
          onClick={() => setActiveTab('products')} 
          className={`pb-3 flex items-center gap-2 relative ${activeTab === 'products' ? 'text-apple-accent' : 'text-apple-text-secondary-light hover:text-apple-text-primary-light'}`}
        >
          <PlusCircle className="h-4 w-4" /> Catalog Manager
          {activeTab === 'products' && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-apple-accent" />}
        </button>
        <button 
          onClick={() => setActiveTab('logs')} 
          className={`pb-3 flex items-center gap-2 relative ${activeTab === 'logs' ? 'text-apple-accent' : 'text-apple-text-secondary-light hover:text-apple-text-primary-light'}`}
        >
          <Terminal className="h-4 w-4" /> System Metrics & Logs
          {activeTab === 'logs' && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-apple-accent" />}
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col gap-6">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-60 w-full" />
        </div>
      ) : (
        <div>
          
          {/* TAB 1: Statistics Dashboard */}
          {activeTab === 'dashboard' && stats && (
            <div className="flex flex-col gap-8">
              {/* Core metrics cards */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                {[
                  { label: 'Total Users', val: stats.users },
                  { label: 'Catalog Products', val: stats.products },
                  { label: 'Virtual Fittings', val: stats.tryons },
                  { label: 'Wishlists Saved', val: stats.wishlists },
                  { label: 'Disk Assets Size', val: `${stats.storage_used_mb} MB` }
                ].map(card => (
                  <div key={card.label} className="p-5 rounded-2xl bg-white dark:bg-[#1b1b1c] border border-apple-border-light dark:border-apple-border-dark flex flex-col gap-1 shadow-premium">
                    <span className="text-[10px] uppercase font-bold text-apple-text-secondary-light dark:text-apple-text-secondary-dark">{card.label}</span>
                    <span className="text-2xl font-bold text-apple-text-primary-light dark:text-apple-text-primary-dark">{card.val}</span>
                  </div>
                ))}
              </div>

              {/* Lists table logs split */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* Recent fittings */}
                <div className="p-6 rounded-[24px] bg-white dark:bg-[#1b1b1c] border border-apple-border-light dark:border-apple-border-dark flex flex-col gap-4 shadow-premium">
                  <h4 className="font-bold text-sm text-apple-text-primary-light dark:text-apple-text-primary-dark uppercase tracking-wider">Recent Try-on Renders</h4>
                  <div className="flex flex-col gap-3">
                    {recentTryons.map(t => (
                      <div key={t.id} className="flex justify-between items-center text-xs p-2.5 rounded-lg bg-apple-bg-light dark:bg-black/20">
                        <span className="font-medium text-apple-text-primary-light dark:text-apple-text-primary-dark">{t.product?.name || 'Garment fit'}</span>
                        <span className="text-apple-text-secondary-light dark:text-apple-text-secondary-dark">{new Date(t.created_at).toLocaleDateString()}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Users */}
                <div className="p-6 rounded-[24px] bg-white dark:bg-[#1b1b1c] border border-apple-border-light dark:border-apple-border-dark flex flex-col gap-4 shadow-premium">
                  <h4 className="font-bold text-sm text-apple-text-primary-light dark:text-apple-text-primary-dark uppercase tracking-wider">Recent Signups</h4>
                  <div className="flex flex-col gap-3">
                    {recentUsers.map(u => (
                      <div key={u.id} className="flex justify-between items-center text-xs p-2.5 rounded-lg bg-apple-bg-light dark:bg-black/20">
                        <div>
                          <span className="font-semibold block text-apple-text-primary-light dark:text-apple-text-primary-dark">{u.name}</span>
                          <span className="text-[10px] text-apple-text-secondary-light dark:text-apple-text-secondary-dark">{u.email}</span>
                        </div>
                        <span className="px-2 py-0.5 rounded bg-apple-accent/15 text-apple-accent text-[9px] font-bold uppercase">{u.role}</span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB 2: Users Management */}
          {activeTab === 'users' && (
            <div className="overflow-x-auto rounded-[24px] border border-apple-border-light dark:border-apple-border-dark bg-white dark:bg-[#1b1b1c] shadow-premium">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-apple-border-light dark:border-apple-border-dark bg-apple-bg-light dark:bg-black/10 text-xs font-bold text-apple-text-secondary-light uppercase tracking-wider">
                    <th className="p-4">Name</th>
                    <th className="p-4">Email</th>
                    <th className="p-4">Role</th>
                    <th className="p-4">Created Date</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-apple-border-light/40 dark:divide-apple-border-dark/40 text-apple-text-primary-light dark:text-apple-text-primary-dark">
                  {usersList.map((item) => (
                    <tr key={item.id} className="hover:bg-black/[0.01]">
                      <td className="p-4 font-semibold">{item.name}</td>
                      <td className="p-4">{item.email}</td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${item.role === 'admin' ? 'bg-purple-500/15 text-purple-600 dark:text-purple-400' : 'bg-blue-500/15 text-blue-600'}`}>
                          {item.role}
                        </span>
                      </td>
                      <td className="p-4">{new Date(item.created_at).toLocaleDateString()}</td>
                      <td className="p-4 text-right flex gap-3 justify-end">
                        <button
                          onClick={() => handleRoleShift(item.id, item.role)}
                          className="text-xs font-semibold text-apple-accent hover:underline"
                        >
                          Shift Role
                        </button>
                        <button
                          onClick={() => handleUserDelete(item.id)}
                          className="text-xs font-semibold text-red-500 hover:underline"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 3: Catalog Manager */}
          {activeTab === 'products' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Product Creation form */}
              <div className="lg:col-span-5 p-6 rounded-[24px] bg-white dark:bg-[#1b1b1c] border border-apple-border-light dark:border-apple-border-dark flex flex-col gap-4 shadow-premium">
                <span className="text-xs font-bold uppercase tracking-wider text-apple-text-secondary-light">Create New Garment</span>
                
                <form onSubmit={handleProductCreate} className="flex flex-col gap-4 text-xs text-apple-text-primary-light dark:text-apple-text-primary-dark">
                  <div className="flex flex-col gap-1.5">
                    <label className="font-semibold text-apple-text-secondary-light">Garment Name</label>
                    <input 
                      type="text" 
                      required
                      value={newProduct.name}
                      onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                      placeholder="e.g. Ivory Wool Knit Sweater"
                      className="px-3.5 py-2 rounded-xl border border-apple-border-light dark:border-apple-border-dark bg-transparent text-sm focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="font-semibold text-apple-text-secondary-light">Price (₹)</label>
                      <input 
                        type="number" 
                        step="0.01" 
                        required
                        value={newProduct.price}
                        onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                        placeholder="99.00"
                        className="px-3.5 py-2 rounded-xl border border-apple-border-light dark:border-apple-border-dark bg-transparent text-sm focus:outline-none"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="font-semibold text-apple-text-secondary-light">Category</label>
                      <select
                        value={newProduct.category_id}
                        onChange={(e) => setNewProduct({ ...newProduct, category_id: e.target.value })}
                        className="px-3.5 py-2 rounded-xl border border-apple-border-light dark:border-apple-border-dark bg-transparent text-sm focus:outline-none"
                      >
                        {categoriesList.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="font-semibold text-apple-text-secondary-light">Description</label>
                    <textarea 
                      rows={3}
                      value={newProduct.description}
                      onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                      placeholder="Detailed composition notes..."
                      className="px-3.5 py-2 rounded-xl border border-apple-border-light dark:border-apple-border-dark bg-transparent text-sm focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="font-semibold text-apple-text-secondary-light">Gender</label>
                      <select value={newProduct.gender} onChange={(e) => setNewProduct({ ...newProduct, gender: e.target.value })} className="px-3.5 py-2 rounded-xl border border-apple-border-light dark:border-apple-border-dark bg-transparent text-sm">
                        <option value="Men">Men</option>
                        <option value="Women">Women</option>
                        <option value="Kids">Kids</option>
                        <option value="Accessories">Accessories</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="font-semibold text-apple-text-secondary-light">Style</label>
                      <select value={newProduct.style} onChange={(e) => setNewProduct({ ...newProduct, style: e.target.value })} className="px-3.5 py-2 rounded-xl border border-apple-border-light dark:border-apple-border-dark bg-transparent text-sm">
                        <option value="Casual">Casual</option>
                        <option value="Formal">Formal</option>
                        <option value="Sporty">Sporty</option>
                        <option value="Chic">Chic</option>
                        <option value="Vintage">Vintage</option>
                        <option value="Streetwear">Streetwear</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="font-semibold text-apple-text-secondary-light">Season</label>
                      <select value={newProduct.season} onChange={(e) => setNewProduct({ ...newProduct, season: e.target.value })} className="px-3.5 py-2 rounded-xl border border-apple-border-light dark:border-apple-border-dark bg-transparent text-sm">
                        <option value="Summer">Summer</option>
                        <option value="Winter">Winter</option>
                        <option value="Spring">Spring</option>
                        <option value="Autumn">Autumn</option>
                        <option value="All">All weather</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="font-semibold text-apple-text-secondary-light">Occasion</label>
                      <select value={newProduct.occasion} onChange={(e) => setNewProduct({ ...newProduct, occasion: e.target.value })} className="px-3.5 py-2 rounded-xl border border-apple-border-light dark:border-apple-border-dark bg-transparent text-sm">
                        <option value="Casual">Casual</option>
                        <option value="Office">Office</option>
                        <option value="Wedding">Wedding</option>
                        <option value="College">College</option>
                        <option value="Festival">Festival</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="font-semibold text-apple-text-secondary-light">Display/Catalog Image</label>
                      <input 
                        type="file" 
                        ref={imageInputRef}
                        required
                        onChange={(e) => setImageFile(e.target.files[0])}
                        accept="image/*"
                        className="file:hidden border border-apple-border-light dark:border-apple-border-dark p-2 rounded-xl" 
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="font-semibold text-apple-text-secondary-light">Transparent Overlay PNG</label>
                      <input 
                        type="file" 
                        ref={garmentInputRef}
                        required
                        onChange={(e) => setGarmentFile(e.target.files[0])}
                        accept="image/png"
                        className="file:hidden border border-apple-border-light dark:border-apple-border-dark p-2 rounded-xl" 
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={submittingProduct}
                    className="w-full mt-4 py-3 rounded-full bg-apple-accent text-white font-medium hover:bg-apple-accent/90 shadow disabled:opacity-50"
                  >
                    {submittingProduct ? 'Creating...' : 'Register Garment Product'}
                  </button>
                </form>
              </div>

              {/* Active products table list */}
              <div className="lg:col-span-7 overflow-x-auto rounded-[24px] border border-apple-border-light dark:border-apple-border-dark bg-white dark:bg-[#1b1b1c] shadow-premium">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-apple-border-light bg-apple-bg-light dark:bg-black/15 text-apple-text-secondary-light font-bold uppercase tracking-wider">
                      <th className="p-3">Item</th>
                      <th className="p-3">Gender</th>
                      <th className="p-3">Price</th>
                      <th className="p-3 text-right">Delete</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-apple-border-light/40 text-apple-text-primary-light dark:text-apple-text-primary-dark">
                    {productsList.map((prod) => (
                      <tr key={prod.id} className="hover:bg-black/[0.01]">
                        <td className="p-3 flex items-center gap-2">
                          <img src={window.getMediaUrl(prod.image_url)} alt="thumbnail" className="h-8 w-8 rounded object-cover" />
                          <span className="font-semibold leading-none">{prod.name}</span>
                        </td>
                        <td className="p-3">{prod.gender}</td>
                        <td className="p-3 font-semibold">₹{prod.price.toFixed(2)}</td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => handleProductDelete(prod.id)}
                            className="p-1 rounded text-red-500 hover:bg-red-550/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

            </div>
          )}

          {/* TAB 4: Systems Logs */}
          {activeTab === 'logs' && (
            <div className="flex flex-col gap-6">
              
              {/* Hardware diagnostics */}
              {systemInfo && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  
                  <div className="p-5 rounded-2xl bg-white dark:bg-[#1b1b1c] border border-apple-border-light dark:border-apple-border-dark flex items-center gap-4 shadow-premium">
                    <Cpu className="h-8 w-8 text-apple-accent" />
                    <div>
                      <span className="text-[10px] font-bold uppercase text-apple-text-secondary-light">CPU Load</span>
                      <span className="text-xl font-bold block text-apple-text-primary-light dark:text-apple-text-primary-dark">{systemInfo.cpu_percent}%</span>
                    </div>
                  </div>

                  <div className="p-5 rounded-2xl bg-white dark:bg-[#1b1b1c] border border-apple-border-light dark:border-apple-border-dark flex items-center gap-4 shadow-premium">
                    <HardDrive className="h-8 w-8 text-purple-500" />
                    <div>
                      <span className="text-[10px] font-bold uppercase text-apple-text-secondary-light">RAM Occupancy</span>
                      <span className="text-xl font-bold block text-apple-text-primary-light dark:text-apple-text-primary-dark">{systemInfo.memory_percent}%</span>
                    </div>
                  </div>

                  <div className="p-5 rounded-2xl bg-white dark:bg-[#1b1b1c] border border-apple-border-light dark:border-apple-border-dark flex items-center gap-4 shadow-premium">
                    <ShieldAlert className="h-8 w-8 text-green-500" />
                    <div>
                      <span className="text-[10px] font-bold uppercase text-apple-text-secondary-light">Security Vault</span>
                      <span className="text-xl font-bold block text-green-500">Active</span>
                    </div>
                  </div>

                </div>
              )}

              {/* Logs output terminal console */}
              <div className="p-6 rounded-[24px] bg-[#0c0c0e] text-[#a9b1d6] font-mono text-xs flex flex-col gap-2.5 shadow-2xl border border-white/5">
                <div className="flex justify-between items-center text-[10px] text-zinc-500 pb-2 border-b border-zinc-800">
                  <span>AURASTYLE SERVER MONITOR</span>
                  <span className="text-green-500">SYS_RUNNING</span>
                </div>
                <div className="flex flex-col gap-2 pt-2">
                  {logsData.map((log, i) => (
                    <div key={i} className="flex gap-2">
                      <span className="text-zinc-600">[{new Date().toLocaleTimeString()}]</span>
                      <span>{log}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

        </div>
      )}

    </div>
  );
}
