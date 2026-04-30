import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell, BellOff, Check, CheckCheck, Filter, SortAsc, SortDesc,
  MessageSquare, Info, AlertTriangle, AlertCircle, ArrowLeft, Search
} from 'lucide-react';
import { useAuth } from '../context/auth';
import {
  getNotifications, markNotificationAsRead, markAllNotificationsAsRead,
  type Notification
} from '../api/apiClient';
import { connectWebSocket, subscribeToNotifications } from '../services/websocket';

type SortField = 'createdAt' | 'type';
type SortOrder = 'asc' | 'desc';
type FilterType = 'ALL' | 'INFO' | 'WARNING' | 'ALERT' | 'MESSAGE';
type FilterStatus = 'ALL' | 'READ' | 'UNREAD';

const TYPE_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string; bg: string }> = {
  INFO: {
    label: 'Info',
    icon: <Info size={16} />,
    color: 'text-indigo-600 dark:text-indigo-400',
    bg: 'bg-indigo-100 dark:bg-indigo-900/30',
  },
  WARNING: {
    label: 'Warning',
    icon: <AlertTriangle size={16} />,
    color: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-100 dark:bg-amber-900/30',
  },
  ALERT: {
    label: 'Alert',
    icon: <AlertCircle size={16} />,
    color: 'text-red-600 dark:text-red-400',
    bg: 'bg-red-100 dark:bg-red-900/30',
  },
  MESSAGE: {
    label: 'Message',
    icon: <MessageSquare size={16} />,
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-100 dark:bg-blue-900/30',
  },
};

function formatDate(iso: string) {
  const date = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)} minutes ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} hours ago`;
  if (diff < 172800000) return 'Yesterday';
  return date.toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });
}

const Notifications: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('ALL');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('ALL');
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [showFilters, setShowFilters] = useState(false);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const data = await getNotifications();
      setNotifications(data);
    } catch (err) {
      console.warn('Failed to fetch notifications', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchNotifications();
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

  const handleMarkAsRead = async (id: number) => {
    try {
      await markNotificationAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch (err) {
      console.error('Failed to mark as read', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      console.error('Failed to mark all as read', err);
    }
  };

  const handleNotificationClick = (n: Notification) => {
    if (!n.isRead) handleMarkAsRead(n.id);
    
    const ticketId = n.ticketId || extractTicketId(n.message);
    if (ticketId) {
      if (user?.role === 'AGENT') {
        navigate(`/staff/dashboard?ticketId=${ticketId}`);
      } else if (user?.role === 'ADMIN') {
        navigate(`/admin/dashboard?tickets&ticketId=${ticketId}`);
      } else {
        navigate(`/my-tickets?ticketId=${ticketId}`);
      }
    }
  };

  const extractTicketId = (message: string): number | null => {
    const match = message.match(/(?:TKT-|ticket\s*#?|#)(\d+)/i);
    return match ? Number(match[1]) : null;
  };

  // Filter and sort
  const filtered = notifications
    .filter(n => {
      if (filterType !== 'ALL' && n.type !== filterType) return false;
      if (filterStatus === 'READ' && !n.isRead) return false;
      if (filterStatus === 'UNREAD' && n.isRead) return false;
      if (searchQuery && !n.message.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => {
      let cmp = 0;
      if (sortField === 'createdAt') {
        cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      } else if (sortField === 'type') {
        cmp = a.type.localeCompare(b.type);
      }
      return sortOrder === 'asc' ? cmp : -cmp;
    });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleGoBack = () => {
    if (user?.role === 'AGENT') navigate('/staff/dashboard');
    else if (user?.role === 'ADMIN') navigate('/admin/dashboard');
    else navigate('/my-tickets');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button onClick={handleGoBack} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
          <ArrowLeft size={20} className="text-slate-600 dark:text-slate-300" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Bell size={24} />
            Notifications
            {unreadCount > 0 && (
              <span className="ml-2 px-2.5 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full">
                {unreadCount}
              </span>
            )}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {notifications.length} total &middot; {unreadCount} unread
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
          >
            <CheckCheck size={16} />
            Mark all read
          </button>
        )}
      </div>

      {/* Search & Filters */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 mb-6">
        <div className="p-4 flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Search notifications..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg py-2 pl-9 pr-4 text-sm focus:ring-2 focus:ring-primary-500/50 outline-none transition-all placeholder:text-slate-400 dark:text-slate-200"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors border ${
              showFilters
                ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800 text-primary-700 dark:text-primary-300'
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
            }`}
          >
            <Filter size={16} />
            Filters
          </button>
          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors border bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
            title={sortOrder === 'asc' ? 'Oldest first' : 'Newest first'}
          >
            {sortOrder === 'asc' ? <SortAsc size={16} /> : <SortDesc size={16} />}
            {sortField === 'createdAt' ? 'Date' : 'Type'}
          </button>
        </div>

        {showFilters && (
          <div className="px-4 pb-4 pt-0 border-t border-slate-100 dark:border-slate-800 mt-0 pt-3 space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                Type
              </label>
              <div className="flex flex-wrap gap-2">
                {(['ALL', 'INFO', 'WARNING', 'ALERT', 'MESSAGE'] as FilterType[]).map(type => (
                  <button
                    key={type}
                    onClick={() => setFilterType(type)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                      filterType === type
                        ? 'bg-primary-600 text-white shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {type === 'ALL' ? 'All Types' : TYPE_CONFIG[type]?.label || type}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                Status
              </label>
              <div className="flex flex-wrap gap-2">
                {(['ALL', 'UNREAD', 'READ'] as FilterStatus[]).map(status => (
                  <button
                    key={status}
                    onClick={() => setFilterStatus(status)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                      filterStatus === status
                        ? 'bg-primary-600 text-white shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {status === 'ALL' ? 'All' : status === 'UNREAD' ? 'Unread' : 'Read'}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                Sort by
              </label>
              <div className="flex flex-wrap gap-2">
                {([{ field: 'createdAt' as SortField, label: 'Date' }, { field: 'type' as SortField, label: 'Type' }]).map(s => (
                  <button
                    key={s.field}
                    onClick={() => setSortField(s.field)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                      sortField === s.field
                        ? 'bg-primary-600 text-white shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Notifications List */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full mx-auto mb-3"></div>
            <p className="text-sm text-slate-500">Loading notifications...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <BellOff size={48} className="mx-auto mb-3 text-slate-300 dark:text-slate-600" />
            <p className="text-slate-500 dark:text-slate-400 font-medium">No notifications found</p>
            <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
              {searchQuery || filterType !== 'ALL' || filterStatus !== 'ALL'
                ? 'Try adjusting your filters'
                : 'You\'re all caught up!'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filtered.map(n => {
              const cfg = TYPE_CONFIG[n.type] || TYPE_CONFIG.INFO;
              return (
                <div
                  key={n.id}
                  className={`flex items-start gap-4 px-5 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group ${
                    !n.isRead ? 'bg-primary-50/40 dark:bg-primary-900/10' : ''
                  }`}
                  onClick={() => handleNotificationClick(n)}
                >
                  <div className={`mt-0.5 shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${cfg.bg} ${cfg.color}`}>
                    {cfg.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-sm leading-relaxed ${
                        !n.isRead
                          ? 'font-semibold text-slate-800 dark:text-white'
                          : 'text-slate-600 dark:text-slate-300'
                      }`}>
                        {n.message}
                      </p>
                      {!n.isRead && (
                        <span className="shrink-0 w-2.5 h-2.5 mt-1.5 bg-primary-500 rounded-full"></span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${cfg.bg} ${cfg.color}`}>
                        {cfg.icon}
                        {cfg.label}
                      </span>
                      {n.ticketId && (
                        <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                          Ticket #{n.ticketId}
                        </span>
                      )}
                      <span className="text-[10px] text-slate-400 dark:text-slate-500">{formatDate(n.createdAt)}</span>
                    </div>
                  </div>
                  <div className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    {!n.isRead && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleMarkAsRead(n.id); }}
                        className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                        title="Mark as read"
                      >
                        <Check size={14} className="text-slate-500" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;
