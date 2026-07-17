import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Shirt, Sparkles, Sliders, ShieldCheck, HelpCircle, ArrowRight, Star, MessageSquare } from 'lucide-react';

export default function Landing() {
  const [activeFaq, setActiveFaq] = useState(null);
  const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' });
  const [contactSubmitted, setContactSubmitted] = useState(false);

  const features = [
    {
      icon: Shirt,
      title: 'Interactive Try-On',
      desc: 'Upload your photo and drag, scale, or rotate garments dynamically. Preview exactly how you look instantly.',
    },
    {
      icon: Sparkles,
      title: 'Smart Styling Engine',
      desc: 'Get tailored outfit combinations based on body shapes, occasions, season climates, and coordination rules.',
    },
    {
      icon: Sliders,
      title: 'Precise Local Compositing',
      desc: 'Powered entirely by local OpenCV algorithms. No cloud processing, ensuring complete file privacy.',
    },
    {
      icon: ShieldCheck,
      title: 'Enterprise Security',
      desc: 'Industry standard JWT secure tokens, input sanitization, and session encryption protecting your records.',
    },
  ];

  const stats = [
    { num: '99.4%', label: 'Compositing Precision' },
    { num: '150+', label: 'Design Styles' },
    { num: '0ms', label: 'External API Wait' },
  ];

  const testimonials = [
    {
      name: 'Sarah Jenkins',
      role: 'Fashion Designer',
      quote: 'The drag-and-scale controls make this virtual room incredibly usable. Best of all, my upload history is completely private.',
      stars: 5,
    },
    {
      name: 'Michael Chen',
      role: 'Retail Buyer',
      quote: 'The rule recommender suggested outfits for my wedding and office event that matched my triangle body structure perfectly.',
      stars: 5,
    },
  ];

  const faqs = [
    {
      q: 'How does the Virtual Try-On work?',
      a: 'After you upload a model photo, our local OpenCV backend uses face and upper body detection algorithms to estimate target garment sizes. You can then use the manual overlay controls to resize, shift, and angle clothes for a custom alignment.'
    },
    {
      q: 'Is my uploaded data safe?',
      a: 'Yes, absolutely. Unlike other platforms that upload photos to external third-party cloud engines, Udupu compiles all graphics locally on the host machine. Your images are only used for your session.'
    },
    {
      q: 'What parameters does the Recommendation Engine use?',
      a: 'It scans for gender compatibility, climate seasons, style choices, colors, and body silhouettes. It overlays customized styling rules (like Office Formal rules, Wedding Traditional, College Casual) to rank matching outfits.'
    }
  ];

  const handleContactSubmit = (e) => {
    e.preventDefault();
    if (contactForm.name && contactForm.email && contactForm.message) {
      setContactSubmitted(true);
      setContactForm({ name: '', email: '', message: '' });
      setTimeout(() => setContactSubmitted(false), 5000);
    }
  };

  return (
    <div className="flex flex-col gap-24 pb-20 w-full overflow-hidden transition-colors duration-300">
      
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center pt-20 px-6 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center w-full">
          
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="flex flex-col gap-6"
          >
            <span className="text-xs font-semibold uppercase tracking-widest text-apple-accent flex items-center gap-1.5">
              <Sparkles className="h-4 w-4" /> Next-Generation Fitting
            </span>
            <h1 className="text-5xl lg:text-6xl font-bold leading-tight tracking-tight text-apple-text-primary-light dark:text-apple-text-primary-dark">
              Fashion, Reimagined. <br />
              <span className="text-gradient">Fit, Customized.</span>
            </h1>
            <p className="text-lg text-apple-text-secondary-light dark:text-apple-text-secondary-dark leading-relaxed">
              Upload your photo and visually composite premium garments instantly. Run local AI-grade try-on positioning and outfit matchings. No third party servers, no boundaries.
            </p>
            <div className="flex flex-wrap items-center gap-4 mt-2">
              <Link 
                to="/tryon" 
                className="px-8 py-3 rounded-full text-base font-medium bg-apple-accent text-white hover:bg-apple-accent/90 shadow-lg shadow-apple-accent/15 hover:shadow-apple-accent/20 transition-all flex items-center gap-2 transform hover:-translate-y-0.5"
              >
                <span>Try Fitting Room</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link 
                to="/catalog" 
                className="px-8 py-3 rounded-full text-base font-medium border border-apple-border-light dark:border-apple-border-dark text-apple-text-primary-light dark:text-apple-text-primary-dark hover:bg-black/5 dark:hover:bg-white/5 transition-all"
              >
                View Catalog
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.0, delay: 0.2 }}
            className="relative flex justify-center lg:justify-end"
          >
            <div className="relative w-full max-w-[450px] aspect-[4/5] rounded-[32px] overflow-hidden glassmorphism-premium p-6 flex flex-col justify-between">
              
              {/* Graphic background sim */}
              <div className="absolute inset-0 bg-gradient-to-tr from-apple-accent/5 to-purple-500/5 -z-10" />
              
              <div className="flex justify-between items-center w-full">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-red-400" />
                  <div className="h-3 w-3 rounded-full bg-yellow-400" />
                  <div className="h-3 w-3 rounded-full bg-green-400" />
                </div>
                <span className="text-xs text-apple-text-secondary-light dark:text-apple-text-secondary-dark font-mono">opencv_blender.py</span>
              </div>

              {/* Graphic Mockup Area */}
              <div className="my-6 border border-dashed border-apple-border-light dark:border-apple-border-dark rounded-2xl flex-1 flex flex-col items-center justify-center p-4 relative bg-apple-bg-light/40 dark:bg-apple-bg-dark/40 overflow-hidden">
                
                {/* Silhouette model shape */}
                <div className="w-24 h-48 rounded-full bg-zinc-300 dark:bg-zinc-700 opacity-60 flex items-center justify-center relative">
                  <span className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase tracking-widest font-semibold absolute top-4">User Portrait</span>
                </div>

                {/* Overlay T-Shirt element */}
                <motion.div 
                  animate={{ 
                    y: [0, -10, 0],
                    rotate: [0, 2, -2, 0]
                  }}
                  transition={{ 
                    repeat: Infinity,
                    duration: 5,
                    ease: "easeInOut"
                  }}
                  className="absolute w-28 h-28 bg-apple-accent/80 border-2 border-white rounded-lg flex items-center justify-center shadow-lg"
                >
                  <Shirt className="h-10 w-10 text-white" />
                  <span className="absolute bottom-1 right-1 text-[8px] bg-black/40 text-white px-1 rounded">Active overlay</span>
                </motion.div>
                
              </div>

              <div className="flex items-center justify-between text-sm bg-white/50 dark:bg-black/50 p-3 rounded-xl border border-white/20 dark:border-white/5">
                <span className="text-apple-text-secondary-light dark:text-apple-text-secondary-dark">Garment Alignment:</span>
                <span className="text-green-500 font-semibold">Ready</span>
              </div>

            </div>
          </motion.div>

        </div>
      </section>

      {/* Features Grid */}
      <section className="px-6 max-w-7xl mx-auto w-full flex flex-col gap-12">
        <div className="text-center max-w-2xl mx-auto flex flex-col gap-4">
          <h2 className="text-3xl lg:text-4xl font-bold tracking-tight text-apple-text-primary-light dark:text-apple-text-primary-dark">
            Precision design details.
          </h2>
          <p className="text-apple-text-secondary-light dark:text-apple-text-secondary-dark text-base leading-relaxed">
            Every feature is crafted to look premium, response-fluid, and operate with maximum security.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <motion.div
                key={feat.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: idx * 0.1 }}
                className="p-6 rounded-[24px] glassmorphism hover:shadow-premium-hover hover:border-apple-accent/20 transition-all flex flex-col gap-4 group"
              >
                <div className="h-10 w-10 rounded-xl bg-apple-accent/10 dark:bg-apple-accent/20 flex items-center justify-center text-apple-accent group-hover:scale-110 transition-transform">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-semibold text-apple-text-primary-light dark:text-apple-text-primary-dark">{feat.title}</h3>
                <p className="text-sm text-apple-text-secondary-light dark:text-apple-text-secondary-dark leading-relaxed">{feat.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Statistics Section */}
      <section className="bg-white/50 dark:bg-[#111112] py-20 px-6 border-y border-apple-border-light dark:border-apple-border-dark transition-colors duration-300">
        <div className="max-w-7xl mx-auto w-full grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
          {stats.map((stat, idx) => (
            <motion.div 
              key={stat.label}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className="flex flex-col gap-2"
            >
              <span className="text-5xl lg:text-6xl font-bold tracking-tight text-gradient">{stat.num}</span>
              <span className="text-sm font-semibold uppercase tracking-wider text-apple-text-secondary-light dark:text-apple-text-secondary-dark">{stat.label}</span>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="px-6 max-w-7xl mx-auto w-full flex flex-col gap-12">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-3xl lg:text-4xl font-bold tracking-tight text-apple-text-primary-light dark:text-apple-text-primary-dark">What fashion enthusiasts say.</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {testimonials.map((test, idx) => (
            <div key={test.name} className="p-8 rounded-[28px] glassmorphism-premium flex flex-col justify-between gap-6">
              <p className="text-base italic text-apple-text-primary-light dark:text-apple-text-primary-dark leading-relaxed">
                "{test.quote}"
              </p>
              <div className="flex justify-between items-center border-t border-apple-border-light dark:border-apple-border-dark pt-4">
                <div>
                  <h4 className="font-semibold text-apple-text-primary-light dark:text-apple-text-primary-dark">{test.name}</h4>
                  <span className="text-xs text-apple-text-secondary-light dark:text-apple-text-secondary-dark">{test.role}</span>
                </div>
                <div className="flex gap-0.5 text-yellow-400">
                  {[...Array(test.stars)].map((_, i) => <Star key={i} className="h-4 w-4 fill-yellow-400" />)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ Accordions */}
      <section id="faq" className="px-6 max-w-4xl mx-auto w-full flex flex-col gap-12">
        <div className="text-center flex flex-col gap-4">
          <h2 className="text-3xl lg:text-4xl font-bold tracking-tight text-apple-text-primary-light dark:text-apple-text-primary-dark">FAQ</h2>
          <p className="text-apple-text-secondary-light dark:text-apple-text-secondary-dark">Answers to standard platform inquiries.</p>
        </div>

        <div className="flex flex-col gap-4">
          {faqs.map((faq, idx) => {
            const isOpen = activeFaq === idx;
            return (
              <div key={faq.q} className="border border-apple-border-light dark:border-apple-border-dark rounded-[20px] overflow-hidden glassmorphism transition-all">
                <button
                  onClick={() => setActiveFaq(isOpen ? null : idx)}
                  className="w-full text-left px-6 py-5 flex items-center justify-between font-semibold text-apple-text-primary-light dark:text-apple-text-primary-dark text-base hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors"
                >
                  <span>{faq.q}</span>
                  <HelpCircle className={`h-5 w-5 text-apple-accent transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <p className="px-6 pb-6 text-sm leading-relaxed text-apple-text-secondary-light dark:text-apple-text-secondary-dark border-t border-apple-border-light/40 dark:border-apple-border-dark/40 pt-4">
                        {faq.a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="px-6 max-w-3xl mx-auto w-full flex flex-col gap-12">
        <div className="text-center flex flex-col gap-4">
          <h2 className="text-3xl lg:text-4xl font-bold tracking-tight text-apple-text-primary-light dark:text-apple-text-primary-dark">Get in Touch</h2>
          <p className="text-apple-text-secondary-light dark:text-apple-text-secondary-dark">Have questions or recommendations? Drop us a line.</p>
        </div>

        <div className="glassmorphism-premium p-8 rounded-[28px] border border-apple-border-light dark:border-apple-border-dark">
          {contactSubmitted ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-12 flex flex-col items-center gap-4 text-green-600 dark:text-green-400"
            >
              <MessageSquare className="h-12 w-12" />
              <h3 className="text-xl font-bold">Message Sent!</h3>
              <p className="text-sm text-apple-text-secondary-light dark:text-apple-text-secondary-dark">
                Thank you for contacting Udupu. A coordinator will get back to you shortly.
              </p>
            </motion.div>
          ) : (
            <form onSubmit={handleContactSubmit} className="flex flex-col gap-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <label htmlFor="c_name" className="text-xs font-semibold uppercase tracking-wider text-apple-text-secondary-light dark:text-apple-text-secondary-dark">Your Name</label>
                  <input
                    type="text"
                    id="c_name"
                    required
                    value={contactForm.name}
                    onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-apple-border-light dark:border-apple-border-dark bg-transparent text-apple-text-primary-light dark:text-apple-text-primary-dark focus:outline-none focus:border-apple-accent focus:ring-1 focus:ring-apple-accent transition-all"
                    placeholder="Enter your name"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label htmlFor="c_email" className="text-xs font-semibold uppercase tracking-wider text-apple-text-secondary-light dark:text-apple-text-secondary-dark">Email Address</label>
                  <input
                    type="email"
                    id="c_email"
                    required
                    value={contactForm.email}
                    onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-apple-border-light dark:border-apple-border-dark bg-transparent text-apple-text-primary-light dark:text-apple-text-primary-dark focus:outline-none focus:border-apple-accent focus:ring-1 focus:ring-apple-accent transition-all"
                    placeholder="name@example.com"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="c_msg" className="text-xs font-semibold uppercase tracking-wider text-apple-text-secondary-light dark:text-apple-text-secondary-dark">Your Message</label>
                <textarea
                  id="c_msg"
                  required
                  rows={5}
                  value={contactForm.message}
                  onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-apple-border-light dark:border-apple-border-dark bg-transparent text-apple-text-primary-light dark:text-apple-text-primary-dark focus:outline-none focus:border-apple-accent focus:ring-1 focus:ring-apple-accent transition-all"
                  placeholder="How can we help you?"
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 rounded-full bg-apple-accent text-white font-medium hover:bg-apple-accent/90 shadow-md hover:shadow-lg transition-all"
              >
                Send Message
              </button>
            </form>
          )}
        </div>
      </section>

    </div>
  );
}
