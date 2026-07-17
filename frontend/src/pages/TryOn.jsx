import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Upload, Sparkles, AlertCircle, Download, ArrowLeft, ArrowRight, RotateCw, RefreshCw, ZoomIn, Sliders, ChevronDown, CheckCircle2, Camera, Palette, Image, Sun, Coffee, Shirt, FolderHeart, Share2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function TryOn() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fileInputRef = useRef(null);

  // Core Data State
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [activeProductId, setActiveProductId] = useState(null);
  const [productsList, setProductsList] = useState([]);
  const [userImagePath, setUserImagePath] = useState('');
  const [userImageUrl, setUserImageUrl] = useState('');
  const [resultImageUrl, setResultImageUrl] = useState('');
  const [layersConfig, setLayersConfig] = useState({});
  const [autoAlign, setAutoAlign] = useState(true);

  // Helper getters for currently focused layer configuration
  const activeLayer = layersConfig[activeProductId] || { scale: 1.0, rotation: 0, offsetX: 0, offsetY: 0 };
  const scale = activeLayer.scale;
  const rotation = activeLayer.rotation;
  const offsetX = activeLayer.offsetX;
  const offsetY = activeLayer.offsetY;

  // Helper setters for active layer updates
  const updateLayerConfig = (key, val) => {
    if (!activeProductId) return;
    setResultImageUrl(''); // Revert to editor view to show real-time changes
    setLayersConfig(prev => ({
      ...prev,
      [activeProductId]: {
        ...(prev[activeProductId] || { scale: 1.0, rotation: 0, offsetX: 0, offsetY: 0 }),
        [key]: val
      }
    }));
  };

  const setScale = (val) => updateLayerConfig('scale', val);
  const setRotation = (val) => updateLayerConfig('rotation', val);
  const setOffsetX = (val) => updateLayerConfig('offsetX', val);
  const setOffsetY = (val) => updateLayerConfig('offsetY', val);
  // UI Status
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [generatingResult, setGeneratingResult] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [skinAnalysis, setSkinAnalysis] = useState(null);
  const [bgPreset, setBgPreset] = useState('original');

  // Canvas interaction
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);

  // Webcam Camera State
  const [cameraActive, setCameraActive] = useState(false);
  const [stream, setStream] = useState(null);
  const videoRef = useRef(null);

  // Clean up camera stream on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  const startCamera = async () => {
    try {
      setErrorMsg('');
      setFeedbackMsg('');
      setResultImageUrl('');
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 }
      });
      setStream(mediaStream);
      setCameraActive(true);
      // Wait for React to render the video element, then assign stream
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      }, 100);
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to access webcam camera. Please check browser permissions.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setCameraActive(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    // Mirror the capture for natural pose mapping
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(async (blob) => {
      if (!blob) return setErrorMsg('Failed to capture frame from webcam.');

      const file = new File([blob], "webcam_capture.png", { type: "image/png" });
      const formData = new FormData();
      formData.append('image', file);

      setUploadingImage(true);
      setErrorMsg('');
      setFeedbackMsg('');
      stopCamera();

      try {
        const res = await axios.post('/api/tryon/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        setUserImagePath(res.data.user_image_path);
        setUserImageUrl(window.getMediaUrl(res.data.user_image_url));
        setSkinAnalysis(res.data.skin_analysis || null);
        if (res.data.detection) {
          setFeedbackMsg('Snapshot detected!');
        }
      } catch (err) {
        console.error(err);
        setErrorMsg(err.response?.data?.message || 'Failed to upload webcam snap.');
      } finally {
        setUploadingImage(false);
      }
    }, 'image/png');
  };

  // Redirect if not signed in
  useEffect(() => {
    if (!user) {
      navigate('/login', { state: { from: { pathname: '/tryon' } } });
    }
  }, [user, navigate]);

  const handleAddProductLayer = (productId) => {
    const matched = productsList.find(p => p.id === productId);
    if (!matched) return;

    // If already layered, make it active
    if (selectedProducts.some(p => p.id === productId)) {
      setActiveProductId(productId);
      return;
    }

    setSelectedProducts(prev => [...prev, matched]);
    setActiveProductId(productId);
    setLayersConfig(prev => ({
      ...prev,
      [productId]: {
        scale: matched.gender.toLowerCase() === 'accessories' ? 0.8 : 1.0,
        rotation: 0,
        offsetX: 0,
        offsetY: matched.gender.toLowerCase() === 'accessories' ? -120 : 0
      }
    }));
    setResultImageUrl('');
  };

  const handleRemoveProductLayer = (productId) => {
    setSelectedProducts(prev => prev.filter(p => p.id !== productId));
    if (activeProductId === productId) {
      const remaining = selectedProducts.filter(p => p.id !== productId);
      setActiveProductId(remaining.length > 0 ? remaining[0].id : null);
    }
    setResultImageUrl('');
  };

  // Load products list for drawer dropdown
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const res = await axios.get('/api/products?limit=50');
        setProductsList(res.data.products);

        // Auto select product if parameter exists in query URL
        const pId = searchParams.get('product_id');
        if (pId) {
          const matched = res.data.products.find(p => p.id === parseInt(pId));
          if (matched) {
            setSelectedProducts([matched]);
            setActiveProductId(matched.id);
            setLayersConfig({
              [matched.id]: {
                scale: matched.gender.toLowerCase() === 'accessories' ? 0.8 : 1.0,
                rotation: 0,
                offsetX: 0,
                offsetY: matched.gender.toLowerCase() === 'accessories' ? -120 : 0
              }
            });
          }
        }
      } catch (err) {
        console.error("Error loading products catalog:", err);
      } finally {
        setLoadingProducts(false);
      }
    };
    loadProducts();
  }, [searchParams, productsList.length]);
  // Auto-load saved wardrobe looks from URL parameters
  useEffect(() => {
    const lookId = searchParams.get('load_look_id');
    if (lookId) {
      try {
        const looks = JSON.parse(localStorage.getItem('udupu_saved_looks') || '[]');
        const matched = looks.find(l => l.id === lookId);
        if (matched) {
          setUserImageUrl(matched.userImageUrl);
          setUserImagePath(matched.userImagePath);
          setSelectedProducts(matched.selectedProducts);
          setLayersConfig(matched.layersConfig);
          if (matched.selectedProducts.length > 0) {
            setActiveProductId(matched.selectedProducts[0].id);
          }
          setFeedbackMsg('Restored outfit configuration from Virtual Wardrobe!');
        }
      } catch (err) {
        console.error("Error loading saved look:", err);
      }
    }
  }, [searchParams]);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    setUploadingImage(true);
    setErrorMsg('');
    setFeedbackMsg('');
    setResultImageUrl('');

    try {
      const res = await axios.post('/api/tryon/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setUserImagePath(res.data.user_image_path);
      setUserImageUrl(window.getMediaUrl(res.data.user_image_url));
      setSkinAnalysis(res.data.skin_analysis || null);

      // Auto-set transform parameters if body detected
      if (res.data.detection) {
        setFeedbackMsg('Photo uploaded successfully!');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.message || 'Failed to upload user image.');
    } finally {
      setUploadingImage(false);
    }
  };

  // Drag Overlay Controls
  const handleMouseDown = (e) => {
    if (generatingResult || !activeProductId) return;
    setIsDragging(true);
    setDragStart({
      x: e.clientX - offsetX,
      y: e.clientY - offsetY
    });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setOffsetX(e.clientX - dragStart.x);
    setOffsetY(e.clientY - dragStart.y);
    setAutoAlign(false); // Manual adjustments override AI auto-align
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleResetTransforms = () => {
    if (!activeProductId) return;
    const matched = selectedProducts.find(p => p.id === activeProductId);
    const isAccessory = matched?.gender?.toLowerCase() === 'accessories';
    setLayersConfig(prev => ({
      ...prev,
      [activeProductId]: {
        scale: isAccessory ? 0.8 : 1.0,
        rotation: 0,
        offsetX: 0,
        offsetY: isAccessory ? -120 : 0
      }
    }));
    setAutoAlign(true);
    setResultImageUrl('');
    setErrorMsg('');
  };

  const handleGenerateTryOn = async () => {
    if (!userImagePath) {
      return setErrorMsg('Please upload your photo first.');
    }
    if (selectedProducts.length === 0) {
      return setErrorMsg('Please select at least one garment from the catalog.');
    }

    setGeneratingResult(true);
    setErrorMsg('');
    setFeedbackMsg('');

    try {
      const garmentsPayload = selectedProducts.map(p => {
        const conf = layersConfig[p.id] || { scale: 1.0, rotation: 0, offsetX: 0, offsetY: 0 };
        return {
          product_id: p.id,
          scale: conf.scale,
          rotation: conf.rotation,
          offset_x: conf.offsetX,
          offset_y: conf.offsetY
        };
      });

      const res = await axios.post('/api/tryon/generate', {
        user_image_path: userImagePath,
        auto_align: autoAlign,
        garments: garmentsPayload,
        background_preset: bgPreset
      });

      setResultImageUrl(window.getMediaUrl(res.data.result_image_url));
      setFeedbackMsg('Fitting generated successfully!');
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.message || 'Error compositing overlay.');
    } finally {
      setGeneratingResult(false);
    }
  };

  const handleDownload = () => {
    if (!resultImageUrl) return;
    const link = document.createElement('a');
    link.href = resultImageUrl;
    const primaryName = selectedProducts[0]?.name.replace(/\s+/g, '_') || 'result';
    link.download = `UdupuFit_${primaryName}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSaveOutfit = () => {
    try {
      const savedLooks = JSON.parse(localStorage.getItem('udupu_saved_looks') || '[]');
      const newLook = {
        id: 'look_' + Date.now(),
        timestamp: new Date().toISOString(),
        userImageUrl,
        userImagePath,
        resultImageUrl,
        layersConfig: { ...layersConfig },
        selectedProducts: [ ...selectedProducts ]
      };
      localStorage.setItem('udupu_saved_looks', JSON.stringify([newLook, ...savedLooks]));
      setFeedbackMsg('Outfit successfully saved to your Virtual Wardrobe!');
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to save outfit.');
    }
  };

  const handleDownloadPolaroid = () => {
    if (!resultImageUrl) return;
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.src = resultImageUrl;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const padding = 24;
      const bottomSpace = 110;
      canvas.width = img.naturalWidth + padding * 2;
      canvas.height = img.naturalHeight + padding + bottomSpace;
      
      // Background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Inner Border
      ctx.fillStyle = '#f3f4f6';
      ctx.fillRect(padding - 2, padding - 2, img.naturalWidth + 4, img.naturalHeight + 4);
      
      // Photo
      ctx.drawImage(img, padding, padding);
      
      // Caption Text
      ctx.fillStyle = '#111827';
      ctx.font = 'bold 24px -apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('UDUPU VIRTUAL LOOKBOOK', canvas.width / 2, img.naturalHeight + padding + 48);
      
      // Subtitle Date
      ctx.fillStyle = '#6b7280';
      ctx.font = '14px -apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif';
      ctx.fillText(new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }), canvas.width / 2, img.naturalHeight + padding + 76);
      
      const link = document.createElement('a');
      link.download = `udupu-lookbook-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setFeedbackMsg('Polaroid Card generated and downloaded!');
    };
    img.onerror = () => {
      setErrorMsg('Failed to process card export.');
    };
  };

  return (
    <div className="max-w-7xl mx-auto px-6 pt-20 pb-10 flex flex-col gap-8 w-full transition-colors duration-300">

      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-apple-text-primary-light dark:text-apple-text-primary-dark">Virtual Fitting Room</h1>
        <p className="text-sm text-apple-text-secondary-light dark:text-apple-text-secondary-dark mt-1">
          Adjust overlays manually inside the workspace, then trigger high-quality server blending.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

        {/* Left Side: Clothes Picker Dropdown & Upload Card */}
        <div className="lg:col-span-4 flex flex-col gap-6">

          {/* Step 1: Upload */}
          <div className="p-6 rounded-[24px] bg-white dark:bg-[#1b1b1c] border border-apple-border-light dark:border-apple-border-dark flex flex-col gap-4">
            <span className="text-xs font-bold uppercase tracking-wider text-apple-text-secondary-light dark:text-apple-text-secondary-dark">1. Upload Portrait</span>

            {userImageUrl ? (
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between p-3.5 rounded-xl border border-apple-border-light dark:border-apple-border-dark">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg overflow-hidden border border-apple-border-light">
                      <img src={userImageUrl} alt="Model upload" className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <span className="text-xs font-semibold block text-apple-text-primary-light dark:text-apple-text-primary-dark">Portrait Loaded</span>
                      <span className="text-[10px] text-green-500">Auto-align active</span>
                    </div>
                  </div>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs font-semibold text-apple-accent hover:underline"
                  >
                    Change
                  </button>
                </div>

                {skinAnalysis && (
                  <div className="p-3.5 rounded-2xl bg-gradient-to-r from-purple-500/10 to-indigo-500/10 border border-indigo-500/25 text-xs flex flex-col gap-1 animate-fade-in">
                    <span className="font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1 uppercase tracking-wider text-[9px]">
                      <Sparkles className="h-3 w-3 text-indigo-500" /> AI Undertone Advisor
                    </span>
                    <div className="text-apple-text-primary-light dark:text-apple-text-primary-dark font-medium leading-relaxed">
                      Undertone: <strong className="text-indigo-600 dark:text-indigo-400">{skinAnalysis.undertone}</strong> ({skinAnalysis.palette})
                    </div>
                    <div className="text-apple-text-secondary-light dark:text-apple-text-secondary-dark text-[10px]">
                      Recommended: {skinAnalysis.recommended_colors.join(', ')}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border border-dashed border-apple-border-light dark:border-apple-border-dark rounded-2xl p-8 flex flex-col items-center justify-center gap-3 bg-apple-bg-light/40 dark:bg-apple-bg-dark/40 cursor-pointer hover:bg-black/[0.02] transition-colors"
                >
                  <div className="h-10 w-10 rounded-full bg-apple-accent/10 flex items-center justify-center text-apple-accent">
                    <Upload className="h-5 w-5" />
                  </div>
                  <div className="text-center">
                    <span className="text-xs font-semibold block text-apple-text-primary-light dark:text-apple-text-primary-dark">Upload photo</span>
                    <span className="text-[10px] text-apple-text-secondary-light dark:text-apple-text-secondary-dark mt-0.5 block">JPEG, PNG, WEBP</span>
                  </div>
                </div>

                <div className="text-center text-[10px] text-apple-text-secondary-light uppercase font-bold tracking-widest my-1">Or</div>

                {cameraActive ? (
                  <button
                    onClick={stopCamera}
                    className="w-full py-2.5 rounded-xl border border-red-500/30 text-red-500 bg-red-500/5 hover:bg-red-500/10 text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <Camera className="h-4 w-4 animate-pulse" /> Stop Webcam
                  </button>
                ) : (
                  <button
                    onClick={startCamera}
                    className="w-full py-2.5 rounded-xl border border-apple-accent/30 text-apple-accent bg-apple-accent/5 hover:bg-apple-accent/10 text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <Camera className="h-4 w-4" /> Use Live Camera
                  </button>
                )}
              </div>
            )}

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              className="hidden"
              accept="image/*"
            />
          </div>

          {/* Step 2: Choose Garment */}
          <div className="p-6 rounded-[24px] bg-white dark:bg-[#1b1b1c] border border-apple-border-light dark:border-apple-border-dark flex flex-col gap-4">
            <span className="text-xs font-bold uppercase tracking-wider text-apple-text-secondary-light dark:text-apple-text-secondary-dark">2. Select Garment</span>

            {loadingProducts ? (
              <div className="h-10 rounded-xl bg-neutral-200 dark:bg-neutral-800 animate-pulse" />
            ) : (
              <div className="flex flex-col gap-3">
                <div className="relative w-full">
                  <select
                    value=""
                    onChange={(e) => {
                      if (e.target.value) {
                        handleAddProductLayer(parseInt(e.target.value));
                      }
                    }}
                    className="w-full appearance-none pr-10 px-3.5 py-2.5 rounded-xl border border-apple-border-light dark:border-apple-border-dark bg-white/40 dark:bg-black/20 text-apple-text-primary-light dark:text-apple-text-primary-dark focus:outline-none focus:ring-1 focus:ring-apple-accent focus:border-apple-accent text-sm font-medium transition-all cursor-pointer"
                  >
                    <option value="">-- Add Layer / Garment --</option>
                    {productsList.map(p => (
                      <option key={p.id} value={p.id}>{p.name} (₹{p.price})</option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-apple-text-secondary-light">
                    <ChevronDown className="h-4 w-4" />
                  </div>
                </div>

                {/* Display layered items badge list */}
                {selectedProducts.length > 0 && (
                  <div className="flex flex-col gap-2 mt-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-apple-text-secondary-light dark:text-apple-text-secondary-dark">
                      Closet Layers (Click to Edit)
                    </span>
                    <div className="flex flex-col gap-1.5">
                      {selectedProducts.map(p => {
                        const isFocused = p.id === activeProductId;
                        return (
                          <div
                            key={p.id}
                            onClick={() => setActiveProductId(p.id)}
                            className={`p-2 rounded-lg border text-xs font-semibold flex items-center justify-between cursor-pointer transition-all ${isFocused
                                ? 'bg-apple-accent/15 border-apple-accent text-apple-accent shadow-sm'
                                : 'bg-white/40 dark:bg-black/20 border-apple-border-light dark:border-apple-border-dark text-apple-text-primary-light dark:text-apple-text-primary-dark hover:bg-black/[0.02]'
                              }`}
                          >
                            <div className="flex items-center gap-2">
                              <img src={window.getMediaUrl(p.image_url)} alt="" className="h-6 w-6 rounded object-cover" />
                              <span className="truncate max-w-[140px]">{p.name}</span>
                            </div>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveProductLayer(p.id);
                              }}
                              className="text-[10px] text-red-500 font-bold bg-transparent border-0 cursor-pointer hover:underline p-1"
                            >
                              Remove
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Step 3: Action & Fine-Tuning controls */}
          <div className="p-6 rounded-[24px] bg-white dark:bg-[#1b1b1c] border border-apple-border-light dark:border-apple-border-dark flex flex-col gap-4">
            <span className="text-xs font-bold uppercase tracking-wider text-apple-text-secondary-light dark:text-apple-text-secondary-dark">
              3. Fine-tuning
            </span>

            {!activeProductId && (
              <div className="p-3 text-[10px] leading-relaxed text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                No active garment selected. Choose a garment from the catalog list in Step 2 or click directly on a layer in the canvas workspace.
              </div>
            )}

            {/* Scale Slider */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between text-xs font-semibold text-apple-text-primary-light dark:text-apple-text-primary-dark">
                <span>Scale</span>
                <span>{scale.toFixed(2)}x</span>
              </div>
              <input
                type="range"
                min="0.3"
                max="2.5"
                step="0.05"
                value={scale}
                disabled={!activeProductId}
                onChange={(e) => {
                  setScale(parseFloat(e.target.value));
                  setAutoAlign(false);
                }}
                className="w-full accent-apple-accent cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              />
            </div>

            {/* Rotation Slider */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between text-xs font-semibold text-apple-text-primary-light dark:text-apple-text-primary-dark">
                <span>Rotation</span>
                <span>{rotation}°</span>
              </div>
              <input
                type="range"
                min="-180"
                max="180"
                step="5"
                value={rotation}
                disabled={!activeProductId}
                onChange={(e) => {
                  setRotation(parseInt(e.target.value));
                  setAutoAlign(false);
                }}
                className="w-full accent-apple-accent cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              />
            </div>

            {/* Offset Info / Manual reset buttons */}
            <div className="grid grid-cols-2 gap-3 text-xs text-apple-text-secondary-light dark:text-apple-text-secondary-dark">
              <div className="p-2.5 rounded-lg border border-apple-border-light dark:border-apple-border-dark text-center">
                <span className="block text-[10px] uppercase font-bold text-neutral-400">Offset X</span>
                <span className="font-semibold text-apple-text-primary-light dark:text-apple-text-primary-dark">{offsetX}px</span>
              </div>
              <div className="p-2.5 rounded-lg border border-apple-border-light dark:border-apple-border-dark text-center">
                <span className="block text-[10px] uppercase font-bold text-neutral-400">Offset Y</span>
                <span className="font-semibold text-apple-text-primary-light dark:text-apple-text-primary-dark">{offsetY}px</span>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-apple-border-light/40 dark:border-apple-border-dark/40 pt-3 mt-1">
              <label className="flex items-center gap-2 text-xs font-semibold text-apple-text-primary-light dark:text-apple-text-primary-dark cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoAlign}
                  onChange={(e) => {
                    setAutoAlign(e.target.checked);
                    setResultImageUrl('');
                  }}
                  className="rounded text-apple-accent focus:ring-apple-accent h-4 w-4"
                />
                <span>Auto-Align Shoulders</span>
              </label>
              <button
                onClick={handleResetTransforms}
                className="text-[11px] font-semibold text-red-500 hover:underline flex items-center gap-1"
              >
                <RefreshCw className="h-3 w-3" /> Reset
              </button>
            </div>

            <button
              onClick={handleGenerateTryOn}
              disabled={generatingResult || uploadingImage || !userImagePath || selectedProducts.length === 0}
              className="w-full mt-4 py-3 disabled:opacity-55 disabled:cursor-not-allowed flex items-center justify-center gap-2 apple-btn-primary animate-pulse"
            >
              {generatingResult ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Fitting garment onto body...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>Try On Now (Auto-Fit)</span>
                </>
              )}
            </button>
          </div>

          {/* Step 4: Lookbook Background */}
          <div className="p-6 rounded-[24px] bg-white dark:bg-[#1b1b1c] border border-apple-border-light dark:border-apple-border-dark flex flex-col gap-4">
            <span className="text-xs font-bold uppercase tracking-wider text-apple-text-secondary-light dark:text-apple-text-secondary-dark">
              4. Lookbook Backdrop
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {[
                { id: 'original', name: 'Original Photo', icon: <Image className="h-4 w-4" /> },
                { id: 'studio', name: 'Studio Gradient', icon: <Camera className="h-4 w-4" /> },
                { id: 'beach', name: 'Sunset Beach', icon: <Sun className="h-4 w-4" /> },
                { id: 'cafe', name: 'Espresso Cafe', icon: <Coffee className="h-4 w-4" /> }
              ].map(bg => {
                const selected = bgPreset === bg.id;
                return (
                  <button
                    key={bg.id}
                    onClick={() => {
                      setBgPreset(bg.id);
                      setResultImageUrl('');
                    }}
                    className={`p-3.5 rounded-xl border flex flex-col items-center gap-1.5 cursor-pointer transition-all active:scale-95 font-semibold text-center ${selected
                        ? 'bg-apple-accent/15 border-apple-accent text-apple-accent shadow-sm'
                        : 'bg-white/40 dark:bg-black/20 border-apple-border-light dark:border-apple-border-dark text-apple-text-primary-light dark:text-apple-text-primary-dark hover:bg-black/[0.02]'
                      }`}
                  >
                    <div className={selected ? 'text-apple-accent' : 'text-apple-text-secondary-light'}>
                      {bg.icon}
                    </div>
                    <span className="text-[10px] leading-tight">{bg.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

        </div>

        {/* Right Side: Visual Canvas View */}
        <div className="lg:col-span-8 flex flex-col gap-6">

          {/* Status Indicators */}
          {errorMsg && (
            <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm flex items-center gap-2.5">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {feedbackMsg && (
            <div className="p-4 rounded-2xl bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 text-sm flex items-center gap-2.5">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{feedbackMsg}</span>
            </div>
          )}

          {/* Interactive Workspace Canvas */}
          <div className="w-full border border-apple-border-light dark:border-apple-border-dark rounded-[32px] overflow-hidden bg-apple-bg-light dark:bg-black/40 flex flex-col items-center justify-center relative min-h-[500px] lg:min-h-[600px] shadow-inner transition-colors duration-300">

            {resultImageUrl ? (
              // Display High-res generated server output
              <div className="w-full h-full flex flex-col items-center justify-center p-6 gap-4">
                    <div className="relative max-w-full max-h-[500px] rounded-2xl overflow-hidden shadow-2xl border border-apple-border-light dark:border-apple-border-dark bg-white dark:bg-neutral-900">
                  <img src={resultImageUrl} alt="Try-on output" className="max-w-full max-h-[480px] object-contain" />
                  <span className="absolute bottom-4 right-4 bg-green-500 text-white text-xs font-semibold px-3 py-1 rounded-full shadow-lg">
                    OpenCV Composite
                  </span>
                </div>
                <div className="flex flex-wrap gap-3 justify-center">
                  <button
                    onClick={handleDownload}
                    className="px-4 py-2 flex items-center gap-1.5 text-xs font-semibold apple-btn-primary cursor-pointer border-0"
                  >
                    <Download className="h-3.5 w-3.5" /> Download Fit
                  </button>
                  <button
                    onClick={handleDownloadPolaroid}
                    className="px-4 py-2 flex items-center gap-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow transition-colors border-0 cursor-pointer"
                  >
                    <Share2 className="h-3.5 w-3.5" /> Polaroid Card
                  </button>
                  <button
                    onClick={handleSaveOutfit}
                    className="px-4 py-2 flex items-center gap-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow transition-colors border-0 cursor-pointer"
                  >
                    <FolderHeart className="h-3.5 w-3.5" /> Save Look
                  </button>
                  <button
                    onClick={() => setResultImageUrl('')}
                    className="px-4 py-2 text-xs font-semibold apple-btn-secondary cursor-pointer border-0"
                  >
                    Adjust More
                  </button>
                </div>
              </div>
            ) : userImageUrl ? (
              <>
                {/* Display Visual Sandbox Editor Canvas */}
                <div
                  ref={containerRef}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  className="relative w-full max-w-[400px] aspect-[4/5] overflow-hidden select-none border border-apple-border-light/60 bg-white dark:bg-neutral-900 rounded-3xl shadow-xl flex items-center justify-center"
                >
                  {/* Background uploaded photo */}
                  <img
                    src={userImageUrl}
                    alt="Backdrop user model"
                    className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                  />

                  {/* Overlay Transparent Garment PNGs (interactive layers) */}
                  {selectedProducts.map(p => {
                    const conf = layersConfig[p.id] || { scale: 1.0, rotation: 0, offsetX: 0, offsetY: 0 };
                    const isFocused = p.id === activeProductId;
                    return (
                      <img
                        key={p.id}
                        src={window.getMediaUrl(p.garment_url)}
                        alt="Garment overlay layer"
                        onMouseDown={(e) => {
                          setActiveProductId(p.id);
                          setTimeout(() => handleMouseDown(e), 0);
                        }}
                        style={{
                          position: 'absolute',
                          width: p.gender.toLowerCase() === 'accessories' ? '45%' : '60%',
                          transform: `translate(${conf.offsetX}px, ${conf.offsetY}px) scale(${conf.scale}) rotate(${conf.rotation}deg)`,
                          cursor: isDragging && isFocused ? 'grabbing' : 'grab',
                          userSelect: 'none',
                          transition: isDragging && isFocused ? 'none' : 'transform 0.1s ease-out',
                          zIndex: isFocused ? 30 : 20
                        }}
                        className={`object-contain ${isFocused
                            ? 'active-outline ring-2 ring-apple-accent border-apple-accent'
                            : 'opacity-85 hover:opacity-100 hover:ring-1 hover:ring-neutral-400'
                          }`}
                      />
                    );
                  })}

                  {/* Instruction overlay badge */}
                  <div className="absolute bottom-4 left-4 right-4 text-center text-[10px] text-white bg-black/60 backdrop-blur px-3 py-2 rounded-xl z-40">
                    {selectedProducts.length > 0 ? 'Click overlay to edit. Drag/scale, then click "Try On Now (Auto-Fit)".' : 'Select garment from catalog list to begin overlays.'}
                  </div>
                </div>

                {/* Responsive Inline Button Controls */}
                <div className="w-full max-w-[400px] flex flex-col gap-3 mt-4">
                  <div className="flex justify-between items-center text-xs">
                    <label className="flex items-center gap-2 font-semibold text-apple-text-primary-light dark:text-apple-text-primary-dark cursor-pointer">
                      <input
                        type="checkbox"
                        checked={autoAlign}
                        onChange={(e) => {
                          setAutoAlign(e.target.checked);
                          setResultImageUrl('');
                        }}
                        className="rounded text-apple-accent focus:ring-apple-accent h-4 w-4"
                      />
                      <span>Auto-Align Shoulders (OpenCV)</span>
                    </label>

                    <button
                      onClick={handleResetTransforms}
                      className="font-semibold text-red-500 hover:underline flex items-center gap-1 bg-transparent border-0 cursor-pointer p-0"
                    >
                      <RefreshCw className="h-3 w-3" /> Reset
                    </button>
                  </div>

                  <button
                    onClick={handleGenerateTryOn}
                    disabled={generatingResult || uploadingImage || !userImagePath || selectedProducts.length === 0}
                    className="w-full py-3 disabled:opacity-55 disabled:cursor-not-allowed flex items-center justify-center gap-2 apple-btn-primary animate-pulse"
                  >
                    {generatingResult ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        <span>Fitting garment onto body...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        <span>Try On Now (Auto-Fit)</span>
                      </>
                    )}
                  </button>
                </div>
              </>
            ) : cameraActive ? (
              <div className="relative w-full max-w-[400px] aspect-[4/5] overflow-hidden select-none border border-apple-border-light/60 bg-black rounded-3xl shadow-xl flex items-center justify-center">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="absolute inset-0 w-full h-full object-cover scale-x-[-1]"
                />

                {/* Camera controls overlay */}
                <div className="absolute bottom-4 left-4 right-4 flex justify-center gap-3">
                  <button
                    onClick={capturePhoto}
                    className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-full text-xs font-semibold shadow-lg flex items-center gap-1.5 animate-pulse cursor-pointer border-0"
                  >
                    <Camera className="h-4 w-4" /> Capture Photo
                  </button>
                  <button
                    onClick={stopCamera}
                    className="px-6 py-2.5 bg-neutral-800 hover:bg-neutral-900 text-white rounded-full text-xs font-semibold shadow-lg cursor-pointer border-0"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              // Empty Sandbox display
              <div className="flex flex-col items-center gap-4 text-apple-text-secondary-light dark:text-apple-text-secondary-dark p-12 text-center max-w-sm">
                <Shirt className="h-12 w-12 text-apple-accent/40 animate-pulse" />
                <h3 className="text-lg font-bold text-apple-text-primary-light dark:text-apple-text-primary-dark">Sandbox Workspace</h3>
                <p className="text-sm text-apple-text-secondary-light leading-relaxed">
                  Upload a model photo and select garments to open the interactive try-on sandbox designer canvas.
                </p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-2 px-6 py-2.5 rounded-full bg-apple-accent text-white font-medium hover:bg-apple-accent/90 shadow text-xs flex items-center gap-1.5"
                >
                  <Upload className="h-3.5 w-3.5" /> Upload Photo
                </button>
              </div>
            )}

          </div>

        </div>

      </div>

    </div>
  );
}
