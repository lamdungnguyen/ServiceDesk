import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, Users, Zap, MessageSquare, Ticket, BarChart,
  Headphones, Lock, Send, Loader2, CheckCircle2, AlertCircle,
  ChevronDown, Star, Shield, Paperclip, X, Image as ImageIcon, FileVideo,
  Clock, Smile, RefreshCw
} from 'lucide-react';
import { createTicket, getErrorMessage } from '../api/apiClient';
import logoUrl from '../assets/logo.png';
import laptopMockup from '../assets/LaptopandRobot.png';
import bgImg from '../assets/background.png';

const LandingPage = () => {
  const [scrolled, setScrolled] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      {/* ── Navbar ───────────────────────────────────────────────── */}
      <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${scrolled ? 'bg-white/80 backdrop-blur-xl shadow-lg shadow-slate-200/50 border-b border-white/50' : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logoUrl} alt="ServiceDesk Logo" className="w-8 h-8 object-contain" />
            <span className="text-xl font-bold text-slate-900">ServiceDesk</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-700">
            <a href="#features" className="hover:text-violet-600 transition-colors duration-200">Features</a>
            <a href="#" className="hover:text-violet-600 transition-colors duration-200">Pricing</a>
            <a href="#" className="hover:text-violet-600 transition-colors duration-200">About Us</a>
            <a href="#ticket-form" onClick={(e) => { e.preventDefault(); scrollToForm(); }} className="hover:text-violet-600 transition-colors duration-200">Support</a>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-sm font-semibold text-slate-700 hover:text-violet-600 transition-all duration-200 px-3 py-2">
              Sign In
            </Link>
            <button onClick={scrollToForm} className="text-sm font-semibold px-5 py-2.5 text-white rounded-full transition-all duration-300 hover:scale-105 hover:shadow-xl active:scale-95"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', boxShadow: '0 4px 20px -2px rgba(109,40,217,0.5)' }}
            >
              Try for Free
            </button>
          </div>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex flex-col justify-center overflow-hidden"
        style={{ backgroundImage: `url(${bgImg})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }}
      >
        {/* Subtle overlay for readability */}
        <div className="absolute inset-0 bg-white/10" />

        <div className="relative z-10 max-w-7xl mx-auto w-full px-6 lg:px-12 pt-24 pb-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-20 items-center min-h-[calc(100vh-10rem)]">

            {/* Left column */}
            <div className="flex flex-col justify-center">
              {/* Pill badge — liquid glass */}
              <div className="inline-flex w-fit items-center gap-1.5 px-4 py-2 rounded-full mb-6 backdrop-blur-md transition-all duration-300 hover:scale-105 hover:shadow-md"
                style={{ background: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.8)', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}
              >
                <Zap size={12} className="text-violet-600 fill-violet-500" />
                <span className="text-[11px] font-bold tracking-widest uppercase text-violet-700">
                  Leading Service Management Platform
                </span>
              </div>

              {/* Headline */}
              <h1 className="font-extrabold tracking-tight leading-[1.12] mb-4" style={{ fontSize: 'clamp(2.4rem, 5.5vw, 4rem)' }}>
                <span className="text-gray-900">Customer Service</span>
                <br />
                <span className="text-transparent bg-clip-text"
                  style={{ backgroundImage: 'linear-gradient(90deg, #7c3aed, #6366f1, #a855f7)' }}
                >
                  Management System
                </span>
              </h1>

              {/* Sub-headline */}
              <p className="text-xl md:text-2xl font-bold text-transparent bg-clip-text mb-5"
                style={{ backgroundImage: 'linear-gradient(90deg, #7c3aed, #a855f7)' }}>
                Automated. Smart. Fast.
              </p>

              {/* Description */}
              <p className="text-slate-600 leading-relaxed max-w-lg mb-8" style={{ fontSize: '0.95rem' }}>
                ServiceDesk applies ITIL best practices to ticket management, automates workflows,
                and integrates real-time chat with performance analytics — all in a single platform.
              </p>

              {/* Compact stats row — liquid glass cards */}
              <div className="flex flex-wrap gap-4 mb-8">
                {[
                  { value: '99.8%', label: 'Uptime' },
                  { value: '24/7', label: 'Support' },
                  { value: 'ISO 27001', label: 'Certified' },
                ].map((s) => (
                  <div key={s.label}
                    className="flex flex-col items-center justify-center px-5 py-3 rounded-xl backdrop-blur-md border border-white/60 shadow-sm min-w-[105px] transition-all duration-300 hover:scale-105 hover:shadow-lg hover:border-violet-200"
                    style={{ background: 'rgba(255,255,255,0.5)' }}
                  >
                    <span className="text-lg md:text-xl font-extrabold text-transparent bg-clip-text"
                      style={{ backgroundImage: 'linear-gradient(135deg, #7c3aed, #6366f1)' }}>
                      {s.value}
                    </span>
                    <span className="text-xs text-slate-600 font-medium">{s.label}</span>
                  </div>
                ))}
              </div>

              {/* CTA — white glass + purple gradient */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={scrollToForm}
                  className="group relative inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full font-bold text-slate-800 text-sm backdrop-blur-md border border-white/60 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:bg-white/90 active:scale-95"
                  style={{ background: 'rgba(255,255,255,0.7)', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}
                >
                  Try for Free
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform duration-300" />
                </button>

                <Link
                  to="/staff/login"
                  className="group relative inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full font-bold text-white text-sm transition-all duration-300 hover:scale-105 hover:shadow-xl active:scale-95"
                  style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)', boxShadow: '0 8px 24px -4px rgba(109,40,217,0.45)' }}
                >
                  Staff Portal
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform duration-300" />
                </Link>
              </div>
            </div>

            {/* Right column — laptop mockup (larger) */}
            <div className="relative flex items-center justify-center lg:justify-end">
              <div className="absolute inset-0 m-auto"
                style={{
                  width: '100%', height: '100%',
                  background: 'radial-gradient(ellipse at center, rgba(139,92,246,0.18) 0%, rgba(99,102,241,0.08) 50%, transparent 70%)',
                  borderRadius: '50%',
                }}
              />
              <img
                src={laptopMockup}
                alt="ServiceDesk Dashboard"
                className="relative z-10 w-full select-none drop-shadow-2xl transition-all duration-500 hover:scale-[1.02]"
                style={{ maxWidth: '640px' }}
                draggable={false}
                loading="lazy"
              />
            </div>
          </div>
        </div>

        {/* Scroll cue */}
        <button
          onClick={scrollToForm}
          className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-violet-400/60 hover:text-violet-500 transition-all duration-300 animate-bounce z-10 hover:scale-110"
        >
          <ChevronDown size={20} />
        </button>
      </section>

      {/* ── Stats ───────────────────────────────────────────────── */}
      <section className="py-12 px-6 bg-white">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-5">
          {STATS.map((s) => (
            <div key={s.label}
              className="group bg-white rounded-3xl p-6 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.08)] border border-slate-100 hover:-translate-y-1 hover:shadow-xl hover:border-violet-200 transition-all duration-300"
            >
              <div className={`w-10 h-10 rounded-xl ${s.iconBg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                <s.icon size={20} className={s.iconColor} />
              </div>
              <div className="text-3xl md:text-4xl font-extrabold mb-1"
                style={{ background: 'linear-gradient(90deg, #7c3aed, #6366f1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}
              >
                {s.val}
              </div>
              <div className="text-sm text-slate-500 font-medium">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────────── */}
      <section id="features" className="py-24 px-4 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-bold uppercase tracking-widest text-indigo-500 mb-3">Features</p>
            <h2 className="text-3xl md:text-5xl font-bold text-slate-900 mb-4">
              Everything you need, in one place
            </h2>
            <p className="text-slate-500 max-w-xl mx-auto">
              From ticket management to performance analytics — ServiceDesk integrates your entire support workflow.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f, i) => (
              <div key={i} className="group relative bg-white rounded-2xl p-7 border border-slate-200 hover:border-indigo-300 transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/10 hover:-translate-y-1">
                <div className={`w-12 h-12 rounded-xl ${f.bg} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300`}>
                  <f.icon size={24} className={f.color} />
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-2">{f.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ─────────────────────────────────────────── */}
      <section id="how-it-works" className="py-24 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-bold uppercase tracking-widest text-indigo-500 mb-3">Process</p>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Simple 3-step process</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {STEPS.map((s, i) => (
              <div key={i} className="group relative flex flex-col items-center text-center p-8 bg-slate-50 rounded-2xl border border-slate-100 hover:border-violet-200 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white flex items-center justify-center text-xl font-black shadow-lg shadow-indigo-500/30 mb-5 group-hover:scale-110 transition-transform duration-300">
                  {i + 1}
                </div>
                <h3 className="font-bold text-slate-900 mb-2">{s.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{s.desc}</p>
                {i < STEPS.length - 1 && (
                  <div className="hidden md:block absolute -right-3 top-14 w-6 h-6 text-slate-300">
                    <ArrowRight size={20} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Ticket Form Section ──────────────────────────────────── */}
      <section className="py-20 px-4 bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-2xl mx-auto" ref={formRef} id="ticket-form">
          <div className="text-center mb-10">
            <p className="text-xs font-bold uppercase tracking-widest text-indigo-500 mb-3">Get Help Now</p>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">
              Submit a Support Request
            </h2>
            <p className="text-slate-500 text-sm">
              No login required. Fill out the form below and we'll get back to you as soon as possible.
            </p>
          </div>
          <TicketForm />
        </div>
      </section>

      {/* ── Testimonials ─────────────────────────────────────────── */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-bold uppercase tracking-widest text-indigo-500 mb-3">Testimonials</p>
            <h2 className="text-3xl font-bold text-slate-900">What our customers say</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="group bg-slate-50 rounded-2xl p-6 border border-slate-100 hover:border-violet-200 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <Star key={j} size={14} className="fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-slate-600 leading-relaxed mb-4">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white text-xs font-bold group-hover:scale-110 transition-transform duration-300">
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-700">{t.name}</div>
                    <div className="text-xs text-slate-400">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ───────────────────────────────────────────── */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 p-10 md:p-16 text-center shadow-2xl shadow-indigo-500/30">
            <div className="absolute inset-0 opacity-10"
              style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
            <div className="relative z-10">
              <Shield size={36} className="text-white/70 mx-auto mb-6" />
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Ready to level up your support?
              </h2>
              <p className="text-indigo-100 max-w-xl mx-auto mb-8 text-sm leading-relaxed">
                Sign in to the system or submit a request now — no account needed.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <button
                  onClick={scrollToForm}
                  className="flex items-center gap-2 px-8 py-3.5 bg-white text-indigo-600 rounded-xl font-bold hover:bg-indigo-50 hover:scale-105 active:scale-95 transition-all duration-300 shadow-lg"
                >
                  Get Started Now
                  <ArrowRight size={18} />
                </button>
                <Link to="/staff/login" className="px-8 py-3.5 border-2 border-white/30 text-white rounded-xl font-bold hover:bg-white/10 hover:scale-105 active:scale-95 transition-all duration-300">
                  Staff Login
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────── */}
      <footer className="bg-slate-900 pt-16 pb-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
            <div className="md:col-span-1">
              <div className="flex items-center gap-3 mb-4">
                <img src={logoUrl} alt="ServiceDesk Logo" className="w-7 h-7 object-contain" />
                <span className="text-lg font-bold text-white">ServiceDesk</span>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed">
                Enterprise IT service management and customer support platform.
              </p>
            </div>
            {[
              { title: 'Resources', links: ['Documentation', 'Knowledge Base', 'API Reference'] },
              { title: 'Company', links: ['About Us', 'Contact', 'Careers'] },
              { title: 'Legal', links: ['Privacy', 'Terms', 'Cookies'] },
            ].map(col => (
              <div key={col.title}>
                <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">{col.title}</h4>
                <ul className="space-y-2.5">
                  {col.links.map(l => (
                    <li key={l}><a href="#" className="text-sm text-slate-400 hover:text-white transition-colors duration-200">{l}</a></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="pt-8 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-slate-600 text-xs">© {new Date().getFullYear()} ServiceDesk Inc. All rights reserved.</p>
            <div className="flex items-center gap-4">
              {[{ label: 'f', title: 'Facebook' }, { label: '𝕏', title: 'X / Twitter' }, { label: 'in', title: 'LinkedIn' }].map(s => (
                <a key={s.title} href="#" title={s.title}
                  className="w-8 h-8 rounded-full bg-slate-700 hover:bg-violet-600 hover:scale-110 flex items-center justify-center text-slate-300 hover:text-white text-xs font-bold transition-all duration-300"
                >{s.label}</a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

// ── Ticket Form Component ──────────────────────────────────────────────────────

const TicketForm = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('SOFTWARE');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setFiles(prev => [...prev, ...Array.from(e.target.files!)]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !name.trim() || !email.trim()) {
      setError('Please fill in all required fields.');
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      let finalDesc = description;
      if (files.length > 0) finalDesc += `\n\n[Attachments: ${files.map(f => f.name).join(', ')}]`;
      await createTicket({
        title: `[${category}] ${title}`,
        description: finalDesc,
        priority: 'MEDIUM',
        reporterName: name,
        reporterEmail: email,
      });
      setSuccess(true);
    } catch (err) {
      setError(getErrorMessage(err, 'An error occurred while submitting your request.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-xl hover:shadow-2xl transition-shadow duration-300">
        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-5">
          <CheckCircle2 size={32} className="text-emerald-500" />
        </div>
        <h3 className="text-2xl font-bold text-slate-900 mb-2">Request Submitted!</h3>
        <p className="text-slate-500 mb-6 text-sm">Our support team will contact you via email as soon as possible.</p>
        <button
          onClick={() => { setSuccess(false); setTitle(''); setDescription(''); setName(''); setEmail(''); setFiles([]); }}
          className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 hover:scale-105 active:scale-95 text-white rounded-xl text-sm font-semibold transition-all duration-300"
        >
          Submit Another Request
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl shadow-slate-900/10 overflow-hidden hover:shadow-indigo-500/10 transition-shadow duration-300">
      <div className="h-1 w-full bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500" />
      <form onSubmit={handleSubmit} className="p-8 md:p-10 space-y-5">
        {error && (
          <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">
            <AlertCircle size={16} className="shrink-0" />
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">Full Name <span className="text-red-500">*</span></label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="John Doe"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-slate-800" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">Email <span className="text-red-500">*</span></label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@company.com"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-slate-800" />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">Issue Title <span className="text-red-500">*</span></label>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Cannot connect to VPN"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-slate-800" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">Category</label>
            <select value={category} onChange={e => setCategory(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-slate-800 cursor-pointer">
              <option value="SOFTWARE">Software</option>
              <option value="HARDWARE">Hardware</option>
              <option value="NETWORK">Network & Connectivity</option>
              <option value="ACCESS">Access & Authentication</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-600 mb-1.5">Detailed Description <span className="text-red-500">*</span></label>
          <textarea rows={5} value={description} onChange={e => setDescription(e.target.value)}
            placeholder="Describe your issue, steps to reproduce, error messages if any..."
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-slate-800 resize-none" />
        </div>

        {/* File Upload */}
        <div>
          <div
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-3 p-4 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/30 transition-all group"
          >
            <Paperclip size={18} className="text-slate-400 group-hover:text-indigo-500 transition-colors" />
            <span className="text-sm text-slate-500 group-hover:text-indigo-600">
              Attach images / videos (optional)
            </span>
            <input type="file" multiple accept="image/*,video/*" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
          </div>
          {files.length > 0 && (
            <div className="mt-3 space-y-2">
              {files.map((f, idx) => (
                <div key={idx} className="flex items-center gap-3 p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${f.type.startsWith('image/') ? 'bg-blue-100 text-blue-500' : 'bg-purple-100 text-purple-500'}`}>
                    {f.type.startsWith('image/') ? <ImageIcon size={14} /> : <FileVideo size={14} />}
                  </div>
                  <span className="text-xs text-slate-600 truncate flex-1">{f.name}</span>
                  <button type="button" onClick={() => setFiles(prev => prev.filter((_, i) => i !== idx))} className="text-slate-400 hover:text-red-500 transition-colors p-1">
                    <X size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full flex items-center justify-center gap-2.5 py-3.5 bg-indigo-600 hover:bg-indigo-700 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:pointer-events-none text-white rounded-xl font-semibold transition-all duration-300 shadow-lg shadow-indigo-500/20"
        >
          {isSubmitting ? <><Loader2 size={18} className="animate-spin" /> Submitting...</> : <><Send size={18} /> Submit Request</>}
        </button>

        <p className="text-center text-xs text-slate-400">By submitting, you agree to our Privacy Policy.</p>
      </form>
    </div>
  );
};

// ── Static data ────────────────────────────────────────────────────────────────

const STATS = [
  { val: '10K+',    label: 'Tickets Resolved',      icon: Ticket,    iconBg: 'bg-violet-100',  iconColor: 'text-violet-600' },
  { val: '< 5 min', label: 'Response Time',          icon: Clock,     iconBg: 'bg-indigo-100',  iconColor: 'text-indigo-600' },
  { val: '99%',     label: 'Satisfaction Rate',      icon: Smile,     iconBg: 'bg-amber-100',   iconColor: 'text-amber-500' },
  { val: '24/7',    label: 'Continuous Support',     icon: RefreshCw, iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600' },
];

const FEATURES = [
  { icon: Ticket, title: 'AI-Powered Ticket Management', desc: 'Create, track, and auto-classify tickets with AI that prioritizes critical issues.', bg: 'bg-blue-100', color: 'text-blue-600' },
  { icon: MessageSquare, title: 'Real-Time Chat', desc: 'Live chat with customers. Supports files, images, and voice messages.', bg: 'bg-emerald-100', color: 'text-emerald-600' },
  { icon: BarChart, title: 'Analytics & Reports', desc: 'Detailed dashboards, visual charts, and team performance metrics.', bg: 'bg-violet-100', color: 'text-violet-600' },
  { icon: Users, title: 'User Management', desc: 'Flexible RBAC for Admin, Agent, and Customer roles. Efficient team management.', bg: 'bg-orange-100', color: 'text-orange-600' },
  { icon: Headphones, title: 'Multi-Channel Support', desc: 'Unified email, chat, and call center — never miss a request.', bg: 'bg-pink-100', color: 'text-pink-600' },
  { icon: Lock, title: 'Enterprise Security', desc: 'End-to-end encryption. Compliant with enterprise security standards.', bg: 'bg-slate-100', color: 'text-slate-600' },
];

const STEPS = [
  { title: 'Submit Request', desc: 'Customers fill out the support form right here — no account needed.' },
  { title: 'Auto-Assign', desc: 'The system automatically assigns tickets to the most suitable agent by expertise.' },
  { title: 'Resolve & Review', desc: 'Agents resolve the issue, customers receive results and rate the service.' },
];

const TESTIMONIALS = [
  { text: 'ServiceDesk helped our IT team reduce ticket handling time by 60% thanks to automatic classification.', name: 'Anna Lee', role: 'IT Manager · FPT Software' },
  { text: 'Beautiful and easy-to-use interface. Our customers are very satisfied with the response speed.', name: 'Mark Chen', role: 'Support Lead · Viettel' },
  { text: 'The internal chat feature helps our agent team coordinate much faster than email.', name: 'Sarah Kim', role: 'Head of Support · VinGroup' },
];

export default LandingPage;
