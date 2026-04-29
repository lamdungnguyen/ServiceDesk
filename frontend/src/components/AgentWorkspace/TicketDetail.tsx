import { useState, useEffect, useRef } from 'react';
import { type Ticket } from '../../types/ticket';
import { assignTicket, getAllUsers, type Comment, type UserPayload } from '../../api/apiClient';
import {
  Clock, User, MessageSquare, Send, CheckCircle2,
  ChevronDown, Flag, AlertCircle, Inbox, Loader2,
  Calendar, Tag
} from 'lucide-react';

interface TicketDetailProps {
  ticket: Ticket | null;
  comments: Comment[];
  commentsLoading: boolean;
  onUpdateStatus: (id: number, status: string) => void;
  onTicketAssigned?: (id: number, assigneeId: number) => void;
  onPostComment: (ticketId: number, content: string) => void;
  agentName: string;
}

const PRIORITY_STYLE: Record<string, string> = {
  URGENT: 'bg-red-100 text-red-700 border-red-200',
  HIGH: 'bg-orange-100 text-orange-700 border-orange-200',
  MEDIUM: 'bg-amber-100 text-amber-700 border-amber-200',
  LOW: 'bg-green-100 text-green-700 border-green-200',
};

const STATUS_STYLE: Record<string, string> = {
  NEW: 'bg-blue-100 text-blue-700 border-blue-200',
  ASSIGNED: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  IN_PROGRESS: 'bg-amber-100 text-amber-700 border-amber-200',
  RESOLVED: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  CLOSED: 'bg-slate-100 text-slate-600 border-slate-200',
};

const getSLAInfo = (dueDate: string | null, status: string) => {
  if (!dueDate || status === 'RESOLVED' || status === 'CLOSED')
    return { label: 'Resolved – No SLA', style: 'text-slate-400 bg-slate-50 border-slate-200' };
  const diff = new Date(dueDate).getTime() - Date.now();
  const abs = Math.abs(diff);
  const h = Math.floor(abs / 3600000);
  const m = Math.floor((abs % 3600000) / 60000);
  if (diff < 0)
    return { label: `Overdue by ${h > 0 ? h + 'h ' : ''}${m}m`, style: 'text-red-700 bg-red-50 border-red-200' };
  if (diff < 3600000)
    return { label: `${m}m remaining`, style: 'text-orange-700 bg-orange-50 border-orange-200' };
  if (diff < 7200000)
    return { label: `${h}h ${m}m remaining`, style: 'text-amber-700 bg-amber-50 border-amber-200' };
  return { label: `${h}h remaining`, style: 'text-slate-600 bg-slate-100 border-slate-200' };
};

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

function formatRelative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return formatDateTime(iso);
}

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

const AVATAR_COLORS = ['from-blue-500 to-indigo-600', 'from-emerald-500 to-teal-600', 'from-purple-500 to-pink-600', 'from-amber-500 to-orange-600'];
function avatarColor(name: string) {
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
}

const TicketDetail = ({ ticket, comments, commentsLoading, onUpdateStatus, onTicketAssigned, onPostComment, agentName }: TicketDetailProps) => {
  const [commentText, setCommentText] = useState('');
  const commentsEndRef = useRef<HTMLDivElement>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [agents, setAgents] = useState<UserPayload[]>([]);
  const [isAssigning, setIsAssigning] = useState(false);

  useEffect(() => {
    getAllUsers().then(users => {
      setAgents(users.filter(u => u.role === 'AGENT' || u.role === 'ADMIN'));
    }).catch(err => console.warn('Could not fetch agents', err));
  }, []);

  useEffect(() => {
    if (commentsEndRef.current) {
      commentsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [comments]);

  if (!ticket) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 bg-slate-50/50 dark:bg-slate-900/50 gap-4 transition-colors duration-300">
        <Inbox size={52} strokeWidth={1.2} />
        <div className="text-center">
          <p className="text-base font-semibold text-slate-500 dark:text-slate-400">No ticket selected</p>
          <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">Choose a ticket from the list to view details</p>
        </div>
      </div>
    );
  }

  const sla = getSLAInfo(ticket.dueDate, ticket.status);

  const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    setIsUpdating(true);
    await onUpdateStatus(ticket.id, e.target.value);
    setIsUpdating(false);
  };

  const handleSendComment = async () => {
    if (!commentText.trim()) return;
    setIsSending(true);
    await onPostComment(ticket.id, commentText.trim());
    setCommentText('');
    setIsSending(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSendComment();
    }
  };

  const handleAssignChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newAssigneeId = parseInt(e.target.value);
    if (!newAssigneeId) return;
    setIsAssigning(true);
    try {
      await assignTicket(ticket.id, newAssigneeId);
      if (onTicketAssigned) onTicketAssigned(ticket.id, newAssigneeId);
    } catch (err) {
      console.error('Failed to assign ticket', err);
    } finally {
      setIsAssigning(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 transition-colors duration-300">
      {/* ── Header ── */}
      <div className="px-6 pt-6 pb-4 border-b border-slate-200 dark:border-slate-800 shrink-0 bg-white dark:bg-slate-900 transition-colors duration-300">
        <div className="flex items-start gap-3 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold text-slate-400 dark:text-slate-500">#{ticket.id}</span>
              {ticket.category && (
                <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-full border border-slate-200 dark:border-slate-700 flex items-center gap-1 transition-colors">
                  <Tag size={9} />
                  {ticket.category}
                </span>
              )}
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white leading-snug transition-colors">{ticket.title}</h2>
          </div>
        </div>

        {/* Badges row */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status dropdown */}
          <div className="relative">
            <select
              disabled={isUpdating}
              value={ticket.status}
              onChange={handleStatusChange}
              className={`appearance-none text-xs font-bold rounded-lg px-3 py-1.5 pr-7 border outline-none transition-all cursor-pointer ${STATUS_STYLE[ticket.status] ?? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'} dark:bg-opacity-20`}
            >
              <option value="NEW">New</option>
              <option value="ASSIGNED">Assigned</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
            </select>
            {isUpdating
              ? <Loader2 size={11} className="absolute right-2 top-1/2 -translate-y-1/2 animate-spin pointer-events-none opacity-70" />
              : <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-70" />}
          </div>

          {/* Assignee dropdown */}
          <div className="relative">
            <select
              disabled={isAssigning}
              value={ticket.assigneeId ?? ''}
              onChange={handleAssignChange}
              className="appearance-none text-xs font-bold rounded-lg px-3 py-1.5 pr-7 border bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 outline-none transition-all cursor-pointer"
            >
              <option value="">Unassigned</option>
              {agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
            {isAssigning
              ? <Loader2 size={11} className="absolute right-2 top-1/2 -translate-y-1/2 animate-spin pointer-events-none opacity-70" />
              : <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-70" />}
          </div>

          {/* Priority */}
          <span className={`text-xs font-bold px-3 py-1.5 rounded-lg border flex items-center gap-1.5 ${PRIORITY_STYLE[ticket.priority] ?? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'} dark:bg-opacity-20`}>
            <Flag size={11} />
            {ticket.priority}
          </span>

          {/* Reporter */}
          <span className="text-xs font-semibold px-3 py-1.5 bg-slate-100 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 rounded-lg flex items-center gap-1.5 transition-colors">
            <User size={11} />
            {ticket.reporterName ?? 'Guest'}
          </span>

          {/* SLA */}
          <span className={`text-xs font-bold px-3 py-1.5 rounded-lg border flex items-center gap-1.5 ml-auto ${sla.style} dark:bg-opacity-20`}>
            <Clock size={11} />
            {sla.label}
          </span>
        </div>
      </div>

      {/* ── Scrollable Body ── */}
      <div className="flex-1 overflow-y-auto">
        
        {/* Meta info */}
        <div className="mx-6 mt-5 mb-5 grid grid-cols-2 gap-3">
          <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl p-3 transition-colors">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Created</div>
            <div className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Calendar size={13} className="text-slate-400 dark:text-slate-500" />
              {formatDateTime(ticket.createdAt)}
            </div>
          </div>
          <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl p-3 transition-colors">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Due Date</div>
            <div className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Clock size={13} className="text-slate-400 dark:text-slate-500" />
              {ticket.dueDate ? formatDateTime(ticket.dueDate) : '—'}
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="mx-6 mb-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm transition-colors">
          <div className="flex items-center gap-2 px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 transition-colors">
            <AlertCircle size={15} className="text-blue-500 dark:text-blue-400" />
            <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Issue Description</span>
          </div>
          <div className="px-5 py-4 text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap transition-colors">
            {ticket.description || <span className="text-slate-400 dark:text-slate-500 italic">No description provided.</span>}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mx-6 mb-6 flex gap-2">
          {ticket.status === 'NEW' && (
            <button
              onClick={() => onUpdateStatus(ticket.id, 'IN_PROGRESS')}
              className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition-colors shadow-sm"
            >
              Start Working
            </button>
          )}
          {ticket.status === 'IN_PROGRESS' && (
            <button
              onClick={() => onUpdateStatus(ticket.id, 'RESOLVED')}
              className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2"
            >
              <CheckCircle2 size={16} />
              Mark Resolved
            </button>
          )}
        </div>

        {/* Comments */}
        <div className="mx-6 mb-4">
          <div className="flex items-center gap-2 mb-4">
            <MessageSquare size={15} className="text-slate-400 dark:text-slate-500" />
            <span className="text-sm font-bold text-slate-700 dark:text-slate-300 transition-colors">Activity & Comments</span>
            {comments.length > 0 && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-full transition-colors">{comments.length}</span>
            )}
          </div>

          {/* System event */}
          <div className="flex items-center gap-3 text-xs text-slate-400 dark:text-slate-500 mb-4 transition-colors">
            <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1 transition-colors"></div>
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full font-medium transition-colors">
              <CheckCircle2 size={12} className="text-emerald-500 dark:text-emerald-400" />
              Ticket created · {formatDateTime(ticket.createdAt)}
            </div>
            <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1 transition-colors"></div>
          </div>

          {commentsLoading ? (
            <div className="flex items-center justify-center py-8 text-slate-400 dark:text-slate-500 gap-2 transition-colors">
              <Loader2 size={18} className="animate-spin" />
              <span className="text-sm">Loading comments...</span>
            </div>
          ) : comments.length === 0 ? (
            <p className="text-center text-sm text-slate-400 dark:text-slate-500 py-6 italic transition-colors">No comments yet. Be the first to respond.</p>
          ) : (
            <div className="space-y-4">
              {comments.map(c => {
                const isAgent = c.authorId !== ticket.reporterId;
                return (
                  <div key={c.id} className={`flex gap-3 ${isAgent ? '' : 'flex-row-reverse'}`}>
                    <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${avatarColor(c.authorName)} text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm`}>
                      {getInitials(c.authorName)}
                    </div>
                    <div className={`max-w-[85%] ${isAgent ? '' : 'items-end'}`}>
                      <div className={`flex items-center gap-2 mb-1 ${isAgent ? '' : 'flex-row-reverse'}`}>
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors">{c.authorName}</span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 transition-colors">{formatRelative(c.createdAt)}</span>
                      </div>
                      <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm border ${
                        isAgent
                          ? 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-tl-sm transition-colors'
                          : 'bg-blue-600 border-blue-700 text-white rounded-tr-sm transition-colors'
                      }`}>
                        {c.content}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={commentsEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* ── Reply Box ── */}
      <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 transition-colors duration-300">
        <div className="flex items-end gap-3">
          <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${avatarColor(agentName)} text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm`}>
            {getInitials(agentName)}
          </div>
          <div className="flex-1 relative">
            <textarea
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Add a comment... (Ctrl+Enter to send)"
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-4 pr-12 py-3 text-sm focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 dark:focus:border-blue-500 outline-none resize-none min-h-[44px] max-h-[120px] text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 transition-all"
              rows={2}
            />
            <button
              onClick={handleSendComment}
              disabled={!commentText.trim() || isSending}
              className="absolute right-2 bottom-2 p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isSending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            </button>
          </div>
        </div>
        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-2 ml-11 transition-colors">Press Ctrl+Enter to submit quickly</p>
      </div>
    </div>
  );
};

export default TicketDetail;
