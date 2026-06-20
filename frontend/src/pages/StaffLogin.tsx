import { useState } from 'react';
import { Shield, Lock, User as UserIcon, Loader2, ArrowRight, LayoutDashboard, Database, Activity } from 'lucide-react';
import { useAuth } from '../context/auth';
import { Link, useNavigate } from 'react-router-dom';
import { getErrorMessage, loginUser, registerUser } from '../api/apiClient';
import logoUrl from '../assets/logo_nobg.png';

const FEATURES = [
  { icon: <LayoutDashboard size={22} className="text-purple-300" />, text: 'Unified agent workspace' },
  { icon: <Database size={22} className="text-emerald-300" />, text: 'Full asset & ticket control' },
  { icon: <Activity size={22} className="text-blue-300" />, text: 'Real-time metrics & reporting' },
];

const formatStaffAuthError = (err: unknown) => {
  const message = getErrorMessage(err, 'We could not complete your staff sign in. Please try again.');

  if (message.toLowerCase().includes('pending admin approval')) {
    return 'Your staff account is pending admin approval. Please wait for an admin to approve it before signing in.';
  }

  if (message.toLowerCase().includes('deactivated')) {
    return 'Your staff account is inactive. Please contact an administrator.';
  }

  return message;
};

const StaffLogin = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [isLoginTab, setIsLoginTab] = useState(true);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [agentType, setAgentType] = useState('SUPPORT');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsLoading(true);

    try {
      if (isLoginTab) {
        const authData = await loginUser(username, password);
        const userData = authData.user;
        if (userData.role !== 'ADMIN' && userData.role !== 'AGENT') {
          setError('This is the Staff Portal. Customers should sign in from the Customer Portal.');
          return;
        }
        login({ id: userData.id, role: userData.role, name: userData.name, username: userData.username, agentType: userData.agentType, status: userData.status, token: authData.token });
        navigate(userData.role === 'ADMIN' ? '/admin/dashboard' : '/staff/dashboard');
      } else {
        await registerUser({ username, password, name, email, phone, role: 'AGENT', agentType });
        setSuccess('Agent registration submitted. Your account is pending admin approval before staff access is enabled.');
        setIsLoginTab(true);
        setUsername('');
        setPassword('');
      }
    } catch (err: unknown) {
      setError(formatStaffAuthError(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex items-center justify-center p-4 sm:p-8 relative overflow-hidden transition-colors duration-500">
      {/* Ambient Background Orbs */}
      <div className="absolute top-[-10%] right-[-10%] w-[40vw] h-[40vw] max-w-[600px] max-h-[600px] bg-purple-500/20 dark:bg-purple-600/20 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[80px] sm:blur-[120px] animate-pulse" style={{ animationDuration: '4s' }}></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[40vw] h-[40vw] max-w-[600px] max-h-[600px] bg-emerald-500/10 dark:bg-emerald-600/10 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[80px] sm:blur-[120px] animate-pulse" style={{ animationDuration: '5s', animationDelay: '1s' }}></div>

      <div className="relative z-10 w-full max-w-[1100px] bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl border border-white/50 dark:border-slate-700/50 rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col-reverse lg:flex-row">

        {/* Left Side: Form */}
        <div className="w-full lg:w-7/12 p-8 sm:p-12 xl:p-16 flex flex-col justify-center bg-white/40 dark:bg-slate-900/40">
          <div className="max-w-[420px] w-full mx-auto">
            {/* Mobile Header */}
            <div className="lg:hidden flex items-center justify-between mb-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center shadow-lg">
                  <img src={logoUrl} alt="Logo" className="w-6 h-6 object-contain" />
                </div>
                <span className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Staff Console</span>
              </div>
              <Link to="/login" className="text-xs font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">Customer</Link>
            </div>

            <div className="mb-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-200/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 text-xs font-bold uppercase tracking-wider mb-4 border border-slate-300/50 dark:border-slate-700/50 shadow-sm">
                Secure Access
              </div>
              <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-2 tracking-tight">
                {isLoginTab ? 'Agent Sign In' : 'Agent Registration'}
              </h2>
              <p className="text-slate-500 dark:text-slate-400 font-medium">
                {isLoginTab ? 'Authenticate to access the workspace.' : 'Request access to the staff portal.'}
              </p>
            </div>

            <div className="flex p-1.5 bg-slate-200/50 dark:bg-slate-800/50 backdrop-blur-sm rounded-2xl mb-8 border border-slate-300/50 dark:border-slate-700/50 shadow-inner">
              <button
                type="button"
                className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all duration-300 ${isLoginTab ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-md ring-1 ring-slate-200/50 dark:ring-slate-600/50' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                onClick={() => { setIsLoginTab(true); setError(null); setSuccess(null); }}
              >
                Sign In
              </button>
              <button
                type="button"
                className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all duration-300 ${!isLoginTab ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-md ring-1 ring-slate-200/50 dark:ring-slate-600/50' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                onClick={() => { setIsLoginTab(false); setError(null); setSuccess(null); }}
              >
                Register
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-4 bg-red-50/80 dark:bg-red-500/10 backdrop-blur-md border border-red-200 dark:border-red-500/30 rounded-2xl text-red-600 dark:text-red-400 text-sm font-semibold flex items-center gap-3">
                  <Shield size={16} className="shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {success && (
                <div className="p-4 bg-emerald-50/80 dark:bg-emerald-500/10 backdrop-blur-md border border-emerald-200 dark:border-emerald-500/30 rounded-2xl text-emerald-600 dark:text-emerald-400 text-sm font-semibold flex items-center gap-3">
                  <Shield size={16} className="shrink-0" />
                  <span>{success}</span>
                </div>
              )}

              {!isLoginTab && (
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Full Name</label>
                  <div className="relative group">
                    <UserIcon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-purple-500 transition-colors" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 bg-slate-100/50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none text-slate-900 dark:text-white transition-all backdrop-blur-sm shadow-sm"
                      placeholder="Jane Doe"
                    />
                  </div>
                </div>
              )}

              {!isLoginTab && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Email</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-100/50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none text-slate-900 dark:text-white transition-all backdrop-blur-sm shadow-sm"
                      placeholder="name@company.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Phone</label>
                    <input
                      type="text"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-100/50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none text-slate-900 dark:text-white transition-all backdrop-blur-sm shadow-sm"
                      placeholder="+1 234 567"
                    />
                  </div>
                </div>
              )}

              {!isLoginTab && (
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Agent Role</label>
                  <select
                    value={agentType}
                    onChange={(e) => setAgentType(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-100/50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none text-slate-900 dark:text-white transition-all backdrop-blur-sm shadow-sm appearance-none cursor-pointer"
                  >
                    <option value="SUPPORT">Support Specialist</option>
                    <option value="DEV">Developer</option>
                    <option value="TESTER">QA / Tester</option>
                    <option value="SYSTEM">System Engineer</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Staff Username</label>
                <div className="relative group">
                  <UserIcon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-purple-500 transition-colors" />
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-slate-100/50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none text-slate-900 dark:text-white transition-all backdrop-blur-sm shadow-sm"
                    placeholder="staff.username"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Password</label>
                <div className="relative group">
                  <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-purple-500 transition-colors" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-slate-100/50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none text-slate-900 dark:text-white transition-all backdrop-blur-sm shadow-sm"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center items-center gap-2 py-3.5 mt-4 bg-slate-900 dark:bg-purple-600 hover:bg-slate-800 dark:hover:bg-purple-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-slate-900/20 dark:shadow-purple-600/20 active:scale-[0.98] disabled:opacity-70 disabled:pointer-events-none"
              >
                {isLoading ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <>
                    {isLoginTab ? 'Continue to Workspace' : 'Submit for Approval'}
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Right Side: Visual / Branding */}
        <div className="hidden lg:flex lg:w-5/12 relative p-12 flex-col justify-between overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 to-slate-800"></div>
          {/* Glass overlay */}
          <div className="absolute inset-0 bg-black/10 backdrop-blur-[2px]"></div>
          {/* Decorative circles */}
          <div className="absolute top-0 right-0 -mt-20 -mr-20 w-64 h-64 bg-purple-500/20 rounded-full blur-2xl"></div>
          <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-80 h-80 bg-emerald-500/20 rounded-full blur-3xl"></div>

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-16">
              <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-md border border-white/20 shadow-lg">
                <img src={logoUrl} alt="Logo" className="w-8 h-8 object-contain drop-shadow-md" />
              </div>
              <span className="text-2xl font-bold text-white tracking-tight drop-shadow-md">Staff Console</span>
            </div>

            <h1 className="text-4xl xl:text-5xl font-extrabold text-white mb-6 leading-[1.15] drop-shadow-sm">
              Manage operations <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-emerald-200">with precision.</span>
            </h1>
            <p className="text-slate-300 text-lg mb-12 max-w-sm leading-relaxed font-medium">
              The secure workspace for approved agents and administrators.
            </p>

            <div className="space-y-4">
              {FEATURES.map((f, i) => (
                <div key={i} className="flex items-center gap-4 p-4 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl transition-all duration-300 hover:bg-white/10 hover:-translate-y-1 hover:shadow-lg">
                  <div className="p-2.5 bg-white/5 rounded-xl shadow-inner">{f.icon}</div>
                  <span className="text-white font-medium text-sm xl:text-base">{f.text}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="relative z-10 mt-12 text-sm text-slate-400 font-medium flex justify-between items-center">
            <span>&copy; {new Date().getFullYear()} ServiceDesk SecOps</span>
            <Link to="/login" className="px-4 py-2 bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/10 rounded-xl transition-all font-bold text-white shadow-sm hover:shadow-md">
              Customer Portal
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffLogin;
