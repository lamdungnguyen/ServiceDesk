import { useState, useRef, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  ArrowRight, Zap, Send, Loader2, CheckCircle2, AlertCircle,
  ChevronDown, Star, Paperclip, X, Image as ImageIcon, FileVideo
} from 'lucide-react';
import { createTicket, getErrorMessage } from '../api/apiClient';
import logoUrl from '../assets/logo.png';
import laptopMockup from '../assets/LaptopandRobot.png';
import bgImg from '../assets/background.png';
import aiImg from '../assets/LandingPage/AI.png';
import analyticsImg from '../assets/LandingPage/Analytics.png';
import multiChanelImg from '../assets/LandingPage/MultiChanel.png';
import realtimeImg from '../assets/LandingPage/Realtime.png';
import securityImg from '../assets/LandingPage/Security.png';
import userManaImg from '../assets/LandingPage/User Mana.png';

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
            color:#ffffff;
            background:#7c3aed;
            backdrop-filter:blur(24px);
            -webkit-backdrop-filter:blur(24px);
            box-shadow:
              0 4px 24px rgba(139,92,246,0.18),
              0 1px 4px rgba(0,0,0,0.06),
              inset 0 1.5px 0 rgba(255,255,255,0.25),
              inset 0 -1px 0 rgba(0,0,0,0.1);
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
            background:#8b5cf6;
            box-shadow:
              0 8px 32px rgba(139,92,246,0.28),
              0 0 0 4px rgba(139,92,246,0.07),
              inset 0 1.5px 0 rgba(255,255,255,0.2),
              inset 0 -1px 0 rgba(0,0,0,0.12);
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

              {/* Trusted by — moved inside left column so it always sits below the buttons */}
              <div style={{ marginTop: 'clamp(3rem, 4.5vw, 4rem)', marginRight: '-8vw' }}>
                <div className="flex items-center gap-0 overflow-hidden">
                  <div className="flex-shrink-0 pr-6 mr-2 border-r border-slate-400/30">
                    <p className="font-extrabold uppercase whitespace-nowrap leading-tight"
                      style={{ color: '#111827', fontSize: '1rem', letterSpacing: '0.06em' }}>
                      Trusted by<br />100+ companies
                    </p>
                  </div>
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
      <section id="features" className="relative z-[2] py-24 px-4 bg-white/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-violet-500 mb-4">Why Choose Us</p>
            <h2 className="text-5xl md:text-7xl font-black text-slate-900 mb-5 tracking-tight">
              Powerful{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 via-indigo-500 to-purple-600">Features</span>
            </h2>
            <p className="text-slate-600 max-w-2xl mx-auto text-lg leading-relaxed font-medium">A complete platform to streamline ticket handling, automate workflows, and deliver exceptional customer experiences.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10 mt-24">
            {FEATURES.map((f, i) => (
              <div key={i} className="group relative bg-gradient-to-b from-white to-slate-50 rounded-2xl border-2 border-slate-300 p-6 pr-4 transition-all duration-300 hover:-translate-y-2 hover:border-violet-400 overflow-visible" style={{ boxShadow: '0 6px 32px rgba(0,0,0,0.07), 0 2px 6px rgba(0,0,0,0.04), inset 0 2px 0 white' }}>
                {/* Text area - 2/3 width */}
                <div className="w-2/3">
                  <h3 className="text-xl font-bold text-slate-900 mb-2">{f.title}</h3>
                  <p className="text-base text-slate-500 leading-relaxed">{f.desc}</p>
                </div>
                {/* Asset image - positioned top-right, half in half out */}
                <div className={`absolute flex items-center justify-center z-20 ${f.large ? '-top-79 -right-50 w-[38rem] h-[38rem]' : '-top-36 -right-20 w-72 h-72'}`}>
                  <img src={f.img} alt={f.title} className="max-w-full max-h-full object-contain group-hover:scale-110 group-hover:-translate-y-1 transition-transform duration-300 drop-shadow-lg" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works / Process ────────────────────────────────── */}
      <section id="how-it-works" className="relative z-[2] py-24 px-4 bg-white/30">
        <div className="max-w-6xl mx-auto">
          {/* Section header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full bg-violet-100/80 border-2 border-violet-200 mb-6 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-violet-600 animate-pulse" />
              <span className="text-sm font-black uppercase tracking-[0.25em] text-violet-700">Process</span>
            </div>
            <h2 className="text-5xl md:text-6xl font-black text-slate-900 mb-5 tracking-tight leading-tight">
              Simple{' '}
              <span className="relative inline-block">
                <span className="absolute inset-0 bg-gradient-to-r from-violet-600 to-indigo-600 blur-2xl opacity-30 rounded-full" />
                <span className="relative text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-indigo-600">3-step</span>
              </span>
              {' '}process
            </h2>
            <p className="text-slate-600 max-w-xl mx-auto text-lg font-medium leading-relaxed">
              Get started in minutes. Our streamlined workflow makes support effortless.
            </p>
          </div>

          {/* Steps */}
          <div className="relative grid grid-cols-1 md:grid-cols-3 gap-0">
            {STEPS.map((s, i) => (
              <div key={i} className="relative flex flex-col items-center text-center px-6 py-8 group">
                {/* Step number circle */}
                <div className="relative z-10 w-24 h-24 rounded-full bg-gradient-to-br from-violet-500 via-indigo-500 to-purple-600 text-white flex items-center justify-center text-4xl font-black mb-7 shadow-xl shadow-violet-500/40 ring-[6px] ring-white/80 transition-all duration-300 group-hover:scale-110 group-hover:shadow-2xl group-hover:shadow-violet-500/50">
                  {/* Inner glow */}
                  <div className="absolute inset-2 rounded-full bg-white/10" />
                  <span className="relative z-10">{i + 1}</span>
                </div>

                {/* Content card */}
                <div className="relative w-full rounded-2xl bg-white/90 backdrop-blur-sm border-2 border-slate-200/80 p-7 shadow-lg shadow-slate-200/50 transition-all duration-300 group-hover:-translate-y-2 group-hover:shadow-xl group-hover:shadow-violet-200/40 group-hover:border-violet-300/60">
                  <h3 className="text-2xl font-extrabold text-slate-900 mb-3">{s.title}</h3>
                  <p className="text-base text-slate-600 leading-relaxed font-medium">{s.desc}</p>
                </div>

                {/* Connector line between steps (desktop only) */}
                {i < STEPS.length - 1 && (
                  <div className="hidden md:flex absolute top-[3rem] left-[calc(50%+4rem)] w-[calc(100%-8rem)] items-center justify-center z-0">
                    <div className="flex-1 h-[3px] rounded-full bg-gradient-to-r from-violet-300 via-violet-400 to-violet-300 relative shadow-sm">
                      <div className="absolute -top-[5px] right-0 w-3 h-3 rounded-full bg-violet-500 shadow-md shadow-violet-400/50" />
                      <div className="absolute top-1/2 left-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-violet-400 shadow-sm shadow-violet-400/40" />
                      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-2 h-2 rounded-full bg-violet-300" />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Ticket Form Section ──────────────────────────────────── */}
      <section className="relative z-[2] py-24 px-4 bg-gradient-to-b from-slate-50/30 to-white/30">
        <div className="max-w-3xl mx-auto" ref={formRef} id="ticket-form">
          <div className="text-center mb-10">
            <p className="text-sm font-black uppercase tracking-[0.3em] text-indigo-500 mb-4">Get Help Now</p>
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-4 tracking-tight">
              Submit a{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600">Support Request</span>
            </h2>
            <p className="text-slate-500 text-base font-medium">
              No login required. Fill out the form below and we'll get back to you as soon as possible.
            </p>
          </div>
          <TicketForm />
        </div>
      </section>

      {/* ── Testimonials ─────────────────────────────────────────── */}
      <section className="relative z-[2] py-24 px-4 overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #faf5ff 0%, #ede9fe 25%, #e0e7ff 50%, #e0f2fe 75%, #f0f9ff 100%)' }}
      >
        {/* Background glow orbs */}
        <div className="absolute top-20 left-10 w-[35rem] h-[35rem] rounded-full -z-[1] blur-3xl opacity-40 animate-pulse"
          style={{ background: 'radial-gradient(circle, #c4b5fd 0%, #a78bfa 30%, transparent 70%)' }}
        />
        <div className="absolute bottom-20 right-10 w-[30rem] h-[30rem] rounded-full -z-[1] blur-3xl opacity-30"
          style={{ background: 'radial-gradient(circle, #93c5fd 0%, #60a5fa 30%, transparent 70%)' }}
        />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[25rem] h-[25rem] rounded-full -z-[1] blur-3xl opacity-20"
          style={{ background: 'radial-gradient(circle, #f9a8d4 0%, transparent 70%)' }}
        />

        {/* Running marquee animation */}
        <style>{`
          @keyframes testimonial-scroll {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
          @keyframes star-glow {
            0%, 100% { filter: drop-shadow(0 0 3px rgba(251,191,36,0.6)); }
            50% { filter: drop-shadow(0 0 8px rgba(251,191,36,0.95)); }
          }
          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-8px); }
          }
          .animate-star-glow { animation: star-glow 2s ease-in-out infinite; }
          .animate-float { animation: float 5s ease-in-out infinite; }
          .animate-float-delayed { animation: float 5s ease-in-out 1.6s infinite; }
          .animate-float-slow { animation: float 6s ease-in-out 3.2s infinite; }
          .testimonial-track { animation: testimonial-scroll 40s linear infinite; }
          .testimonial-track:hover { animation-play-state: paused; }
        `}</style>

        <div className="max-w-full mx-auto">
          {/* Title */}
          <div className="text-center mb-14">
            <h2 className="text-5xl md:text-6xl font-black text-slate-900 mb-5 tracking-tight">
              Loved by{' '}
              <span className="relative inline-block">
                <span className="absolute inset-0 bg-gradient-to-r from-violet-600 via-indigo-500 to-purple-600 blur-2xl opacity-25 rounded-full" />
                <span className="relative text-transparent bg-clip-text bg-gradient-to-r from-violet-600 via-indigo-500 to-purple-600">Teams</span>
              </span>
            </h2>
            <p className="text-slate-600 max-w-xl mx-auto text-lg font-medium">
              Join thousands of support teams who trust ServiceDesk to deliver exceptional customer experiences.
            </p>
          </div>

          {/* Marquee Track - duplicates testimonials for seamless loop */}
          <div className="testimonial-track flex gap-8" style={{ width: 'max-content' }}>
            {[...TESTIMONIALS, ...TESTIMONIALS, ...TESTIMONIALS, ...TESTIMONIALS].map((t, i) => (
              <div key={i}
                className={`relative rounded-3xl p-8 border-2 border-white/80 backdrop-blur-xl flex-shrink-0 transition-all duration-300 hover:-translate-y-3 hover:shadow-2xl ${i % 3 === 0 ? 'animate-float' : i % 3 === 1 ? 'animate-float-delayed' : 'animate-float-slow'}`}
                style={{
                  width: '380px',
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0.4) 100%)',
                  boxShadow: '0 12px 40px rgba(139,92,246,0.08), 0 2px 8px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.8)',
                }}
              >
                {/* Hover gradient glow */}
                <div className="absolute inset-0 rounded-3xl opacity-0 hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                  style={{ background: 'radial-gradient(ellipse at top left, rgba(139,92,246,0.1), transparent 60%)' }}
                />

                {/* Top accent line */}
                <div className="absolute top-0 left-8 right-8 h-[3px] rounded-b-full bg-gradient-to-r from-violet-400 via-indigo-400 to-purple-400 opacity-60" />

                {/* Avatar + name + stars row */}
                <div className="flex items-center gap-4 mb-5">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-4xl shadow-lg transition-transform duration-300 select-none"
                      style={{ background: 'linear-gradient(135deg, #ede9fe 0%, #ddd6fe 50%, #fae8ff 100%)', boxShadow: '0 6px 20px rgba(139,92,246,0.25)' }}
                    >
                      {t.avatar}
                    </div>
                    {/* Online dot */}
                    <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-emerald-400 border-3 border-white shadow-sm" />
                  </div>
                  <div className="flex-1">
                    <div className="font-extrabold text-slate-800 text-base">{t.name}</div>
                    <div className="text-sm text-slate-500 mt-0.5">{t.role}</div>
                  </div>
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <Star key={j} size={16}
                        className="fill-amber-400 text-amber-400 animate-star-glow"
                        style={{ animationDelay: `${j * 0.15}s` }}
                      />
                    ))}
                  </div>
                </div>

                {/* Quote */}
                <div className="relative">
                  <span className="absolute -top-2 -left-1 text-5xl font-serif text-violet-300/60 select-none">"</span>
                  <p className="text-slate-700 leading-relaxed text-base font-medium pl-4">"{t.text}"</p>
                  <span className="absolute -bottom-6 right-2 text-5xl font-serif text-violet-300/60 select-none">"</span>
                </div>

                {/* Bottom verified badge */}
                <div className="flex items-center gap-2 mt-6 pt-4 border-t border-slate-100/80">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center">
                    <CheckCircle2 size={12} className="text-emerald-600" />
                  </div>
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Verified Review</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ───────────────────────────────────────────── */}
      <section className="relative z-[2] py-20 px-4 bg-white/30">
        <div className="max-w-5xl mx-auto">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 p-10 md:p-16 text-center shadow-2xl shadow-indigo-500/30">
            <div className="absolute inset-0 opacity-10"
              style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
            <div className="relative z-10">
              <img src={logoUrl} alt="ServiceDesk" className="w-14 h-14 mx-auto mb-6 object-contain drop-shadow-lg" />
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
      <footer className="relative z-[2] bg-slate-900/80 pt-16 pb-8 px-4">
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

  const inputClass = "w-full px-5 py-3.5 bg-white/55 border border-white/50 rounded-xl text-base text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-violet-400/80 focus:border-violet-400/80 transition-all duration-300 backdrop-blur-md shadow-sm";
  const labelClass = "block text-sm font-bold text-slate-700 mb-2";

  if (success) {
    return (
      <div className="glass-card-light relative rounded-3xl p-14 text-center">
        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 size={40} className="text-emerald-500" />
        </div>
        <h3 className="text-3xl font-black text-slate-900 mb-3">Request Submitted!</h3>
        <p className="text-slate-500 mb-8 text-base font-medium">Our support team will contact you via email as soon as possible.</p>
        <button
          onClick={() => { setSuccess(false); setTitle(''); setDescription(''); setName(''); setEmail(''); setFiles([]); }}
          className="btn-gradient px-10 py-3.5 text-white rounded-xl text-lg font-bold transition-all duration-300 hover:scale-105 active:scale-95"
        >
          Submit Another Request
        </button>
      </div>
    );
  }

  return (
    <>
      <style>{`
        .glass-card-light {
          position: relative;
          background: rgba(255,255,255,0.50);
          backdrop-filter: blur(32px);
          -webkit-backdrop-filter: blur(32px);
          box-shadow:
            0 12px 48px rgba(139,92,246,0.12),
            0 0 0 1px rgba(255,255,255,0.60),
            inset 0 1px 0 rgba(255,255,255,0.55);
        }
        .glass-card-light::before {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 24px;
          padding: 2.5px;
          background: linear-gradient(135deg,
            rgba(139,92,246,0.70) 0%,
            rgba(99,102,241,0.60) 20%,
            rgba(168,85,247,0.70) 40%,
            rgba(59,130,246,0.60) 60%,
            rgba(236,72,153,0.55) 80%,
            rgba(139,92,246,0.70) 100%
          );
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          pointer-events: none;
        }
        .btn-gradient {
          position: relative;
          background: linear-gradient(135deg, #7c3aed, #6366f1);
          box-shadow:
            0 4px 24px rgba(139,92,246,0.25),
            inset 0 1.5px 0 rgba(255,255,255,0.2),
            inset 0 -1px 0 rgba(0,0,0,0.1);
          isolation: isolate;
        }
        .btn-gradient::before {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 12px;
          padding: 1.5px;
          background: linear-gradient(135deg, rgba(167,139,250,0.7), rgba(129,140,248,0.5), rgba(96,165,250,0.7));
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          pointer-events: none;
        }
        .btn-gradient:hover {
          transform: translateY(-1px);
          box-shadow:
            0 8px 32px rgba(139,92,246,0.35),
            inset 0 1.5px 0 rgba(255,255,255,0.15),
            inset 0 -1px 0 rgba(0,0,0,0.12);
        }
        .btn-gradient:active {
          transform: translateY(0) scale(0.97);
        }
      `}</style>
      <div className="glass-card-light rounded-3xl overflow-hidden">
        <form onSubmit={handleSubmit} className="p-10 md:p-12 space-y-6">
          {error && (
            <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-100 rounded-xl text-base text-red-600 backdrop-blur-sm font-medium">
              <AlertCircle size={18} className="shrink-0" />
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className={labelClass}>Full Name <span className="text-red-500">*</span></label>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="John Doe" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Email <span className="text-red-500">*</span></label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@company.com" className={inputClass} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className={labelClass}>Issue Title <span className="text-red-500">*</span></label>
              <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Cannot connect to VPN" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Category</label>
              <select value={category} onChange={e => setCategory(e.target.value)}
                className={`${inputClass} cursor-pointer appearance-none`}
                style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%2394a3b8' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.75rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.25rem' }}
              >
                <option value="SOFTWARE">Software</option>
                <option value="HARDWARE">Hardware</option>
                <option value="NETWORK">Network & Connectivity</option>
                <option value="ACCESS">Access & Authentication</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className={labelClass}>Detailed Description <span className="text-red-500">*</span></label>
            <textarea rows={5} value={description} onChange={e => setDescription(e.target.value)}
              placeholder="Describe your issue, steps to reproduce, error messages if any..."
              className={`${inputClass} resize-none`} />
          </div>

          {/* File Upload */}
          <div>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-3 p-5 border-2 border-dashed border-slate-200/80 rounded-xl cursor-pointer hover:border-violet-400 hover:bg-violet-50/40 transition-all group backdrop-blur-sm"
            >
              <Paperclip size={20} className="text-slate-400 group-hover:text-violet-500 transition-colors" />
              <span className="text-base text-slate-500 group-hover:text-violet-600 font-medium">
                Attach images / videos (optional)
              </span>
              <input type="file" multiple accept="image/*,video/*" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
            </div>
            {files.length > 0 && (
              <div className="mt-3 space-y-2">
                {files.map((f, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-2.5 bg-white/50 rounded-lg border border-white/40 backdrop-blur-sm">
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
            className="btn-gradient w-full flex items-center justify-center gap-2.5 py-4.5 text-white rounded-xl text-lg font-bold transition-all duration-300 disabled:opacity-50 disabled:pointer-events-none"
          >
            {isSubmitting ? <><Loader2 size={22} className="animate-spin" /> Submitting...</> : <><Send size={22} /> Submit Request</>}
          </button>

          <p className="text-center text-sm text-slate-400 font-medium">By submitting, you agree to our Privacy Policy.</p>
        </form>
      </div>
    </>
  );
};

// ── Static data ────────────────────────────────────────────────────────────────

const FEATURES = [
  { img: aiImg, title: 'AI-Powered Ticket Management', desc: 'Automatically classify, prioritize, and route tickets using intelligent AI to reduce manual effort.', large: true },
  { img: realtimeImg, title: 'Real-Time Chat', desc: 'Enable instant communication between agents and customers with live chat support.' },
  { img: analyticsImg, title: 'Analytics & Reports', desc: 'Gain deep insights into team performance, ticket trends, and SLA compliance.' },
  { img: userManaImg, title: 'User Management', desc: 'Manage roles, permissions, and teams effortlessly from a centralized admin panel.' },
  { img: multiChanelImg, title: 'Multi-Channel Support', desc: 'Handle requests from email, web forms, and chat in one unified platform.' },
  { img: securityImg, title: 'Enterprise Security', desc: 'ISO 27001 certified with role-based access control and end-to-end encryption.' },
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
  { text: 'AI-powered ticket classification saves us hours every day. The accuracy is impressive.', name: 'David Tran', role: 'CTO · FPT Retail', avatar: '👨‍🚀' },
  { text: 'Onboarding was smooth and the team adapted in just one week. Highly recommended.', name: 'Lisa Nguyen', role: 'Operations Lead · MoMo', avatar: '👩‍🎨' },
  { text: 'SLA compliance went from 72% to 98% after switching to ServiceDesk. Game changer.', name: 'James Pham', role: 'Service Manager · VNPT', avatar: '👷‍♂️' },
  { text: 'The real-time dashboard gives us complete visibility over our support pipeline.', name: 'Emma Vo', role: 'Director · Techcombank', avatar: '👩‍💻' },
  { text: 'Multi-channel support unified our email, chat, and phone workflows into one platform.', name: 'Ryan Hoang', role: 'Support Director · Shopee', avatar: '🧑‍💼' },
  { text: 'Customers love the self-service portal. Ticket deflection increased by 40%.', name: 'Mai Bui', role: 'Product Manager · Tiki', avatar: '👩‍🔧' },
];

export default LandingPage;
