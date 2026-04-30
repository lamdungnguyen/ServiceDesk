import { useState, useEffect, useCallback } from 'react';
import type { Ticket } from '../../types/ticket';
import { Search, Filter, MoreVertical, ShieldAlert, Loader2, X, Calendar, Clock, User, MessageSquare, FileText } from 'lucide-react';
import { getAllUsers, assignTicket, getComments, type UserPayload, type Comment } from '../../api/apiClient';
import { subscribeToTicket, type ChatMessagePayload } from '../../services/websocket';

interface TicketsProps {
  tickets: Ticket[];
  onTicketAssigned?: (ticketId: number, assigneeId: number) => void;
  initialSelectedTicketId?: number | null;
  onTicketViewed?: () => void;
}

const Tickets = ({ tickets, onTicketAssigned, initialSelectedTicketId, onTicketViewed }: TicketsProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [agents, setAgents] = useState<UserPayload[]>([]);
  const [assigningId, setAssigningId] = useState<number | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);

  useEffect(() => {
    getAllUsers('AGENT').then(users => {
      setAgents(users);
    }).catch(console.error);
  }, []);

  // Auto-open modal from notification
  useEffect(() => {
    if (initialSelectedTicketId) {
      const ticket = tickets.find(t => t.id === initialSelectedTicketId);
      if (ticket) {
        openTicketModal(ticket);
      }
      if (onTicketViewed) onTicketViewed();
    }
  }, [initialSelectedTicketId, tickets, onTicketViewed]);

  const handleWsMessage = useCallback((msg: ChatMessagePayload) => {
    setComments(prev => {
      if (msg.id && prev.some(c => c.id === msg.id)) return prev;
      return [...prev, {
        id: msg.id ?? Date.now(),
        ticketId: msg.ticketId,
        content: msg.content,
        authorId: msg.senderId,
        authorName: msg.senderName,
        createdAt: msg.timestamp ?? new Date().toISOString(),
      }];
    });
  }, []);

  // WebSocket subscription for selected ticket
  useEffect(() => {
    if (!selectedTicket) return;
    const unsubscribe = subscribeToTicket(selectedTicket.id, handleWsMessage);
    return () => unsubscribe();
  }, [selectedTicket, handleWsMessage]);

  const openTicketModal = async (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setCommentsLoading(true);
    try {
      const data = await getComments(ticket.id);
      setComments(data);
    } catch (err) {
      console.error('Failed to fetch comments', err);
      setComments([]);
    } finally {
      setCommentsLoading(false);
    }
  };

  const closeModal = () => {
    setSelectedTicket(null);
    setComments([]);
  };

  const handleAssign = async (ticketId: number, assigneeId: number) => {
    if (!assigneeId) return;
    setAssigningId(ticketId);
    try {
      await assignTicket(ticketId, assigneeId);
      if (onTicketAssigned) onTicketAssigned(ticketId, assigneeId);
    } catch (error) {
      console.error(error);
    } finally {
      setAssigningId(null);
    }
  };

  const filteredTickets = tickets.filter(t => 
    t.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.id.toString().includes(searchTerm) ||
    (t.reporterName && t.reporterName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800/50';
      case 'HIGH': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800/50';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800/50';
      case 'LOW': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800/50';
      default: return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'NEW': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800/50';
      case 'ASSIGNED': return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800/50';
      case 'IN_PROGRESS': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800/50';
      case 'RESOLVED': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50';
      case 'CLOSED': return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700';
      default: return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700';
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 flex flex-col h-full">
      <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">All Tickets</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Manage and assign tickets across the system</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Search ID, title, user..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/50 outline-none w-full sm:w-64 text-slate-800 dark:text-white"
            />
          </div>
          <button className="flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <Filter size={16} />
            <span className="hidden sm:inline">Filter</span>
          </button>
        </div>
      </div>

      <div className="overflow-x-auto flex-1">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold">
              <th className="p-4 pl-6">Ticket</th>
              <th className="p-4">Status</th>
              <th className="p-4">Priority</th>
              <th className="p-4">Reporter</th>
              <th className="p-4">Assignee</th>
              <th className="p-4 text-right pr-6">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
            {filteredTickets.map((ticket) => (
              <tr key={ticket.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors group">
                <td className="p-4 pl-6">
                  <div className="flex items-center gap-3 cursor-pointer" onClick={() => openTicketModal(ticket)}>
                    <span className="text-xs font-bold text-slate-400">#{ticket.id}</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200 line-clamp-1 max-w-[250px] hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                      {ticket.title}
                    </span>
                  </div>
                </td>
                <td className="p-4">
                  <span className={`inline-flex px-2.5 py-1 rounded-md text-[10px] font-bold border uppercase tracking-wider ${getStatusBadge(ticket.status)}`}>
                    {ticket.status}
                  </span>
                </td>
                <td className="p-4">
                  <span className={`inline-flex px-2.5 py-1 rounded-md text-[10px] font-bold border uppercase tracking-wider ${getPriorityBadge(ticket.priority)}`}>
                    {ticket.priority}
                  </span>
                </td>
                <td className="p-4">
                  <div className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {ticket.reporterName || `User ${ticket.reporterId}`}
                  </div>
                </td>
                <td className="p-4 relative">
                  <select
                    disabled={assigningId === ticket.id}
                    value={ticket.assigneeId || ''}
                    onChange={(e) => handleAssign(ticket.id, Number(e.target.value))}
                    className="w-full text-sm bg-slate-50 border border-slate-200 rounded-md py-1.5 px-2 outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
                  >
                    <option value="">Unassigned</option>
                    {agents.map(a => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                  {assigningId === ticket.id && (
                    <Loader2 size={12} className="absolute right-6 top-1/2 -translate-y-1/2 animate-spin text-blue-500" />
                  )}
                </td>
                <td className="p-4 text-right pr-6">
                  <button 
                    onClick={() => openTicketModal(ticket)}
                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                    title="View Details"
                  >
                    <MoreVertical size={18} />
                  </button>
                </td>
              </tr>
            ))}
            {filteredTickets.length === 0 && (
              <tr>
                <td colSpan={6} className="p-12 text-center text-slate-500 dark:text-slate-400">
                  <ShieldAlert size={32} className="mx-auto mb-3 opacity-20" />
                  <p>No tickets found matching your search.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Ticket Detail Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={closeModal}>
          <div 
            className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-slate-400">TKT-{selectedTicket.id}</span>
                <h2 className="text-xl font-bold text-slate-800 dark:text-white">Ticket Details</h2>
              </div>
              <button 
                onClick={closeModal}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Title & Description */}
              <div>
                <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-2">{selectedTicket.title}</h3>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{selectedTicket.description}</p>
              </div>

              {/* Status & Priority Badges */}
              <div className="flex flex-wrap gap-3">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border uppercase tracking-wide ${getStatusBadge(selectedTicket.status)}`}>
                  {selectedTicket.status}
                </span>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border uppercase tracking-wide ${getPriorityBadge(selectedTicket.priority)}`}>
                  {selectedTicket.priority}
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                  <FileText size={12} />
                  {selectedTicket.category}
                </span>
              </div>

              {/* Metadata Grid */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <User size={14} className="text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Reporter</p>
                    <p className="text-sm font-medium text-slate-800 dark:text-white">{selectedTicket.reporterName || `User ${selectedTicket.reporterId}`}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                    <User size={14} className="text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Assignee</p>
                    <p className="text-sm font-medium text-slate-800 dark:text-white">
                      {selectedTicket.assigneeId ? agents.find(a => a.id === selectedTicket.assigneeId)?.name || `Agent ${selectedTicket.assigneeId}` : 'Unassigned'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                    <Calendar size={14} className="text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Created</p>
                    <p className="text-sm font-medium text-slate-800 dark:text-white">{new Date(selectedTicket.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                    <Clock size={14} className="text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Due Date</p>
                    <p className="text-sm font-medium text-slate-800 dark:text-white">
                      {selectedTicket.dueDate ? new Date(selectedTicket.dueDate).toLocaleDateString() : 'No SLA set'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Assignee Selection */}
              <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2 block">Assign to Agent</label>
                <div className="relative">
                  <select
                    disabled={assigningId === selectedTicket.id}
                    value={selectedTicket.assigneeId || ''}
                    onChange={(e) => handleAssign(selectedTicket.id, Number(e.target.value))}
                    className="w-full text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg py-2.5 px-3 outline-none focus:ring-2 focus:ring-blue-500/50 transition-colors"
                  >
                    <option value="">Unassigned</option>
                    {agents.map(a => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                  {assigningId === selectedTicket.id && (
                    <Loader2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-blue-500" />
                  )}
                </div>
              </div>

              {/* Comments Section */}
              <div>
                <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                  <MessageSquare size={16} />
                  Comments ({comments.length})
                </h4>
                {commentsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 size={24} className="animate-spin text-blue-500" />
                  </div>
                ) : comments.length === 0 ? (
                  <p className="text-sm text-slate-500 dark:text-slate-400 italic py-4 text-center bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                    No comments yet
                  </p>
                ) : (
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {comments.map(comment => (
                      <div key={comment.id} className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{comment.authorName}</span>
                          <span className="text-[10px] text-slate-400">{new Date(comment.createdAt).toLocaleDateString()}</span>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400">{comment.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tickets;
