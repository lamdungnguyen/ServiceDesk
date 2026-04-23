
import { Link, useNavigate } from 'react-router-dom';
import { Search, Bell, User, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import logoUrl from '../assets/logo.png';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const handleLogout = () => {
    const isStaff = user?.role === 'ADMIN' || user?.role === 'AGENT';
    logout();
    navigate(isStaff ? '/staff/login' : '/login');
  };

  return (
    <nav className="glass sticky top-0 z-50 px-6 py-3 w-full">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link to={user ? (user.role === 'ADMIN' ? "/admin/dashboard" : user.role === 'CUSTOMER' ? "/my-tickets" : "/staff/dashboard") : "/"} className="flex items-center gap-3 group">
          <img src={logoUrl} alt="ServiceDesk Logo" className="w-10 h-10 object-contain drop-shadow-md group-hover:scale-105 transition-transform" />
          <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-slate-500 dark:from-slate-100 dark:to-slate-400">
            ServiceDesk
          </span>
        </Link>
        
        <div className="flex-1 max-w-md mx-8 hidden md:block">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search tickets..." 
              className="w-full bg-slate-100 dark:bg-slate-800/50 border-none rounded-full py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary-500/50 outline-none transition-all placeholder:text-slate-400 dark:text-slate-200"
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button className="relative p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors rounded-full hover:bg-slate-100 dark:hover:bg-slate-800">
            <Bell size={20} />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-900"></span>
          </button>
          {user ? (
            <div className="flex items-center gap-3 border-l border-slate-200 dark:border-slate-700 pl-4 ml-2">
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-primary-500 to-purple-500 p-[2px] cursor-pointer shadow-sm">
                <div className="w-full h-full bg-white dark:bg-slate-800 rounded-full flex items-center justify-center overflow-hidden font-bold text-primary-600 dark:text-primary-400 text-sm">
                  {user.name.charAt(0)}
                </div>
              </div>
              <div className="hidden md:block">
                <div className="text-sm font-semibold text-slate-800 dark:text-white leading-tight">{user.name}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  {user.role} {user.agentType && <span className="opacity-70">({user.agentType})</span>}
                </div>
              </div>
              <button 
                onClick={handleLogout}
                className="p-2 ml-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-full transition-colors"
                title="Logout"
              >
                <LogOut size={18} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3 border-l border-slate-200 dark:border-slate-700 pl-4 ml-2">
              <Link to="/login" className="text-sm font-semibold text-slate-600 hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400 transition-colors">
                Sign In
              </Link>
              <Link to="/staff/login" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors shadow-sm">
                Staff Portal
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
