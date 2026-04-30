import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Loader2, Calendar, Clock, AlertCircle, MessageSquare, Send, Tag, Flag, Star } from 'lucide-react';
import type { Ticket } from '../types/ticket';
import { getComments, submitRating, getRatingByTicket, type Comment, type RatingPayload } from '../api/apiClient';
import { useAuth } from '../context/auth';
import { subscribeToTicket, sendChatMessage, type ChatMessagePayload } from '../services/websocket';
import CallPanel from './CallPanel';
import UserProfilePopover from './UserProfilePopover';

interface CustomerTicketDetailModalProps {
  ticket: Ticket;
  isOpen: boolean;
  onClose: () => void;
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

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
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

const CustomerTicketDetailModal = ({ ticket, isOpen, onClose }: CustomerTicketDetailModalProps) => {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Rating state
  const [existingRating, setExistingRating] = useState<RatingPayload | null>(null);
  const [hoverRating, setHoverRating] = useState(0);
  const [selectedRating, setSelectedRating] = useState(0);
  const [ratingComment, setRatingComment] = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);
  const [ratingError, setRatingError] = useState('');

  const commentsEndRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    if (isOpen && ticket) {
      let isCancelled = false;

      setLoading(true);

      // Load existing comments via REST
      getComments(ticket.id)
        .then(data => { if (!isCancelled) setComments(data); })
        .catch(console.error)
        .finally(() => { if (!isCancelled) setLoading(false); });

      // Connect WS and subscribe for real-time messages
      const unsubscribeWs = subscribeToTicket(ticket.id, handleWsMessage);

      return () => {
        isCancelled = true;
        unsubscribeWs();
      };
    }
  }, [isOpen, ticket, handleWsMessage]);

  useEffect(() => {
    if (commentsEndRef.current) {
      commentsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [comments]);

  // Fetch existing rating for resolved/closed tickets
  useEffect(() => {
    if (isOpen && ticket && (ticket.status === 'RESOLVED' || ticket.status === 'CLOSED')) {
      getRatingByTicket(ticket.id)
        .then(data => { if (data) setExistingRating(data); })
        .catch(() => {});
    }
  }, [isOpen, ticket]);

  const handleSubmitRating = async () => {
    if (selectedRating < 1) return;
    setSubmittingRating(true);
    setRatingError('');
    try {
      const result = await submitRating(ticket.id, selectedRating, ratingComment || undefined);
      setExistingRating(result);
    } catch (err: any) {
      setRatingError(err?.response?.data?.message || err?.message || 'Failed to submit rating');
    } finally {
      setSubmittingRating(false);
    }
  };

  if (!isOpen) return null;

  const handleSendComment = () => {
    if (!commentText.trim() || !user) return;
    setIsSending(true);
    sendChatMessage({
      ticketId: ticket.id,
      senderId: user.id,
      senderName: user.name,
      senderRole: 'CUSTOMER',
      content: commentText.trim(),
    });
    setCommentText('');
    setIsSending(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSendComment();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
      
      <div className="relative w-full max-w-4xl h-[90vh] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-700/60 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex flex-col">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold text-slate-400">#{ticket.id}</span>
              {ticket.category && (
                <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-full border border-slate-200 dark:border-slate-700 flex items-center gap-1">
                  <Tag size={9} />
                  {ticket.category}
                </span>
              )}
            </div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">{ticket.title}</h2>
          </div>
          <div className="flex items-center gap-2">
            {user && (
              <CallPanel
                ticketId={ticket.id}
                selfId={user.id}
                selfName={user.name}
                selfRole="CUSTOMER"
                peerId={ticket.assigneeId ?? null}
                peerName={ticket.assigneeId ? `Agent #${ticket.assigneeId}` : undefined}
                disabledReason={!ticket.assigneeId ? 'Wait for an agent to be assigned' : undefined}
              />
            )}
            <button 
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto flex flex-col md:flex-row">
          
          {/* Main Info */}
          <div className="flex-1 border-r border-slate-100 dark:border-slate-800 p-6">
            
            <div className="flex flex-wrap items-center gap-2 mb-6">
              <span className={`text-xs font-bold px-3 py-1.5 rounded-lg border flex items-center gap-1.5 ${STATUS_STYLE[ticket.status] ?? 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                {ticket.status.replace('_', ' ')}
              </span>
              <span className={`text-xs font-bold px-3 py-1.5 rounded-lg border flex items-center gap-1.5 ${PRIORITY_STYLE[ticket.priority] ?? 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                <Flag size={11} />
                {ticket.priority}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl p-4">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Created</div>
                <div className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <Calendar size={14} className="text-slate-400" />
                  {formatDateTime(ticket.createdAt)}
                </div>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl p-4">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Due Date</div>
                <div className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <Clock size={14} className="text-slate-400" />
                  {ticket.dueDate ? formatDateTime(ticket.dueDate) : '—'}
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden shadow-sm">
              <div className="flex items-center gap-2 px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                <AlertCircle size={15} className="text-primary-500" />
                <span className="text-sm font-bold text-slate-700 dark:text-slate-200">Issue Description</span>
              </div>
              <div className="px-5 py-4 text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                {ticket.description || <span className="text-slate-400 italic">No description provided.</span>}
              </div>
            </div>

            {/* Rating Section - only for RESOLVED/CLOSED tickets */}
            {(ticket.status === 'RESOLVED' || ticket.status === 'CLOSED') && ticket.assigneeId && (
              <div className="mt-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden shadow-sm">
                <div className="flex items-center gap-2 px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/10 dark:to-yellow-900/10">
                  <Star size={15} className="text-amber-500" />
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-200">Rate Your Experience</span>
                </div>
                <div className="px-5 py-5">
                  {existingRating ? (
                    // Already rated - show the rating
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1.5 mb-2">
                        {[1, 2, 3, 4, 5].map(s => (
                          <Star
                            key={s}
                            size={28}
                            className={s <= existingRating.score ? 'text-amber-400 fill-amber-400' : 'text-slate-200 dark:text-slate-700'}
                          />
                        ))}
                      </div>
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        You rated {existingRating.score}/5
                      </p>
                      {existingRating.comment && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 italic">
                          "{existingRating.comment}"
                        </p>
                      )}
                      <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-2">
                        Thank you for your feedback!
                      </p>
                    </div>
                  ) : (
                    // Rating form
                    <div>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-3 text-center">How was the support you received?</p>
                      <div className="flex items-center justify-center gap-2 mb-4">
                        {[1, 2, 3, 4, 5].map(s => (
                          <button
                            key={s}
                            onMouseEnter={() => setHoverRating(s)}
                            onMouseLeave={() => setHoverRating(0)}
                            onClick={() => setSelectedRating(s)}
                            className="transition-transform hover:scale-110 active:scale-95"
                          >
                            <Star
                              size={32}
                              className={`transition-colors ${
                                s <= (hoverRating || selectedRating)
                                  ? 'text-amber-400 fill-amber-400 drop-shadow-sm'
                                  : 'text-slate-200 dark:text-slate-700 hover:text-amber-200'
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                      {selectedRating > 0 && (
                        <div className="text-center text-xs font-semibold text-amber-600 dark:text-amber-400 mb-3">
                          {selectedRating === 1 ? 'Poor' : selectedRating === 2 ? 'Fair' : selectedRating === 3 ? 'Good' : selectedRating === 4 ? 'Very Good' : 'Excellent!'}
                        </div>
                      )}
                      <textarea
                        value={ratingComment}
                        onChange={e => setRatingComment(e.target.value)}
                        placeholder="Leave a comment (optional)..."
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400 outline-none resize-none text-slate-800 dark:text-slate-200 placeholder-slate-400 transition-all"
                        rows={2}
                      />
                      {ratingError && (
                        <p className="text-xs text-red-500 mt-2">{ratingError}</p>
                      )}
                      <button
                        onClick={handleSubmitRating}
                        disabled={selectedRating < 1 || submittingRating}
                        className="mt-3 w-full py-2.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white rounded-xl text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
                      >
                        {submittingRating ? 'Submitting...' : 'Submit Rating'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
            
          </div>

          {/* Comments Sidebar */}
          <div className="w-full md:w-[350px] lg:w-[400px] flex flex-col bg-slate-50/50 dark:bg-slate-900">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
              <MessageSquare size={16} className="text-slate-400" />
              <span className="text-sm font-bold text-slate-700 dark:text-slate-200">Activity & Comments</span>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {loading ? (
                <div className="flex items-center justify-center py-8 text-slate-400 gap-2">
                  <Loader2 size={18} className="animate-spin" />
                  <span className="text-sm">Loading comments...</span>
                </div>
              ) : comments.length === 0 ? (
                <p className="text-center text-sm text-slate-400 py-6 italic">No comments yet. Feel free to add more details.</p>
              ) : (
                comments.map(c => {
                  const isCustomer = c.authorId === ticket.reporterId || (!ticket.reporterId && c.authorName === ticket.reporterName);
                  return (
                    <div key={c.id} className={`flex gap-3 group/comment ${isCustomer ? 'flex-row-reverse' : ''}`}>
                      <UserProfilePopover userId={c.authorId} userName={c.authorName}>
                        <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${avatarColor(c.authorName)} text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm ring-2 ring-transparent group-hover/comment:ring-primary-500/30 transition-all`}>
                          {getInitials(c.authorName)}
                        </div>
                      </UserProfilePopover>
                      <div className={`flex flex-col max-w-[85%] ${isCustomer ? 'items-end' : ''}`}>
                        <div className={`flex items-center gap-2 mb-1 ${isCustomer ? 'flex-row-reverse' : ''}`}>
                          <UserProfilePopover userId={c.authorId} userName={c.authorName}>
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-primary-500 transition-colors cursor-pointer">{c.authorName}</span>
                          </UserProfilePopover>
                        </div>
                        <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm border ${
                          isCustomer
                            ? 'bg-primary-600 border-primary-700 text-white rounded-tr-sm'
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-tl-sm'
                        }`}>
                          {c.content}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={commentsEndRef} />
            </div>

            {/* Reply Box */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
              <div className="flex-1 relative">
                <textarea
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Add a comment... (Ctrl+Enter to send)"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-4 pr-12 py-3 text-sm focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 outline-none resize-none min-h-[44px] max-h-[120px] text-slate-800 dark:text-slate-200 placeholder-slate-400 transition-all"
                  rows={2}
                />
                <button
                  onClick={handleSendComment}
                  disabled={!commentText.trim() || isSending}
                  className="absolute right-2 bottom-2 p-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {isSending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerTicketDetailModal;
