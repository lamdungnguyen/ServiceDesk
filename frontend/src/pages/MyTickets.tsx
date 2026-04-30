import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Ticket as TicketType } from '../types/ticket';
import { getTickets } from '../api/apiClient';
import TicketCard from '../components/TicketCard';
import CustomerTicketDetailModal from '../components/CustomerTicketDetailModal';
import { useAuth } from '../context/auth';
import { RefreshCcw, AlertCircle, ArrowUpDown, ArrowUp, ArrowDown, Filter, X, Search } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';

type SortField = 'title' | 'priority' | 'status' | 'createdAt';
type SortDir = 'asc' | 'desc';

const PRIORITY_ORDER: Record<string, number> = { LOW: 1, MEDIUM: 2, HIGH: 3, URGENT: 4 };
const STATUS_ORDER: Record<string, number> = { NEW: 1, ASSIGNED: 2, IN_PROGRESS: 3, RESOLVED: 4, CLOSED: 5 };

const SORT_LABELS: Record<SortField, string> = {
  title: 'Tên',
  priority: 'Mức độ',
  status: 'Trạng thái',
  createdAt: 'Ngày tạo',
};

const ALL_STATUSES = ['NEW', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];
const ALL_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

const STATUS_STYLE: Record<string, string> = {
  NEW: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800',
  ASSIGNED: 'bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-400 dark:border-indigo-800',
  IN_PROGRESS: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800',
  RESOLVED: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800',
  CLOSED: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-700/30 dark:text-slate-400 dark:border-slate-700',
};

const PRIORITY_STYLE: Record<string, string> = {
  LOW: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800',
  MEDIUM: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800',
  HIGH: 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800',
  URGENT: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800',
};

const MyTickets = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [tickets, setTickets] = useState<TicketType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<TicketType | null>(null);
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [filterStatus, setFilterStatus] = useState<string[]>([]);
  const [filterPriority, setFilterPriority] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getTickets();
      setTickets(data);
    } catch (err) {
      console.error("Failed to fetch tickets:", err);
      setError("Cannot connect to backend to fetch your tickets.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      const timer = window.setTimeout(() => {
        void fetchTickets();
      }, 0);
      return () => window.clearTimeout(timer);
    }
  }, [fetchTickets, user]);

  // Auto-open ticket từ query param ?ticketId=X (từ notification)
  useEffect(() => {
    const ticketIdParam = searchParams.get('ticketId');
    if (ticketIdParam && tickets.length > 0) {
      const target = tickets.find(t => t.id === Number(ticketIdParam));
      if (target) {
        setSelectedTicket(target);
        setSearchParams({}, { replace: true });
      }
    }
  }, [searchParams, tickets, setSearchParams]);

  const toggleFilter = (arr: string[], val: string, setter: (v: string[]) => void) => {
    setter(arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val]);
  };

  const activeFilterCount = filterStatus.length + filterPriority.length + (searchQuery ? 1 : 0);

  const filteredAndSorted = useMemo(() => {
    let result = [...tickets];

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(t =>
        t.title.toLowerCase().includes(q) ||
        t.description?.toLowerCase().includes(q) ||
        String(t.id).includes(q)
      );
    }

    // Filter by status
    if (filterStatus.length > 0) {
      result = result.filter(t => filterStatus.includes(t.status));
    }

    // Filter by priority
    if (filterPriority.length > 0) {
      result = result.filter(t => filterPriority.includes(t.priority));
    }

    // Sort
    result.sort((a, b) => {
      let cmp = 0;
      if (sortField === 'title') {
        cmp = a.title.localeCompare(b.title, 'vi');
      } else if (sortField === 'priority') {
        cmp = (PRIORITY_ORDER[a.priority] ?? 0) - (PRIORITY_ORDER[b.priority] ?? 0);
      } else if (sortField === 'status') {
        cmp = (STATUS_ORDER[a.status] ?? 0) - (STATUS_ORDER[b.status] ?? 0);
      } else if (sortField === 'createdAt') {
        cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [tickets, sortField, sortDir, filterStatus, filterPriority, searchQuery]);

  const handleSortField = (field: SortField) => {
    if (field === sortField) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const clearAllFilters = () => {
    setFilterStatus([]);
    setFilterPriority([]);
    setSearchQuery('');
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (field !== sortField) return <ArrowUpDown size={13} className="opacity-40" />;
    return sortDir === 'asc'
      ? <ArrowUp size={13} className="text-primary-500" />
      : <ArrowDown size={13} className="text-primary-500" />;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-2 tracking-tight">My Tickets</h1>
          <p className="text-slate-500 dark:text-slate-400">Track and manage your support requests.</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={fetchTickets} className="p-2.5 text-slate-500 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm focus:ring-2 focus:ring-primary-500/20">
            <RefreshCcw size={18} className={loading ? "animate-spin" : ""} />
          </button>
          <Link to="/" className="flex items-center gap-2 bg-gradient-to-r from-primary-600 to-indigo-600 text-white px-5 py-2.5 rounded-lg font-medium hover:from-primary-700 hover:to-indigo-700 transition-all shadow-lg shadow-primary-500/30 active:scale-95 transform">
            <span>Submit New Request</span>
          </Link>
        </div>
      </div>

      {/* Search + Filter + Sort Toolbar */}
      {tickets.length > 0 && (
        <div className="space-y-3 mb-6">
          {/* Top row: Search + Filter toggle + Sort */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Tìm kiếm ticket..."
                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 pl-9 pr-4 text-sm outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 placeholder:text-slate-400 dark:text-slate-200 shadow-sm transition-all"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Filter toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border transition-all shadow-sm ${
                showFilters || activeFilterCount > 0
                  ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-300 dark:border-primary-700 text-primary-700 dark:text-primary-300'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-primary-300'
              }`}
            >
              <Filter size={15} />
              Bộ lọc
              {activeFilterCount > 0 && (
                <span className="ml-1 w-5 h-5 flex items-center justify-center bg-primary-600 text-white text-[10px] font-bold rounded-full">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {/* Sort pills */}
            <div className="flex items-center gap-1.5 ml-auto">
              <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 mr-1 hidden sm:inline">Sắp xếp:</span>
              {(Object.keys(SORT_LABELS) as SortField[]).map(field => (
                <button
                  key={field}
                  onClick={() => handleSortField(field)}
                  className={`flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-medium border transition-all ${
                    sortField === field
                      ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-300 dark:border-primary-700 text-primary-700 dark:text-primary-300 shadow-sm'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-primary-300 dark:hover:border-primary-700'
                  }`}
                >
                  {SORT_LABELS[field]}
                  <SortIcon field={field} />
                </button>
              ))}
            </div>
          </div>

          {/* Filter panel (collapsible) */}
          {showFilters && (
            <div className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-sm animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-bold text-slate-700 dark:text-slate-200">Lọc theo</span>
                {activeFilterCount > 0 && (
                  <button onClick={clearAllFilters} className="text-xs font-medium text-red-500 hover:text-red-600 transition-colors">
                    Xóa tất cả
                  </button>
                )}
              </div>

              {/* Status filter */}
              <div className="mb-4">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">Trạng thái</p>
                <div className="flex flex-wrap gap-2">
                  {ALL_STATUSES.map(s => {
                    const active = filterStatus.includes(s);
                    const count = tickets.filter(t => t.status === s).length;
                    return (
                      <button
                        key={s}
                        onClick={() => toggleFilter(filterStatus, s, setFilterStatus)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                          active
                            ? STATUS_STYLE[s] + ' ring-2 ring-offset-1 ring-primary-500/30 shadow-sm'
                            : 'bg-slate-50 dark:bg-slate-700/40 border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                        }`}
                      >
                        {s.replace('_', ' ')}
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${active ? 'bg-white/30' : 'bg-slate-200 dark:bg-slate-600 text-slate-500 dark:text-slate-400'}`}>
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Priority filter */}
              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">Mức độ ưu tiên</p>
                <div className="flex flex-wrap gap-2">
                  {ALL_PRIORITIES.map(p => {
                    const active = filterPriority.includes(p);
                    const count = tickets.filter(t => t.priority === p).length;
                    return (
                      <button
                        key={p}
                        onClick={() => toggleFilter(filterPriority, p, setFilterPriority)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                          active
                            ? PRIORITY_STYLE[p] + ' ring-2 ring-offset-1 ring-primary-500/30 shadow-sm'
                            : 'bg-slate-50 dark:bg-slate-700/40 border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                        }`}
                      >
                        {p}
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${active ? 'bg-white/30' : 'bg-slate-200 dark:bg-slate-600 text-slate-500 dark:text-slate-400'}`}>
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Active filter tags */}
          {activeFilterCount > 0 && !showFilters && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-400">Đang lọc:</span>
              {filterStatus.map(s => (
                <span key={s} className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${STATUS_STYLE[s]}`}>
                  {s.replace('_', ' ')}
                  <button onClick={() => toggleFilter(filterStatus, s, setFilterStatus)} className="ml-0.5 hover:opacity-70"><X size={11} /></button>
                </span>
              ))}
              {filterPriority.map(p => (
                <span key={p} className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${PRIORITY_STYLE[p]}`}>
                  {p}
                  <button onClick={() => toggleFilter(filterPriority, p, setFilterPriority)} className="ml-0.5 hover:opacity-70"><X size={11} /></button>
                </span>
              ))}
              {searchQuery && (
                <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600">
                  "{searchQuery}"
                  <button onClick={() => setSearchQuery('')} className="ml-0.5 hover:opacity-70"><X size={11} /></button>
                </span>
              )}
              <button onClick={clearAllFilters} className="text-[11px] font-medium text-red-500 hover:text-red-600 ml-1">Xóa tất cả</button>
            </div>
          )}

          {/* Result count */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 dark:text-slate-500">
              {filteredAndSorted.length === tickets.length
                ? `${tickets.length} ticket${tickets.length !== 1 ? 's' : ''}`
                : `${filteredAndSorted.length} / ${tickets.length} tickets`
              }
            </span>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-8 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-xl flex items-center gap-3 text-red-700 dark:text-red-400">
          <AlertCircle size={20} />
          <p className="font-medium text-sm">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="glass-card p-5 animate-pulse min-h-[220px] flex flex-col border border-slate-200/50 dark:border-slate-700/30">
              <div className="h-6 bg-slate-200 dark:bg-slate-700/50 rounded-full w-20 mb-4"></div>
              <div className="h-5 bg-slate-200 dark:bg-slate-700/50 rounded w-4/5 mb-3"></div>
              <div className="h-4 bg-slate-200 dark:bg-slate-700/50 rounded w-2/3 mb-6"></div>
            </div>
          ))}
        </div>
      ) : tickets.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-12 text-center">
          <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={32} />
          </div>
          <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">No tickets found</h3>
          <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            You haven't submitted any support requests yet. When you do, they will appear here.
          </p>
        </div>
      ) : filteredAndSorted.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-12 text-center">
          <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4">
            <Filter size={32} />
          </div>
          <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Không có kết quả</h3>
          <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-4">
            Không tìm thấy ticket phù hợp với bộ lọc hiện tại.
          </p>
          <button onClick={clearAllFilters} className="text-sm font-semibold text-primary-600 hover:text-primary-700 transition-colors">
            Xóa bộ lọc
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredAndSorted.map((ticket) => (
            <TicketCard key={ticket.id} ticket={ticket} onClick={() => setSelectedTicket(ticket)} />
          ))}
        </div>
      )}

      {selectedTicket && (
        <CustomerTicketDetailModal 
          ticket={selectedTicket} 
          isOpen={!!selectedTicket} 
          onClose={() => setSelectedTicket(null)} 
        />
      )}
    </div>
  );
};

export default MyTickets;
