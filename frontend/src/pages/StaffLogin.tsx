import { useState } from 'react';
import { Shield, Lock, User as UserIcon, Loader2, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { loginUser, registerUser } from '../api/apiClient';
import logoUrl from '../assets/logo.png';

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
        const userData = await loginUser(username, password);
        if (userData.role !== 'ADMIN' && userData.role !== 'AGENT') {
          setError('This portal is for staff only. Please use the Customer Portal.');
          return;
        }
        login({ id: userData.id, role: userData.role, name: userData.name, username: userData.username, agentType: userData.agentType, status: userData.status });
        navigate(userData.role === 'ADMIN' ? '/admin/dashboard' : '/staff/dashboard');
      } else {
        // Register a new AGENT (always PENDING)
        await registerUser({ username, password, name, email, phone, role: 'AGENT', agentType });
        setSuccess('Registration successful! Your account is pending Admin approval. You will be notified once approved.');
        setIsLoginTab(true);
        setUsername(''); setPassword('');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.response?.data || err.message;
      setError(typeof msg === 'string' ? msg : 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Left Branding Section (Hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 bg-slate-900 relative flex-col justify-between overflow-hidden">
        {/* Background Effects */}
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600 rounded-full mix-blend-multiply filter blur-[100px] opacity-40"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600 rounded-full mix-blend-multiply filter blur-[100px] opacity-40"></div>
        </div>

        <div className="relative z-10 p-12">
          <img src={logoUrl} alt="Logo" className="w-12 h-12 object-contain drop-shadow-lg mb-8" />
          <h1 className="text-4xl font-bold text-white mb-6 leading-tight">
            ServiceDesk <br/> Enterprise Console
          </h1>
          <p className="text-lg text-slate-400 max-w-md">
            Manage your support operations securely. Authorized personnel only.
          </p>
        </div>

        <div className="relative z-10 p-12 bg-slate-800/30 border-t border-slate-700/50 backdrop-blur-sm">
          <div className="flex items-center gap-4 text-slate-300">
            <Shield className="text-blue-500" size={24} />
            <div>
              <div className="font-bold">Secure Access</div>
              <div className="text-sm text-slate-500">SSO & Multi-factor authentication enabled</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Login Section */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 xl:p-24 bg-white relative">
        <div className="max-w-[420px] w-full">
          
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <img src={logoUrl} alt="Logo" className="w-10 h-10 object-contain drop-shadow-md" />
            <span className="text-xl font-bold text-slate-900">ServiceDesk</span>
          </div>

          <div className="mb-10">
            <h2 className="text-3xl font-bold text-slate-900 mb-2">
              {isLoginTab ? 'Sign In' : 'Create Agent Account'}
            </h2>
            <p className="text-slate-500">
              {isLoginTab ? 'Enter your credentials to access the workspace.' : 'Register a new support agent profile.'}
            </p>
          </div>

          {/* Tab Selector */}
          <div className="flex p-1 bg-slate-100 rounded-xl mb-8">
            <button 
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${isLoginTab ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              onClick={() => { setIsLoginTab(true); setError(null); }}
            >
              Sign In
            </button>
            <button 
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${!isLoginTab ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              onClick={() => { setIsLoginTab(false); setError(null); }}
            >
              Register Agent
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm flex items-start gap-3">
                <Shield size={16} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="p-4 bg-green-50 border border-green-100 rounded-xl text-green-600 text-sm flex items-start gap-3">
                <Shield size={16} className="shrink-0 mt-0.5" />
                <span>{success}</span>
              </div>
            )}

            {!isLoginTab && (
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Full Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <UserIcon size={18} />
                  </div>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-white border border-slate-300 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none text-slate-900 placeholder-slate-400 transition-all shadow-sm"
                    placeholder="Jane Doe"
                  />
                </div>
              </div>
            )}

            {!isLoginTab && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none text-slate-900 placeholder-slate-400 transition-all shadow-sm"
                    placeholder="jane@company.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Phone (Ext)</label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none text-slate-900 placeholder-slate-400 transition-all shadow-sm"
                    placeholder="+1 234 567"
                  />
                </div>
              </div>
            )}

            {!isLoginTab && (
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Agent Role</label>
                <select
                  value={agentType}
                  onChange={(e) => setAgentType(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none text-slate-900 appearance-none transition-all shadow-sm cursor-pointer"
                >
                  <option value="SUPPORT">Support Specialist</option>
                  <option value="DEV">Developer</option>
                  <option value="TESTER">QA / Tester</option>
                  <option value="SYSTEM">System Engineer</option>
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Username</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <UserIcon size={18} />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white border border-slate-300 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none text-slate-900 placeholder-slate-400 transition-all shadow-sm"
                  placeholder="admin"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock size={18} />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white border border-slate-300 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none text-slate-900 placeholder-slate-400 transition-all shadow-sm"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center items-center gap-2 py-3.5 mt-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold transition-all active:scale-[0.98] disabled:opacity-70 disabled:pointer-events-none"
            >
              {isLoading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <>
                  {isLoginTab ? 'Continue to Workspace' : 'Create Account'}
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
          
        </div>
      </div>
    </div>
  );
};

export default StaffLogin;
