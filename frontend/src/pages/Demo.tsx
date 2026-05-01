import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Play, Shield, Zap, BarChart3, MessageSquare, CheckCircle } from 'lucide-react';
import logoUrl from '../assets/logo.png';
import heroImg from '../assets/hero.png';

const Demo = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navbar */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-white/80 backdrop-blur-xl shadow-sm border-b border-slate-200/50">
        <div className="max-w-7xl mx-auto px-10 h-24 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <img src={logoUrl} alt="ServiceDesk Logo" className="w-12 h-12 object-contain" />
            <span className="text-3xl font-bold text-slate-900">ServiceDesk</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/login" className="text-base font-semibold text-slate-700 hover:text-violet-600 transition-colors px-4 py-2.5">
              Sign In
            </Link>
            <button
              onClick={() => navigate('/?scrollToForm=1')}
              className="text-base font-semibold px-7 py-3.5 text-white rounded-full transition-all duration-300 hover:scale-105 hover:shadow-xl active:scale-95"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', boxShadow: '0 4px 20px -2px rgba(109,40,217,0.5)' }}
            >
              Try for Free
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-28 pb-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-100 border border-violet-200 mb-6">
            <Play size={14} className="text-violet-600 fill-violet-500" />
            <span className="text-xs font-bold tracking-widest uppercase text-violet-700">Product Demo</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 mb-4 leading-[1.1]">
            See ServiceDesk in Action
          </h1>
          <p className="text-xl text-slate-500 max-w-2xl mx-auto mb-10">
            A complete service management platform that transforms how your support team works.
          </p>
        </div>
      </section>

      {/* Dashboard Screenshot */}
      <section className="pb-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-violet-500/20 border border-slate-200">
            <img src={heroImg} alt="ServiceDesk Dashboard Interface" className="w-full h-auto" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent flex items-end justify-center pb-8">
              <div className="flex items-center gap-3 bg-white/90 backdrop-blur-md rounded-full px-6 py-3 shadow-lg">
                <Play size={18} className="text-violet-600 fill-violet-500" />
                <span className="text-sm font-bold text-slate-800">Interactive Dashboard</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Highlights */}
      <section className="pb-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Everything you need</h2>
            <p className="text-slate-500 max-w-xl mx-auto">One platform. All the tools your support team needs.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Zap, title: 'AI Classification', desc: 'Automatic ticket categorization and priority detection' },
              { icon: MessageSquare, title: 'Live Chat', desc: 'Real-time communication with customers and internal chat' },
              { icon: BarChart3, title: 'Analytics', desc: 'Detailed dashboards and team performance reports' },
              { icon: Shield, title: 'Secure', desc: 'Enterprise-grade security with RBAC access control' },
            ].map((f, i) => (
              <div key={i} className="group bg-white rounded-2xl p-8 border border-slate-200 hover:border-violet-300 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                <div className="w-14 h-14 rounded-xl bg-violet-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <f.icon size={28} className="text-violet-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{f.title}</h3>
                <p className="text-base text-slate-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="pb-24 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 p-10 md:p-16 text-center shadow-2xl shadow-indigo-500/30">
            <div className="absolute inset-0 opacity-10"
              style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
            <div className="relative z-10">
              <CheckCircle size={36} className="text-white/70 mx-auto mb-6" />
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Ready to get started?
              </h2>
              <p className="text-indigo-100 max-w-xl mx-auto mb-8">
                Try ServiceDesk today — no credit card required.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <button
                  onClick={() => navigate('/?scrollToForm=1')}
                  className="flex items-center gap-2 px-10 py-4 bg-white text-indigo-600 rounded-xl font-bold text-base hover:bg-indigo-50 hover:scale-105 active:scale-95 transition-all duration-300 shadow-lg"
                >
                  Try for Free
                  <ArrowRight size={20} />
                </button>
                <Link to="/" className="px-10 py-4 border-2 border-white/30 text-white rounded-xl font-bold text-base hover:bg-white/10 hover:scale-105 active:scale-95 transition-all duration-300">
                  Back to Home
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Demo;
