import { useState } from 'react';
import { User as UserIcon, Lock, Loader2, Mail, ArrowRight, CheckCircle2, HeadphonesIcon, Zap } from 'lucide-react';
import { useAuth } from '../context/auth';
import { useNavigate, Link } from 'react-router-dom';
import { getErrorMessage, loginUser, registerUser } from '../api/apiClient';
import logoUrl from '../assets/logo.png';

const FEATURES = [
  { icon: <CheckCircle2 size={20} className="text-blue-400" />, text: 'Track all your support tickets in one place' },
  { icon: <HeadphonesIcon size={20} className="text-blue-400" />, text: 'Chat directly with assigned support agents' },
  { icon: <Zap size={20} className="text-blue-400" />, text: 'Get real-time status updates on your requests' },
];

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
        const userData = await loginUser(username, password);
        if (userData.role !== 'CUSTOMER') {
          setError('This portal is for customers only. Please use the Staff Portal.');
          return;
        }
        login({ id: userData.id, role: userData.role, name: userData.name, username: userData.username, status: userData.status });
        navigate('/my-tickets');
      } else {
        const userData = await registerUser({ username, password, name, email, role: 'CUSTOMER' });
        login({ id: userData.id, role: userData.role, name: userData.name, username: userData.username, status: userData.status });
        navigate('/my-tickets');
      }
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Something went wrong. Please try again.'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex">
      {/* Left: Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 xl:p-20">
        <div className="max-w-[420px] w-full">
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <img src={logoUrl} alt="Logo" className="w-10 h-10 object-contain" />
            <span className="text-xl font-bold text-slate-900">ServiceDesk</span>
          </div>

          <div className="mb-10">
            <h2 className="text-3xl font-bold text-slate-900 mb-2">
              {isLoginTab ? 'Welcome back' : 'Create your account'}
            </h2>
            <p className="text-slate-500 leading-relaxed">
              {isLoginTab ? 'Sign in to track your support tickets.' : 'Register to submit and manage your support requests.'}
            </p>
          </div>

          <div className="flex p-1 bg-slate-100 rounded-xl mb-8">
            <button className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${isLoginTab ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              onClick={() => { setIsLoginTab(true); setError(null); }}>Sign In</button>
            <button className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${!isLoginTab ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              onClick={() => { setIsLoginTab(false); setError(null); }}>Register</button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm font-medium">{error}</div>
            )}

            {!isLoginTab && (
              <>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Full Name</label>
                  <div className="relative">
                    <UserIcon size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type="text" value={name} onChange={e => setName(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none text-slate-900 transition-all"
                      placeholder="Jane Doe" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Email Address</label>
                  <div className="relative">
                    <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none text-slate-900 transition-all"
                      placeholder="jane@example.com" />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Username</label>
              <div className="relative">
                <UserIcon size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="text" required value={username} onChange={e => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none text-slate-900 transition-all"
                  placeholder="johndoe" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-semibold text-slate-700">Password</label>
                {isLoginTab && <a href="#" className="text-xs text-blue-600 hover:underline font-medium">Forgot password?</a>}
              </div>
              <div className="relative">
                <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none text-slate-900 transition-all"
                  placeholder="••••••••" />
              </div>
            </div>

            <button type="submit" disabled={isLoading}
              className="w-full flex justify-center items-center gap-2 py-3.5 mt-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-base transition-all shadow-lg shadow-blue-500/20 active:scale-[0.98] disabled:opacity-70 disabled:pointer-events-none">
              {isLoading ? <Loader2 size={20} className="animate-spin" /> : <>{isLoginTab ? 'Sign In to Portal' : 'Create Account'}<ArrowRight size={18} /></>}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-slate-500">
            Are you a staff member?{' '}
            <Link to="/staff/login" className="font-bold text-blue-600 hover:underline">Go to Staff Portal →</Link>
          </p>
        </div>
      </div>

      {/* Right: Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-slate-900 relative flex-col overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-[-20%] right-[-20%] w-[60%] h-[60%] bg-blue-600 rounded-full mix-blend-multiply filter blur-[120px] opacity-30"></div>
          <div className="absolute bottom-[-20%] left-[-10%] w-[50%] h-[50%] bg-indigo-600 rounded-full mix-blend-multiply filter blur-[120px] opacity-30"></div>
        </div>
        <div className="relative z-10 p-16 flex flex-col justify-center h-full">
          <div className="flex items-center gap-3 mb-16">
            <img src={logoUrl} alt="Logo" className="w-12 h-12 object-contain drop-shadow-lg" />
            <span className="text-2xl font-bold text-white">ServiceDesk</span>
          </div>
          <h1 className="text-5xl font-extrabold text-white mb-6 leading-tight">Your support,<br />our priority.</h1>
          <p className="text-lg text-slate-400 mb-12 max-w-md leading-relaxed">
            One platform to submit, track, and resolve all your IT and customer support needs.
          </p>
          <div className="space-y-5">
            {FEATURES.map((f, i) => (
              <div key={i} className="flex items-center gap-4 p-4 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl">
                <div className="p-2 bg-blue-500/20 rounded-xl">{f.icon}</div>
                <span className="text-slate-300 font-medium">{f.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
