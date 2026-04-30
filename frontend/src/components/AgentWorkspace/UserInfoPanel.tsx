import { useEffect, useState } from 'react';
import { getUserDetail, type UserDetail } from '../../api/apiClient';
import { User, Mail, Ticket, AlertCircle, Loader2 } from 'lucide-react';

interface UserInfoPanelProps {
  userId: number | null;
}

function getInitials(name?: string) {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

const AVATAR_COLORS = ['from-blue-500 to-indigo-600', 'from-emerald-500 to-teal-600', 'from-purple-500 to-pink-600', 'from-amber-500 to-orange-600'];
function avatarColor(name?: string) {
  if (!name) return AVATAR_COLORS[0];
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
}

const UserInfoPanel = ({ userId }: UserInfoPanelProps) => {
  const [userDetail, setUserDetail] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId) {
      setUserDetail(null);
      return;
    }

    setLoading(true);
    getUserDetail(userId)
      .then(setUserDetail)
      .catch(() => setUserDetail(null))
      .finally(() => setLoading(false));
  }, [userId]);

  if (!userId) {
    return (
      <div className="w-72 flex-shrink-0 border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 text-sm gap-2 transition-colors">
        <User size={32} strokeWidth={1.2} />
        <span>No reporter</span>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="w-72 flex-shrink-0 border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 flex items-center justify-center transition-colors">
        <Loader2 size={20} className="animate-spin text-slate-400" />
      </div>
    );
  }

  if (!userDetail) {
    return (
      <div className="w-72 flex-shrink-0 border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 text-sm gap-2 transition-colors">
        <AlertCircle size={28} strokeWidth={1.2} />
        <span>Unable to load</span>
      </div>
    );
  }

  return (
    <div className="w-72 flex-shrink-0 border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 overflow-y-auto transition-colors">
      {/* Header */}
      <div className="p-5 border-b border-slate-100 dark:border-slate-800">
        <div className="flex flex-col items-center text-center gap-3">
          <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${avatarColor(userDetail.name)} text-white flex items-center justify-center font-bold text-xl shadow-md`}>
            {getInitials(userDetail.name)}
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">{userDetail.name}</h3>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">@{userDetail.username}</span>
          </div>
        </div>
      </div>

      {/* Contact info */}
      <div className="p-4 space-y-3 border-b border-slate-100 dark:border-slate-800">
        {userDetail.email && (
          <div className="flex items-center gap-2.5 text-xs text-slate-600 dark:text-slate-400">
            <Mail size={13} className="text-slate-400 shrink-0" />
            <span className="truncate">{userDetail.email}</span>
          </div>
        )}
        {userDetail.phone && (
          <div className="flex items-center gap-2.5 text-xs text-slate-600 dark:text-slate-400">
            <User size={13} className="text-slate-400 shrink-0" />
            <span>{userDetail.phone}</span>
          </div>
        )}
      </div>

      {/* Ticket stats */}
      <div className="p-4 space-y-3">
        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ticket Stats</h4>
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl p-3 text-center transition-colors">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Ticket size={13} className="text-blue-500" />
            </div>
            <div className="text-lg font-bold text-slate-700 dark:text-slate-300">{userDetail.totalTickets}</div>
            <div className="text-[10px] text-slate-400 font-medium">Total</div>
          </div>
          <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl p-3 text-center transition-colors">
            <div className="flex items-center justify-center gap-1 mb-1">
              <AlertCircle size={13} className="text-amber-500" />
            </div>
            <div className="text-lg font-bold text-slate-700 dark:text-slate-300">{userDetail.openTickets}</div>
            <div className="text-[10px] text-slate-400 font-medium">Open</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserInfoPanel;
