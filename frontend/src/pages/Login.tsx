import { useState } from 'react';
import { User as UserIcon, Lock, Loader2, Mail, ArrowRight, HeadphonesIcon, Zap, Ticket } from 'lucide-react';
import { useAuth } from '../context/auth';
import { useNavigate, Link } from 'react-router-dom';
import { getErrorMessage, loginUser, registerUser } from '../api/apiClient';
import logoUrl from '../assets/logo_nobg.png';

const FEATURES = [
  { icon: <Ticket size={22} className="text-blue-200" />, text: 'Track support tickets seamlessly' },
  { icon: <HeadphonesIcon size={22} className="text-indigo-200" />, text: 'Direct chat with support agents' },
  { icon: <Zap size={22} className="text-purple-200" />, text: 'Real-time status updates' },
];

const formatCustomerAuthError = (err: unknown) => {
  const message = getErrorMessage(err, 'We could not complete your customer sign in. Please try again.');

  if (message.toLowerCase().includes('pending admin approval')) {
    return 'Your account is pending admin approval. Please wait for approval before signing in.';
  }

  if (message.toLowerCase().includes('deactivated')) {
    return 'Your customer account is inactive. Please contact support for help.';
  }

  return message;
};

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [isLoginTab, setIsLoginTab] = useState(true);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (isLoginTab) {
        const authData = await loginUser(username, password);
        const userData = authData.user;
        if (userData.role !== 'CUSTOMER') {
          setError('This is the Customer Portal. Staff members should sign in from the Staff Portal.');
          return;
        }
        login({ id: userData.id, role: userData.role, name: userData.name, username: userData.username, status: userData.status, token: authData.token });
        navigate('/my-tickets');
      } else {
        const authData = await registerUser({ username, password, name, email, role: 'CUSTOMER' });
        const userData = authData.user;
        if (userData.role !== 'CUSTOMER') {
          setError('Customer registration must create a customer account. Please try again.');
          return;
        }
        login({ id: userData.id, role: userData.role, name: userData.name, username: userData.username, status: userData.status, token: authData.token });
        navigate('/my-tickets');
      }
    } catch (err: unknown) {
      setError(formatCustomerAuthError(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4 sm:p-8 relative overflow-hidden transition-colors duration-500">
      {/* Ambient Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] max-w-[600px] max-h-[600px] bg-blue-400/20 dark:bg-blue-600/20 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[80px] sm:blur-[120px] animate-pulse" style={{ animationDuration: '4s' }}></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] max-w-[600px] max-h-[600px] bg-indigo-400/20 dark:bg-indigo-600/20 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[80px] sm:blur-[120px] animate-pulse" style={{ animationDuration: '5s', animationDelay: '1s' }}></div>
      <div className="absolute top-[20%] right-[20%] w-[20vw] h-[20vw] max-w-[300px] max-h-[300px] bg-purple-400/20 dark:bg-purple-600/20 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[60px] sm:blur-[100px] animate-pulse" style={{ animationDuration: '6s', animationDelay: '2s' }}></div>

      <div className="relative z-10 w-full max-w-[1100px] bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl border border-white/50 dark:border-slate-700/50 rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col lg:flex-row">

        {/* Left Side: Visual / Branding */}
        <div className="hidden lg:flex lg:w-5/12 relative p-12 flex-col justify-between overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-indigo-800"></div>
          {/* Glass overlay */}
          <div className="absolute inset-0 bg-white/10 backdrop-blur-[2px]"></div>
          {/* Decorative circles */}
          <div className="absolute top-0 right-0 -mt-20 -mr-20 w-64 h-64 bg-white/10 rounded-full blur-2xl"></div>
          <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-80 h-80 bg-black/10 rounded-full blur-3xl"></div>

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-16">
              <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-md border border-white/30 shadow-lg">
                <img src={logoUrl} alt="Logo" className="w-8 h-8 object-contain drop-shadow-md" />
              </div>
              <span className="text-2xl font-bold text-white tracking-tight drop-shadow-md">ServiceDesk</span>
            </div>

            <h1 className="text-4xl xl:text-5xl font-extrabold text-white mb-6 leading-[1.15] drop-shadow-sm">
              Support that <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-indigo-100">works for you.</span>
            </h1>
            <p className="text-blue-100 text-lg mb-12 max-w-sm leading-relaxed font-medium">
              Your centralized portal for submitting, tracking, and resolving IT requests with ease.
            </p>

            <div className="space-y-4">
              {FEATURES.map((f, i) => (
                <div key={i} className="flex items-center gap-4 p-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl transition-all duration-300 hover:bg-white/20 hover:-translate-y-1 hover:shadow-lg">
                  <div className="p-2.5 bg-white/10 rounded-xl shadow-inner">{f.icon}</div>
                  <span className="text-white font-medium text-sm xl:text-base">{f.text}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="relative z-10 mt-12 text-sm text-blue-200/80 font-medium flex justify-between items-center">
            <span>&copy; {new Date().getFullYear()} ServiceDesk Inc.</span>
            <Link to="/staff/login" className="px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 rounded-xl transition-all font-bold text-white shadow-sm hover:shadow-md">
              Staff Portal
            </Link>
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="w-full lg:w-7/12 p-8 sm:p-12 xl:p-16 flex flex-col justify-center bg-white/40 dark:bg-slate-900/40">
          <div className="max-w-[420px] w-full mx-auto">
            {/* Mobile Header */}
            <div className="lg:hidden flex items-center justify-between mb-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg">
                  <img src={logoUrl} alt="Logo" className="w-6 h-6 object-contain" />
                </div>
                <span className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">ServiceDesk</span>
              </div>
              <Link to="/staff/login" className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 px-3 py-1.5 rounded-lg">Staff</Link>
            </div>

            <div className="mb-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100/80 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 text-xs font-bold uppercase tracking-wider mb-4 border border-blue-200/50 dark:border-blue-500/30 shadow-sm">
                Customer Portal
              </div>
              <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-2 tracking-tight">
                {isLoginTab ? 'Welcome back' : 'Create an account'}
              </h2>
              <p className="text-slate-500 dark:text-slate-400 font-medium">
                {isLoginTab ? 'Sign in to track your tickets and messages.' : 'Register to get started with IT support.'}
              </p>
            </div>

            <div className="flex p-1.5 bg-slate-200/50 dark:bg-slate-800/50 backdrop-blur-sm rounded-2xl mb-8 border border-slate-300/50 dark:border-slate-700/50 shadow-inner">
              <button
                type="button"
                className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all duration-300 ${isLoginTab ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-md ring-1 ring-slate-200/50 dark:ring-slate-600/50' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                onClick={() => { setIsLoginTab(true); setError(null); }}
              >
                Sign In
              </button>
              <button
                type="button"
                className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all duration-300 ${!isLoginTab ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-md ring-1 ring-slate-200/50 dark:ring-slate-600/50' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                onClick={() => { setIsLoginTab(false); setError(null); }}
              >
                Register
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="p-4 bg-red-50/80 dark:bg-red-500/10 backdrop-blur-md border border-red-200 dark:border-red-500/30 rounded-2xl text-red-600 dark:text-red-400 text-sm font-semibold flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0"></div>
                  {error}
                </div>
              )}

              {!isLoginTab && (
                <div className="grid grid-cols-1 gap-5">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Full Name</label>
                    <div className="relative group">
                      <UserIcon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={e => setName(e.target.value)}
                        className="w-full pl-11 pr-4 py-3.5 bg-slate-100/50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-slate-900 dark:text-white transition-all backdrop-blur-sm shadow-sm"
                        placeholder="Jane Doe"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Email Address</label>
                    <div className="relative group">
                      <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                      <input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        className="w-full pl-11 pr-4 py-3.5 bg-slate-100/50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-slate-900 dark:text-white transition-all backdrop-blur-sm shadow-sm"
                        placeholder="jane@example.com"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Username</label>
                <div className="relative group">
                  <UserIcon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    className="w-full pl-11 pr-4 py-3.5 bg-slate-100/50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-slate-900 dark:text-white transition-all backdrop-blur-sm shadow-sm"
                    placeholder="customer.username"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Password</label>
                <div className="relative group">
                  <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full pl-11 pr-4 py-3.5 bg-slate-100/50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-slate-900 dark:text-white transition-all backdrop-blur-sm shadow-sm"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center items-center gap-2 py-4 mt-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl font-bold text-base transition-all shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 active:scale-[0.98] disabled:opacity-70 disabled:pointer-events-none"
              >
                {isLoading ? <Loader2 size={20} className="animate-spin" /> : <>{isLoginTab ? 'Sign In' : 'Create Account'}<ArrowRight size={18} /></>}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
