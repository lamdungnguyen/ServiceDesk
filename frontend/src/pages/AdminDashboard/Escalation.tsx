import { useEffect, useState, useCallback } from 'react';
import { ShieldAlert, RefreshCw, Siren, Calendar, User, Clock, AlertTriangle } from 'lucide-react';
import { getEscalatedTickets } from '../../api/apiClient';
import type { Ticket } from '../../types/ticket';

const Escalation = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getEscalatedTickets();
      setTickets(data);
      setLastUpdated(new Date());
    } catch {
      setError('Failed to load escalated tickets.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchData();
    const interval = window.setInterval(() => void fetchData(), 60000);
    return () => window.clearInterval(interval);
  }, [fetchData]);

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800/50';
      case 'HIGH': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800/50';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800/50';
      default: return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'NEW': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'ASSIGNED': return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400';
      case 'IN_PROGRESS': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
      default: return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400';
    }
  };

  const getOverdueText = (dueDate: string | null) => {
    if (!dueDate) return 'No due date';
    const due = new Date(dueDate);
    const mins = Math.floor((Date.now() - due.getTime()) / 60000);
    if (mins < 60) return `${mins}m overdue`;
    const hours = Math.floor(mins / 60);
    const rem = mins % 60;
    if (hours < 24) return rem > 0 ? `${hours}h ${rem}m overdue` : `${hours}h overdue`;
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h overdue`;
  };

  const urgentCount = tickets.filter(t => t.priority === 'URGENT' || t.priority === 'HIGH').length;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Escalated Tickets</h2>
            {tickets.length > 0 && (
              <span className="flex items-center gap-1.5 bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full animate-pulse">
                <Siren size={11} />
                {tickets.length} Active
              </span>
            )}
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            Auto-refreshes every minute · Last updated: {lastUpdated.toLocaleTimeString()}
          </p>
        </div>
        <button
          onClick={() => void fetchData()}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Alert Banner */}
      {!loading && tickets.length > 0 && (
        <div className="flex items-start gap-4 p-4 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/40 rounded-2xl">
          <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-xl shrink-0">
            <AlertTriangle size={20} className="text-red-600 dark:text-red-400" />
          </div>
          <div>
            <p className="font-semibold text-red-800 dark:text-red-300 text-sm">
              {tickets.length} ticket{tickets.length > 1 ? 's' : ''} have breached SLA and require immediate attention
            </p>
            <p className="text-red-600 dark:text-red-400 text-xs mt-0.5">
              {urgentCount > 0 && `${urgentCount} critical priority · `}
              Escalation triggered automatically by the SLA monitor
            </p>
          </div>
        </div>
      )}

      {/* Stats Row */}
      {!loading && tickets.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm text-center">
            <h3 className="text-3xl font-bold text-red-600">{tickets.length}</h3>
            <p className="text-xs font-medium text-slate-500 mt-1">Total Escalated</p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm text-center">
            <h3 className="text-3xl font-bold text-orange-600">
              {tickets.filter(t => t.priority === 'URGENT' || t.priority === 'HIGH').length}
            </h3>
            <p className="text-xs font-medium text-slate-500 mt-1">High / Urgent</p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm text-center">
            <h3 className="text-3xl font-bold text-slate-700 dark:text-slate-300">
              {tickets.filter(t => !t.assigneeId).length}
            </h3>
            <p className="text-xs font-medium text-slate-500 mt-1">Unassigned</p>
          </div>
        </div>
      )}

      {/* Ticket List */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-red-200 dark:border-red-800/40 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-red-100 dark:border-red-800/30 bg-red-50 dark:bg-red-900/10 flex items-center gap-3">
          <ShieldAlert className="text-red-600 dark:text-red-400" size={20} />
          <h3 className="font-bold text-red-800 dark:text-red-300">All Escalated Tickets</h3>
          {tickets.length > 0 && (
            <span className="ml-auto text-xs text-red-600 dark:text-red-400 font-semibold">
              {tickets.length} ticket{tickets.length > 1 ? 's' : ''}
            </span>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500" />
          </div>
        ) : error ? (
          <div className="text-center py-12 text-red-500 text-sm">{error}</div>
        ) : tickets.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            <ShieldAlert size={40} className="mx-auto mb-3 text-emerald-400 opacity-60" />
            <p className="font-semibold text-slate-600 dark:text-slate-300">No escalated tickets</p>
            <p className="text-sm mt-1 text-slate-400">All tickets are within SLA. System is healthy.</p>
          </div>
        ) : (
          <div className="divide-y divide-red-50 dark:divide-red-900/10">
            {tickets.map(ticket => (
              <div
                key={ticket.id}
                className="p-5 hover:bg-red-50/40 dark:hover:bg-red-900/5 transition-colors group"
              >
                <div className="flex items-start justify-between gap-4">
                  {/* Left: ticket info */}
                  <div className="flex items-start gap-4 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0">
                      <ShieldAlert size={18} className="text-red-600 dark:text-red-400" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-xs font-bold text-slate-400">#{ticket.id}</span>
                        <span className="inline-flex items-center gap-1 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
                          <Siren size={9} /> Escalated
                        </span>
                        <span className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold border uppercase tracking-wide ${getPriorityBadge(ticket.priority)}`}>
                          {ticket.priority}
                        </span>
                        <span className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide ${getStatusBadge(ticket.status)}`}>
                          {ticket.status.replace('_', ' ')}
                        </span>
                      </div>
                      <h4 className="font-semibold text-slate-800 dark:text-slate-100 text-sm truncate max-w-lg">
                        {ticket.title}
                      </h4>
                      {ticket.description && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                          {ticket.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right: time info */}
                  <div className="shrink-0 text-right">
                    <div className="text-sm font-bold text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30 px-3 py-1.5 rounded-lg">
                      {getOverdueText(ticket.dueDate)}
                    </div>
                  </div>
                </div>

                {/* Metadata row */}
                <div className="mt-3 ml-14 flex items-center gap-5 flex-wrap text-xs text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <User size={12} />
                    {ticket.reporterName || `User ${ticket.reporterId}`}
                  </span>
                  {ticket.assigneeId ? (
                    <span className="flex items-center gap-1.5">
                      <User size={12} className="text-blue-400" />
                      Agent #{ticket.assigneeId}
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-amber-500 font-medium">
                      <AlertTriangle size={12} />
                      Unassigned
                    </span>
                  )}
                  <span className="flex items-center gap-1.5">
                    <Calendar size={12} />
                    Created {new Date(ticket.createdAt).toLocaleDateString()}
                  </span>
                  {ticket.dueDate && (
                    <span className="flex items-center gap-1.5 text-red-500 font-medium">
                      <Clock size={12} />
                      Due {new Date(ticket.dueDate).toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Escalation;
