import { useState } from 'react';
import { Filter, Clock, RefreshCw, Inbox, UserPlus, Play, CheckCircle2, MoreHorizontal } from 'lucide-react';
import { type Ticket } from '../../types/ticket';

interface TicketListProps {
  tickets: Ticket[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  loading: boolean;
  filterPriority: string;
  setFilterPriority: (p: string) => void;
  sortBy: string;
  setSortBy: (s: string) => void;
  onRefresh: () => void;
  onAssignToMe?: (id: number) => void;
  onQuickStatusChange?: (id: number, status: string) => void;
  currentUserId?: number;
}

const isOverdue = (ticket: Ticket) =>
  ticket.dueDate != null &&
  new Date(ticket.dueDate) < new Date() &&
  ticket.status !== 'RESOLVED' &&
  ticket.status !== 'CLOSED';

const getSLALabel = (dueDate: string | null, status: string) => {
  if (!dueDate) return null;
  if (status === 'RESOLVED' || status === 'CLOSED') return null;
  const diff = new Date(dueDate).getTime() - Date.now();
  const abs = Math.abs(diff);
  const h = Math.floor(abs / 3600000);
  const m = Math.floor((abs % 3600000) / 60000);
  if (diff < 0) return { label: `Overdue ${h > 0 ? h + 'h ' : ''}${m}m`, color: 'text-red-600 bg-red-50 border-red-100' };
  if (diff < 3600000) return { label: `${m}m left`, color: 'text-orange-600 bg-orange-50 border-orange-100' };
  if (diff < 7200000) return { label: `${h}h ${m}m left`, color: 'text-amber-600 bg-amber-50 border-amber-100' };
  return { label: `${h}h left`, color: 'text-slate-500 bg-slate-100 border-slate-200' };
};

const PRIORITY_BADGE: Record<string, string> = {
  URGENT: 'bg-red-100 text-red-700 border-red-200',
  HIGH: 'bg-orange-100 text-orange-700 border-orange-200',
  MEDIUM: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  LOW: 'bg-green-100 text-green-700 border-green-200',
};

const STATUS_COLOR: Record<string, string> = {
  NEW: 'bg-blue-500',
  ASSIGNED: 'bg-indigo-500',
  IN_PROGRESS: 'bg-amber-500',
  RESOLVED: 'bg-emerald-500',
  CLOSED: 'bg-slate-500',
};

const TicketList = ({
  tickets, selectedId, onSelect, loading,
  filterPriority, setFilterPriority, sortBy, setSortBy, onRefresh,
  onAssignToMe, onQuickStatusChange, currentUserId
}: TicketListProps) => {
  const [showFilters, setShowFilters] = useState(false);

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Toolbar */}
      <div className="px-4 py-3 border-b border-slate-100 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-slate-700">
            {loading ? '...' : `${tickets.length} Ticket${tickets.length !== 1 ? 's' : ''}`}
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setShowFilters(p => !p)}
              className={`p-1.5 rounded-lg border text-sm transition-colors ${showFilters ? 'bg-blue-50 border-blue-200 text-blue-600' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}
              title="Filters"
            >
              <Filter size={15} />
            </button>
            <button
              onClick={onRefresh}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors"
              title="Refresh"
            >
              <RefreshCw size={15} />
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="flex gap-2 pt-1">
            <select
              value={filterPriority}
              onChange={e => setFilterPriority(e.target.value)}
              className="flex-1 text-xs py-1.5 px-2 border border-slate-200 rounded-lg text-slate-700 bg-slate-50 focus:ring-2 focus:ring-blue-500/30 outline-none cursor-pointer"
            >
              <option value="ALL">All Priority</option>
              <option value="URGENT">Urgent</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="flex-1 text-xs py-1.5 px-2 border border-slate-200 rounded-lg text-slate-700 bg-slate-50 focus:ring-2 focus:ring-blue-500/30 outline-none cursor-pointer"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="due_date">By Due Date</option>
            </select>
          </div>
        )}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="p-4 animate-pulse space-y-2">
              <div className="flex justify-between">
                <div className="h-3 w-14 bg-slate-200 rounded-full"></div>
                <div className="h-3 w-14 bg-slate-200 rounded-full"></div>
              </div>
              <div className="h-4 w-4/5 bg-slate-200 rounded"></div>
              <div className="h-3 w-2/3 bg-slate-200 rounded"></div>
              <div className="h-3 w-1/3 bg-slate-200 rounded"></div>
            </div>
          ))
        ) : tickets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
            <Inbox size={40} strokeWidth={1.5} />
            <p className="font-semibold text-sm">No tickets found</p>
            <p className="text-xs text-center max-w-[200px]">Try adjusting your filters or check back later.</p>
          </div>
        ) : (
          tickets.map(ticket => {
            const overdue = isOverdue(ticket);
            const sla = getSLALabel(ticket.dueDate, ticket.status);
            const isSelected = selectedId === ticket.id;
            const canAssign = ticket.assigneeId !== currentUserId;
            const isOpen = ticket.status !== 'RESOLVED' && ticket.status !== 'CLOSED';

            return (
              <div
                key={ticket.id}
                className={`relative group cursor-pointer ${
                  isSelected ? 'bg-blue-50 border-l-2 border-l-blue-600' : 'border-l-2 border-l-transparent hover:bg-slate-50 dark:hover:bg-slate-900'
                } ${overdue && !isSelected ? 'border-l-red-500 bg-red-50/20 dark:bg-red-950/10' : ''}`}
              >
                <button
                  onClick={() => onSelect(ticket.id)}
                  className="w-full text-left p-4"
                >
                  {/* Top row: ID + priority */}
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full shrink-0 ${STATUS_COLOR[ticket.status] ?? 'bg-slate-500'}`}></div>
                      <span className="text-[11px] font-bold text-slate-400 uppercase">#{ticket.id}</span>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${PRIORITY_BADGE[ticket.priority] ?? 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                      {ticket.priority}
                    </span>
                  </div>

                  {/* Title */}
                  <h4 className={`text-sm font-semibold mb-1.5 line-clamp-2 leading-snug pr-1 ${
                    isSelected ? 'text-blue-800 dark:text-blue-200' : overdue ? 'text-red-800 dark:text-red-200' : 'text-slate-800 dark:text-slate-200'
                  }`}>
                    {ticket.title}
                  </h4>

                  {/* Reporter */}
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-2 truncate">
                    {ticket.reporterName ?? `User ${ticket.reporterId}`}
                  </p>

                  {/* Bottom row: time + SLA */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center gap-1">
                      <Clock size={11} />
                      {formatRelativeTime(ticket.createdAt)}
                    </span>
                    {sla && (
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${sla.color}`}>
                        {sla.label}
                      </span>
                    )}
                  </div>
                </button>

                {/* Hover quick actions */}
                {isOpen && (
                  <div className="absolute bottom-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                    {canAssign && onAssignToMe && (
                      <button
                        onClick={(e) => { e.stopPropagation(); onAssignToMe(ticket.id); }}
                        className="p-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 shadow-sm transition-colors"
                        title="Assign to me"
                      >
                        <UserPlus size={13} />
                      </button>
                    )}
                    {ticket.status === 'NEW' && onQuickStatusChange && (
                      <button
                        onClick={(e) => { e.stopPropagation(); onQuickStatusChange(ticket.id, 'IN_PROGRESS'); }}
                        className="p-1.5 rounded-lg bg-amber-600 text-white hover:bg-amber-700 shadow-sm transition-colors"
                        title="Start working"
                      >
                        <Play size={13} />
                      </button>
                    )}
                    {ticket.status === 'IN_PROGRESS' && onQuickStatusChange && (
                      <button
                        onClick={(e) => { e.stopPropagation(); onQuickStatusChange(ticket.id, 'RESOLVED'); }}
                        className="p-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm transition-colors"
                        title="Mark resolved"
                      >
                        <CheckCircle2 size={13} />
                      </button>
                    )}
                    {onQuickStatusChange && (
                      <div className="relative flex">
                        <button
                          onClick={(e) => { e.stopPropagation(); }}
                          className="p-1.5 rounded-lg bg-slate-600 text-white hover:bg-slate-700 shadow-sm transition-colors"
                          title="More actions"
                        >
                          <MoreHorizontal size={13} />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}

export default TicketList;
