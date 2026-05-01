import { useState, useRef, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  ArrowRight, Users, Zap, MessageSquare, Ticket, BarChart,
  Headphones, Lock, Send, Loader2, CheckCircle2, AlertCircle,
  ChevronDown, Star, Shield, Paperclip, X, Image as ImageIcon, FileVideo
} from 'lucide-react';
import { createTicket, getErrorMessage } from '../api/apiClient';
import logoUrl from '../assets/logo.png';
import laptopMockup from '../assets/LaptopandRobot.png';
import bgImg from '../assets/background.png';

const LandingPage = () => {
  const [scrolled, setScrolled] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (searchParams.get('scrollToForm') === '1') {
      setTimeout(() => {
        formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 300);
    }
  }, [searchParams]);

  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      {/* ── Navbar ───────────────────────────────────────────────── */}
      <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${scrolled ? 'bg-white/80 backdrop-blur-xl shadow-lg shadow-slate-200/50 border-b border-white/50' : 'bg-transparent'}`}>
        <div className="w-full h-20 flex items-center justify-between" style={{ padding: '0 max(5rem, 8vw)' }}>
          <div className="flex items-center gap-3">
            <img src={logoUrl} alt="ServiceDesk Logo" className="w-15 h-15 object-contain" />
            <span className="text-[2.5rem] font-bold text-slate-900">ServiceDesk</span>
          </div>
          <div className="hidden md:flex items-center gap-10 text-2xl font-medium text-slate-700">
            <a href="#features" className="hover:text-violet-600 transition-colors duration-200">Features</a>
            <a href="#" className="hover:text-violet-600 transition-colors duration-200">Pricing</a>
            <a href="#" className="hover:text-violet-600 transition-colors duration-200">About Us</a>
            <a href="#ticket-form" onClick={(e) => { e.preventDefault(); scrollToForm(); }} className="hover:text-violet-600 transition-colors duration-200">Support</a>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/login" className="text-2xl font-semibold text-slate-700 hover:text-violet-600 transition-all duration-200 px-4 py-2.5">
              Sign In
            </Link>
            <button onClick={scrollToForm} className="text-2xl font-semibold px-7 py-3.5 text-white rounded-full transition-all duration-300 hover:scale-105 hover:shadow-xl active:scale-95"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', boxShadow: '0 4px 20px -2px rgba(109,40,217,0.5)' }}
            >
              Try for Free
            </button>
          </div>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex flex-col overflow-hidden">

        {/* Fixed background layer */}
        <div className="fixed inset-0 z-0"
          style={{ backgroundImage: `url(${bgImg})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }}
        />
        <div className="fixed inset-0 z-[1] bg-white/10" />
        <style>{`
          @keyframes marquee{0%{transform:translateX(0)}100%{transform:translateX(-33.333%)}}
          .btn-view-demo{
            position:relative;
            display:inline-flex;
            align-items:center;
            justify-content:center;
            gap:0.5rem;
            border-radius:9999px;
            font-weight:600;
            color:#3b0764;
            background:rgba(255,255,255,0.55);
            backdrop-filter:blur(24px);
            -webkit-backdrop-filter:blur(24px);
            box-shadow:
              0 4px 24px rgba(139,92,246,0.18),
              0 1px 4px rgba(0,0,0,0.06),
              inset 0 1.5px 0 rgba(255,255,255,0.9),
              inset 0 -1px 0 rgba(139,92,246,0.08);
            transition:transform 0.25s ease, box-shadow 0.25s ease, background 0.25s ease;
            isolation:isolate;
          }
          .btn-view-demo::before{
            content:'';
            position:absolute;
            inset:0;
            border-radius:9999px;
            padding:1.5px;
            background:linear-gradient(135deg,rgba(167,139,250,0.7),rgba(129,140,248,0.5),rgba(96,165,250,0.7));
            -webkit-mask:linear-gradient(#fff 0 0) content-box,linear-gradient(#fff 0 0);
            -webkit-mask-composite:xor;
            mask-composite:exclude;
            pointer-events:none;
          }
          .btn-view-demo:hover{
            transform:translateY(-2px);
            background:rgba(255,255,255,0.72);
            box-shadow:
              0 8px 32px rgba(139,92,246,0.28),
              0 0 0 4px rgba(139,92,246,0.07),
              inset 0 1.5px 0 rgba(255,255,255,1),
              inset 0 -1px 0 rgba(139,92,246,0.12);
          }
          .btn-view-demo:active{transform:translateY(0) scale(0.97);}
        `}</style>

        <div className="relative z-10 flex-1 flex flex-col w-full" style={{ paddingTop: '14rem', paddingBottom: 0 }}>
          <div className="grid grid-cols-1 lg:grid-cols-2 items-start" style={{ padding: '0 max(3.5rem, 6vw)' }}>

            {/* Left column */}
            <div className="flex flex-col justify-center" style={{ gap: 'clamp(0.7rem, 1.4vw, 1.3rem)' }}>
              {/* Pill badge */}
              <div className="inline-flex w-fit items-center gap-2.5 px-6 py-2.5 rounded-full backdrop-blur-md transition-all duration-300 hover:scale-105 hover:shadow-md"
                style={{ background: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.8)', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}
              >
                <Zap size={18} className="text-violet-600 fill-violet-500" />
                <span className="text-sm font-bold tracking-widest uppercase text-violet-700">
                  Leading Service Management Platform
                </span>
              </div>

              {/* Headline */}
              <h1 className="font-extrabold tracking-tight leading-[1.1]" style={{ fontSize: 'clamp(3.2rem, 6.8vw, 5.5rem)' }}>
                <span className="text-gray-900">Customer Service</span>
                <br />
                <span className="text-transparent bg-clip-text"
                  style={{ backgroundImage: 'linear-gradient(90deg, #7c3aed, #6366f1, #a855f7)' }}
                >
                  Management System
                </span>
              </h1>

              {/* Sub-headline */}
              <p className="font-bold text-transparent bg-clip-text"
                style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.75rem)', backgroundImage: 'linear-gradient(90deg, #7c3aed, #a855f7)' }}>
                Automated. Smart. Fast.
              </p>

              {/* Description */}
              <p className="text-slate-600 leading-relaxed font-medium" style={{ fontSize: 'clamp(0.95rem, 1.4vw, 1.2rem)' }}>
                ServiceDesk applies ITIL best practices to ticket management, automates workflows,
                and integrates real-time chat with performance analytics — all in a single platform.
              </p>

              {/* Stats row */}
              <div style={{ display: 'flex', gap: '1rem' }}>
                {[
                  { value: '99.8%', label: 'Uptime' },
                  { value: '24/7',  label: 'Support' },
                  { value: 'ISO 27001', label: 'Certified' },
                ].map((s) => (
                  <div key={s.label}
                    className="flex flex-col items-center justify-center rounded-xl backdrop-blur-md border transition-all duration-300 hover:scale-105 hover:shadow-xl"
                    style={{
                      background: 'linear-gradient(135deg, #ede9fe 0%, #e0e7ff 50%, #fae8ff 100%)',
                      backdropFilter: 'blur(12px)',
                      WebkitBackdropFilter: 'blur(12px)',
                      borderColor: 'rgba(139,92,246,0.2)',
                      padding: '0.9rem 1.8rem',
                      minWidth: '180px',
                      minHeight: '108px',
                      boxShadow: '0 4px 20px rgba(139,92,246,0.08)',
                    }}
                  >
                    <span className="font-extrabold text-transparent bg-clip-text"
                      style={{ fontSize: 'clamp(1.56rem, 2.64vw, 2.04rem)', backgroundImage: 'linear-gradient(135deg, #7c3aed, #6366f1)' }}>
                      {s.value}
                    </span>
                    <span className="text-slate-500 font-medium mt-0.5" style={{ fontSize: '1.1rem' }}>{s.label}</span>
                  </div>
                ))}
              </div>

              {/* CTA buttons */}
              <div className="flex flex-col sm:flex-row" style={{ gap: 'clamp(0.7rem, 1.4vw, 1.1rem)', paddingTop: 'clamp(0.25rem, 0.5vw, 0.6rem)' }}>
                <button
                  onClick={scrollToForm}
                  className="group relative inline-flex items-center justify-center gap-2 rounded-full font-bold text-slate-800 backdrop-blur-md border border-white/60 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:bg-white/90 active:scale-95"
                  style={{ fontSize: 'clamp(1rem, 1.5vw, 1.3rem)', padding: 'clamp(0.9rem, 1.5vw, 1.3rem) clamp(2.2rem, 3.5vw, 3.2rem)', background: 'rgba(255,255,255,0.7)', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}
                >
                  Try for Free
                  <ArrowRight size={22} className="group-hover:translate-x-1 transition-transform duration-300" />
                </button>

                <Link
                  to="/demo"
                  className="btn-view-demo group"
                  style={{ fontSize: 'clamp(1rem, 1.5vw, 1.3rem)', padding: 'clamp(0.9rem, 1.5vw, 1.3rem) clamp(2.2rem, 3.5vw, 3.2rem)' }}
                >
                  View Demo
                  <ArrowRight size={22} className="group-hover:translate-x-1 transition-transform duration-300" />
                </Link>
              </div>
            </div>

            {/* Right column — laptop mockup */}
            <div className="relative flex items-center justify-center" style={{ paddingLeft: '0rem', marginTop: '-10rem', marginRight: '-10rem' }}>
              <div className="absolute"
                style={{
                  width: '120%', height: '120%',
                  background: 'radial-gradient(ellipse at center, rgba(139,92,246,0.2) 0%, rgba(99,102,241,0.1) 50%, transparent 70%)',
                  borderRadius: '50%',
                }}
              />
              <img
                src={laptopMockup}
                alt="ServiceDesk Dashboard"
                className="relative z-10 w-full select-none drop-shadow-2xl transition-all duration-500 hover:scale-[1.02]"
                style={{ maxWidth: 'min(65vw, 1100px)' }}
                draggable={false}
                loading="lazy"
              />
            </div>
          </div>

          {/* Trusted by — Zendesk-style inline: label left + logos scroll right */}
          <div style={{ padding: '0.5rem max(3.5rem, 6vw) 3rem', marginTop: '-3rem' }}>
            <div className="flex items-center gap-0 overflow-hidden">
              {/* Fixed label */}
              <div className="flex-shrink-0 pr-6 mr-2 border-r border-slate-400/30">
                <p className="font-extrabold uppercase whitespace-nowrap leading-tight"
                  style={{ color: '#111827', fontSize: '1rem', letterSpacing: '0.06em' }}>
                  Trusted by<br />100+ companies
                </p>
              </div>
              {/* Scrolling logos — overflow clipped by parent */}
              <div className="flex-1 overflow-hidden relative">
                <div className="absolute right-0 top-0 bottom-0 w-20 z-10 pointer-events-none"
                  style={{ background: 'linear-gradient(to left, rgba(222,212,255,0.8), transparent)' }}
                />
                <div className="flex items-center"
                  style={{ animation: 'marquee 22s linear infinite', width: 'max-content', willChange: 'transform' }}
                >
                  {((): { src: string; alt: string }[] => {
                    const logos = [
                      { src: 'https://web-assets.zendesk.com/is/image/zendesk/Liberty_Default?$primary=%2311110D&$secondary=%235d5d59&$tertiary=%23777773&fmt=webp-alpha&qlt=65&scale=2', alt: 'Liberty' },
                      { src: 'https://web-assets.zendesk.com/is/image/zendesk/Squarespace_Default?$primary=%2311110D&$secondary=%235d5d59&$tertiary=%23777773&fmt=webp-alpha&qlt=65&scale=2', alt: 'Squarespace' },
                      { src: 'https://web-assets.zendesk.com/is/image/zendesk/StanleyBlackDecker_Default?$primary=%2311110D&$secondary=%235d5d59&$tertiary=%23777773&fmt=webp-alpha&qlt=65&scale=2', alt: 'Stanley Black & Decker' },
                      { src: 'https://web-assets.zendesk.com/is/image/zendesk/Tesco_Default?$primary=%2311110D&$secondary=%235d5d59&$tertiary=%23777773&fmt=webp-alpha&qlt=65&scale=2', alt: 'Tesco' },
                      { src: 'https://web-assets.zendesk.com/is/image/zendesk/Lush_Default?$primary=%2311110D&$secondary=%235d5d59&$tertiary=%23777773&fmt=webp-alpha&qlt=65&scale=2', alt: 'Lush' },
                      { src: 'https://web-assets.zendesk.com/is/image/zendesk/IngramMicro_Default?$primary=%2311110D&$secondary=%235d5d59&$tertiary=%23777773&fmt=webp-alpha&qlt=65&scale=2', alt: 'Ingram Micro' },
                      { src: 'https://web-assets.zendesk.com/is/image/zendesk/Grubhub_Default?$primary=%2311110D&$secondary=%235d5d59&$tertiary=%23777773&fmt=webp-alpha&qlt=65&scale=2', alt: 'GrubHub' },
                    ];
                    return [...logos, ...logos, ...logos];
                  })().map((logo, i) => (
                    <div key={i} className="flex items-center justify-center px-7">
                      <img src={logo.src} alt={logo.alt}
                        className="h-14 w-auto object-contain opacity-65 hover:opacity-100 transition-all duration-300"
                        draggable={false}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll cue */}
        <button
          onClick={scrollToForm}
          className="absolute bottom-3 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-violet-400/70 hover:text-violet-500 transition-all duration-300 animate-bounce z-10 hover:scale-110"
        >
          <ChevronDown size={50} />
        </button>
      </section>

      {/* ── Features ─────────────────────────────────────────── */}
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
              <div key={i} className="group relative bg-white rounded-2xl p-8 border border-slate-200 hover:border-indigo-300 transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/10 hover:-translate-y-1">
                <div className={`w-14 h-14 rounded-xl ${f.bg} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300`}>
                  <f.icon size={28} className={f.color} />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{f.title}</h3>
                <p className="text-base text-slate-500 leading-relaxed">{f.desc}</p>
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
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white flex items-center justify-center text-2xl font-black shadow-lg shadow-indigo-500/30 mb-5 group-hover:scale-110 transition-transform duration-300">
                  {i + 1}
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{s.title}</h3>
                <p className="text-base text-slate-500 leading-relaxed">{s.desc}</p>
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
      <section className="relative py-24 px-4 overflow-hidden">
        {/* Pastel gradient background */}
        <div className="absolute inset-0 -z-10"
          style={{ background: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 35%, #e0f2fe 70%, #f0f9ff 100%)' }}
        />
        <div className="absolute top-10 left-1/4 w-[28rem] h-[28rem] rounded-full -z-10 blur-3xl opacity-50"
          style={{ background: 'radial-gradient(circle, #c4b5fd, transparent)' }}
        />
        <div className="absolute bottom-10 right-1/4 w-96 h-96 rounded-full -z-10 blur-3xl opacity-35"
          style={{ background: 'radial-gradient(circle, #bae6fd, transparent)' }}
        />

        <div className="max-w-6xl mx-auto">
          {/* Title */}
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-3">
              Loved by{' '}
              <span className="text-transparent bg-clip-text"
                style={{ backgroundImage: 'linear-gradient(90deg, #7c3aed, #6366f1, #a855f7)' }}>
                Teams
              </span>
            </h2>
            <p className="text-slate-500 max-w-md mx-auto text-base">
              Join thousands of support teams who trust ServiceDesk to deliver exceptional customer experiences.
            </p>
          </div>

          {/* Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-7">
            {TESTIMONIALS.map((t, i) => (
              <div key={i}
                className="group relative rounded-3xl p-7 border border-white/70 backdrop-blur-xl transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl"
                style={{ background: 'rgba(255,255,255,0.55)', boxShadow: '0 8px 32px rgba(139,92,246,0.10)', backdropFilter: 'blur(16px)' }}
              >
                {/* Hover glow */}
                <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                  style={{ background: 'radial-gradient(ellipse at top left, rgba(139,92,246,0.13), transparent 65%)' }}
                />

                {/* Avatar + name row */}
                <div className="flex items-center gap-4 mb-5">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-md group-hover:scale-110 transition-transform duration-300 select-none"
                    style={{ background: 'linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%)', boxShadow: '0 4px 14px rgba(139,92,246,0.25)' }}
                  >
                    {t.avatar}
                  </div>
                  <div>
                    <div className="font-bold text-slate-800 text-sm">{t.name}</div>
                    <div className="text-xs text-slate-400 mt-0.5">{t.role}</div>
                  </div>
                </div>

                {/* Glowing stars */}
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <Star key={j} size={15}
                      className="fill-amber-400 text-amber-400"
                      style={{ filter: 'drop-shadow(0 0 4px rgba(251,191,36,0.75))' }}
                    />
                  ))}
                </div>

                {/* Quote */}
                <p className="text-slate-600 leading-relaxed text-sm">"{t.text}"</p>
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
                  className="flex items-center gap-2 px-10 py-4 bg-white text-indigo-600 rounded-xl font-bold text-base hover:bg-indigo-50 hover:scale-105 active:scale-95 transition-all duration-300 shadow-lg"
                >
                  Get Started Now
                  <ArrowRight size={20} />
                </button>
                <Link to="/demo" className="px-10 py-4 border-2 border-white/30 text-white rounded-xl font-bold text-base hover:bg-white/10 hover:scale-105 active:scale-95 transition-all duration-300">
                  View Demo
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
          className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 hover:scale-105 active:scale-95 text-white rounded-xl text-base font-semibold transition-all duration-300"
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
          className="w-full flex items-center justify-center gap-2.5 py-4 bg-indigo-600 hover:bg-indigo-700 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:pointer-events-none text-white rounded-xl text-base font-semibold transition-all duration-300 shadow-lg shadow-indigo-500/20"
        >
          {isSubmitting ? <><Loader2 size={20} className="animate-spin" /> Submitting...</> : <><Send size={20} /> Submit Request</>}
        </button>

        <p className="text-center text-xs text-slate-400">By submitting, you agree to our Privacy Policy.</p>
      </form>
    </div>
  );
};

// ── Static data ────────────────────────────────────────────────────────────────

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
  { text: 'ServiceDesk helped our IT team reduce ticket handling time by 60% thanks to automatic classification.', name: 'Anna Lee', role: 'IT Manager · FPT Software', avatar: '👩‍💼' },
  { text: 'Beautiful and easy-to-use interface. Our customers are very satisfied with the response speed.', name: 'Mark Chen', role: 'Support Lead · Viettel', avatar: '👨‍💻' },
  { text: 'The internal chat feature helps our agent team coordinate much faster than email.', name: 'Sarah Kim', role: 'Head of Support · VinGroup', avatar: '👩‍🔬' },
];

export default LandingPage;
