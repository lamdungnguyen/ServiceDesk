import { useState, useRef, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Bell, LogOut, AlertCircle, Info, MessageSquare } from 'lucide-react';
import { useAuth } from '../context/auth';
import { getNotifications, markNotificationAsRead, type Notification } from '../api/apiClient';
import { connectWebSocket, subscribeToNotifications } from '../services/websocket';
import logoUrl from '../assets/logo.png';

function formatRelative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return new Date(iso).toLocaleDateString();
}

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const notifRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const data = await getNotifications();
      setNotifications(data);
    } catch (err) {
      console.warn('Failed to fetch notifications', err);
    }
  }, [user]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // WebSocket real-time notifications
  useEffect(() => {
    if (!user) return;
    connectWebSocket().catch(() => {});
    const unsub = subscribeToNotifications(user.id, (notif) => {
      setNotifications(prev => [notif as Notification, ...prev]);
    });
    return unsub;
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const extractTicketId = (message: string): number | null => {
    const match = message.match(/(?:TKT-|ticket\s*#?|#)(\d+)/i);
    return match ? Number(match[1]) : null;
  };

  const handleNotificationClick = async (n: Notification) => {
    if (!n.isRead) {
      try {
        await markNotificationAsRead(n.id);
        setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, isRead: true } : x));
      } catch (err) {
        console.error(err);
      }
    }
    const ticketId = n.ticketId || extractTicketId(n.message);
    if (ticketId) {
      setShowNotifications(false);
      // Route based on user role
      if (user?.role === 'AGENT') {
        navigate(`/staff/dashboard?ticketId=${ticketId}`);
      } else if (user?.role === 'ADMIN') {
        navigate(`/admin/dashboard?tickets&ticketId=${ticketId}`);
      } else {
        navigate(`/my-tickets?ticketId=${ticketId}`);
      }
    }
  };

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
        
        {user && (
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
        )}

        <div className="flex items-center gap-4">
          {user && (
            <div className="relative" ref={notifRef}>
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className={`relative p-2 transition-colors rounded-full ${showNotifications ? 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
              >
                <Bell size={20} />
                {(() => { const c = notifications.filter(n => !n.isRead).length; return c > 0 ? (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full border-2 border-white dark:border-slate-900 px-1">
                    {c > 99 ? '99+' : c}
                  </span>
                ) : null; })()}
              </button>
              
              {/* Notifications Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-200 z-50">
                  <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
                    <h3 className="font-bold text-sm text-slate-800 dark:text-white">Notifications</h3>
                    {notifications.filter(n => !n.isRead).length > 0 && (
                      <span className="text-[10px] font-semibold text-red-500 bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded-full">
                        {notifications.filter(n => !n.isRead).length} unread
                      </span>
                    )}
                  </div>
                  <div className="max-h-[300px] overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-sm text-slate-500">No notifications</div>
                    ) : (
                      notifications.slice(0, 5).map(n => (
                        <div 
                          key={n.id} 
                          onClick={() => handleNotificationClick(n)}
                          className={`px-4 py-3 border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer flex gap-3 ${!n.isRead ? 'bg-primary-50/50 dark:bg-primary-900/10' : ''}`}
                        >
                          <div className={`mt-0.5 shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${n.type === 'INFO' ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400' : n.type === 'MESSAGE' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : n.type === 'WARNING' ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'}`}>
                            {n.type === 'INFO' ? <Info size={14} /> : n.type === 'MESSAGE' ? <MessageSquare size={14} /> : n.type === 'WARNING' ? <AlertCircle size={14} /> : <AlertCircle size={14} />}
                          </div>
                          <div>
                            <p className={`text-sm ${!n.isRead ? 'font-semibold text-slate-800 dark:text-white' : 'text-slate-600 dark:text-slate-300'}`}>{n.message}</p>
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">{formatRelative(n.createdAt)}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 text-center">
                    <button
                      onClick={() => { setShowNotifications(false); navigate('/notifications'); }}
                      className="text-xs font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 transition-colors"
                    >
                      View All Notifications
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
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
