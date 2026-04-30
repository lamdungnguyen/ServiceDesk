import { useState, useEffect, useRef } from 'react';
import { Mail, Phone, Briefcase, Shield, Clock } from 'lucide-react';
import { getAllUsers, type UserPayload } from '../api/apiClient';

interface UserProfilePopoverProps {
  userId: number;
  userName: string;
  children: React.ReactNode;
}

const UserProfilePopover = ({ userId, userName, children }: UserProfilePopoverProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<UserPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleOpen = async () => {
    setIsOpen(prev => !prev);
    if (!user && !isOpen) {
      setLoading(true);
      try {
        const users = await getAllUsers();
        const found = users.find(u => u.id === userId);
        if (found) setUser(found);
      } catch (err) {
        console.error('Failed to fetch user', err);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="relative inline-block" ref={popoverRef}>
      <div onClick={handleOpen} className="cursor-pointer inline-block">
        {children}
      </div>

      {isOpen && (
        <div className="absolute z-[100] mt-2 w-64 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-in fade-in zoom-in-95 duration-200 left-0">
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 h-12 w-full"></div>
          <div className="px-4 pb-4 relative">
            <div className="w-12 h-12 rounded-full bg-white dark:bg-slate-800 border-4 border-white dark:border-slate-900 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-lg absolute -top-6 shadow-sm">
              {(userName || '?').charAt(0).toUpperCase()}
            </div>
            
            <div className="pt-8">
              <h4 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
                {userName || 'Unknown'}
                {user?.role === 'ADMIN' && <Shield size={12} className="text-amber-500" />}
              </h4>
              <p className="text-xs font-medium text-slate-500 mb-3">{user ? user.role : 'Loading...'}</p>
              
              {loading ? (
                <div className="space-y-2 animate-pulse mt-2">
                  <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-full"></div>
                  <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-2/3"></div>
                </div>
              ) : user ? (
                <div className="space-y-2 mt-3 text-xs text-slate-600 dark:text-slate-400">
                  {user.email && (
                    <div className="flex items-center gap-2">
                      <Mail size={12} className="text-slate-400 shrink-0" />
                      <span className="truncate">{user.email}</span>
                    </div>
                  )}
                  {user.phone && (
                    <div className="flex items-center gap-2">
                      <Phone size={12} className="text-slate-400 shrink-0" />
                      <span>{user.phone}</span>
                    </div>
                  )}
                  {user.agentType && (
                    <div className="flex items-center gap-2">
                      <Briefcase size={12} className="text-slate-400 shrink-0" />
                      <span>{user.agentType}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Clock size={12} className="text-slate-400 shrink-0" />
                    <span>Status: <span className={`font-semibold ${user.status === 'ACTIVE' ? 'text-emerald-500' : 'text-amber-500'}`}>{user.status}</span></span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-400 mt-2">No additional details found.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfilePopover;
