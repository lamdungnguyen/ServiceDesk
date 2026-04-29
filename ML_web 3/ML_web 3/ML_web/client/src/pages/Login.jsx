import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Lock, Mail, ArrowRight, BrainCircuit, Shield, BarChart3,
  Users, Eye, EyeOff, Loader2
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, login } = useAuth();

  // If already logged in, redirect to correct starting page
  useEffect(() => {
    if (isAuthenticated && user) {
      const normalizedRole = String(user.role || "").trim().toLowerCase();
      const isAdmin = normalizedRole === "admin" || normalizedRole === "leader";
      if (isAdmin) {
        navigate("/", { replace: true });
      } else {
        navigate("/support", { replace: true });
      }
    }
  }, [isAuthenticated, user, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const userData = await login(email, password);

      const from = location.state?.from?.pathname;
      const normalizedRole = String(userData?.role || "").trim().toLowerCase();
      const isAdmin = normalizedRole === "admin" || normalizedRole === "leader";
      if (isAdmin) {
        navigate("/", { replace: true });
      } else {
        navigate("/support", { replace: true });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const features = [
    {
      icon: BrainCircuit,
      title: "AI-Powered Analytics",
      desc: "Sentiment analysis & NLP insights from customer conversations"
    },
    {
      icon: BarChart3,
      title: "Performance Tracking",
      desc: "Real-time KPI monitoring and predictive scoring for agents"
    },
    {
      icon: Users,
      title: "Team Management",
      desc: "Manage teams, assignments, and workload distribution"
    },
    {
      icon: Shield,
      title: "Enterprise Security",
      desc: "Role-based access control with JWT authentication"
    },
  ];

  return (
    <div className="min-h-screen flex bg-slate-50">

      {/* ─── LEFT PANEL — branding & features ─── */}
      <div className="hidden lg:flex lg:w-[55%] xl:w-[52%] relative overflow-hidden">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-pink-600 via-rose-600 to-fuchsia-700" />

        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-white/5 rounded-full translate-y-1/3 -translate-x-1/4" />
        <div className="absolute top-1/2 right-1/4 w-[200px] h-[200px] bg-white/5 rounded-full" />

        {/* Grid pattern overlay */}
        <div className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(circle, white 1px, transparent 1px)`,
            backgroundSize: '32px 32px'
          }}
        />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-12 xl:p-16 w-full">
          {/* Top — Logo & Tagline */}
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-11 h-11 bg-white/15 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/20">
                <BrainCircuit className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white tracking-tight">ML Workforce</h1>
                <p className="text-[11px] text-pink-200 font-semibold uppercase tracking-widest">CS Analytics Platform</p>
              </div>
            </div>
          </div>

          {/* Center — Hero */}
          <div className="space-y-8">
            <div>
              <h2 className="text-4xl xl:text-5xl font-extrabold text-white leading-tight tracking-tight">
                Intelligent<br />
                Customer Service<br />
                <span className="text-pink-200">Analytics</span>
              </h2>
              <p className="text-pink-100/80 mt-4 text-lg leading-relaxed max-w-md">
                Harness machine learning to analyze conversations, evaluate agent performance, and predict customer satisfaction in real-time.
              </p>
            </div>

            {/* Feature cards */}
            <div className="grid grid-cols-2 gap-4">
              {features.map((feature, i) => (
                <div
                  key={i}
                  className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10 hover:bg-white/15 transition-colors group"
                >
                  <feature.icon className="w-5 h-5 text-pink-200 mb-2.5 group-hover:text-white transition-colors" />
                  <h3 className="text-white font-bold text-sm mb-1">{feature.title}</h3>
                  <p className="text-pink-200/70 text-xs leading-relaxed">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom — Stats */}
          <div className="flex items-center gap-8 pt-6 border-t border-white/10">
            <div>
              <p className="text-2xl font-extrabold text-white">98%</p>
              <p className="text-xs text-pink-200/70">Analysis Accuracy</p>
            </div>
            <div className="w-px h-10 bg-white/15" />
            <div>
              <p className="text-2xl font-extrabold text-white">&lt;2s</p>
              <p className="text-xs text-pink-200/70">Response Time</p>
            </div>
            <div className="w-px h-10 bg-white/15" />
            <div>
              <p className="text-2xl font-extrabold text-white">24/7</p>
              <p className="text-xs text-pink-200/70">Real-time Monitoring</p>
            </div>
          </div>
        </div>
      </div>

      {/* ─── RIGHT PANEL — login form ─── */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 relative">
        {/* Subtle background decoration */}
        <div className="absolute -top-32 -right-32 w-[400px] h-[400px] rounded-full bg-pink-50 blur-3xl pointer-events-none opacity-60" />
        <div className="absolute -bottom-32 -left-32 w-[400px] h-[400px] rounded-full bg-rose-50 blur-3xl pointer-events-none opacity-60" />

        <div className="w-full max-w-[420px] relative z-10">
          {/* Mobile logo (hidden on desktop) */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-pink-600 to-rose-600 mb-4 shadow-lg shadow-pink-500/25">
              <BrainCircuit className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">ML Workforce</h1>
            <p className="text-xs uppercase tracking-widest font-bold text-pink-500 mt-1">CS Analytics Platform</p>
          </div>

          {/* Welcome text */}
          <div className="mb-8">
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Welcome back</h2>
            <p className="text-slate-500 mt-2">Sign in to your account to continue</p>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-rose-50 text-rose-600 border border-rose-200 text-sm font-medium px-4 py-3 rounded-xl mb-6 flex items-center gap-2 animate-fade-in">
              <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" /><path d="M12 8v4" /><path d="M12 16h.01" />
              </svg>
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-5">

            {/* Email */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-1.5 block">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Mail className="h-[18px] w-[18px] text-slate-400" />
                </div>
                <input
                  type="email"
                  autoFocus
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl py-3 pl-11 pr-4 text-slate-800 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all placeholder:text-slate-400"
                  placeholder="you@falcongames.com"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-1.5 block">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Lock className="h-[18px] w-[18px] text-slate-400" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl py-3 pl-11 pr-12 text-slate-800 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all placeholder:text-slate-400"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
                </button>
              </div>
            </div>

            {/* Remember + Forgot */}
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-slate-300 text-pink-600 focus:ring-pink-500 cursor-pointer"
                />
                <span className="text-slate-600 group-hover:text-slate-800 transition-colors">Remember me</span>
              </label>
              <button type="button" className="text-pink-600 hover:text-pink-700 font-semibold transition-colors">
                Forgot password?
              </button>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl font-bold text-white transition-all shadow-lg shadow-pink-500/25 text-[15px] ${
                loading
                  ? "bg-pink-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-pink-500/30 active:translate-y-0"
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Authenticating...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-10 pt-6 border-t border-slate-100">
            <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
              <Shield className="w-3.5 h-3.5" />
              <span>Secured with end-to-end encryption</span>
            </div>
            <p className="text-center text-[11px] text-slate-400 mt-3">
              © {new Date().getFullYear()} ML Workforce Analytics. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
