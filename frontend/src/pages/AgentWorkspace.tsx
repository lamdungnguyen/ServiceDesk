import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/auth';
import { getTickets, updateTicketStatus, getComments, postComment } from '../api/apiClient';
import type { Ticket } from '../types/ticket';
import type { Comment } from '../api/apiClient';
import Sidebar from '../components/AgentWorkspace/Sidebar';
import TicketList from '../components/AgentWorkspace/TicketList';
import TicketDetail from '../components/AgentWorkspace/TicketDetail';

// Removed mock data

export type TabId = 'assigned' | 'in_progress' | 'resolved' | 'overdue' | 'activity';

const isOverdue = (ticket: Ticket) =>
  ticket.dueDate != null &&
  new Date(ticket.dueDate) < new Date() &&
  ticket.status !== 'RESOLVED' &&
  ticket.status !== 'CLOSED';

const AgentWorkspace = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabId>('assigned');
  const [allTickets, setAllTickets] = useState<Ticket[]>([]);
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterPriority, setFilterPriority] = useState('ALL');
  const [sortBy, setSortBy] = useState('newest');
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getTickets();
      // Filter to only show tickets assigned to current user
      const myId = user?.id;
      const mine = myId != null ? data.filter(t => t.assigneeId === myId) : data;
      setAllTickets(mine);
    } catch {
      console.warn('Backend unavailable');
      setAllTickets([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchTickets();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [fetchTickets]);

  // Auto-select ticket from query param (from notification click)
  useEffect(() => {
    const ticketIdParam = searchParams.get('ticketId');
    if (ticketIdParam && allTickets.length > 0) {
      const targetId = Number(ticketIdParam);
      const targetTicket = allTickets.find(t => t.id === targetId);
      if (targetTicket) {
        setSelectedTicketId(targetId);
        // Switch to appropriate tab based on ticket status
        if (targetTicket.status === 'IN_PROGRESS') {
          setActiveTab('in_progress');
        } else if (targetTicket.status === 'RESOLVED' || targetTicket.status === 'CLOSED') {
          setActiveTab('resolved');
        } else if (isOverdue(targetTicket)) {
          setActiveTab('overdue');
        } else {
          setActiveTab('assigned');
        }
        // Clear query param
        setSearchParams({}, { replace: true });
      }
    }
  }, [searchParams, allTickets, setSearchParams]);

  // Polling for real-time updates (new assignments)
  useEffect(() => {
    const interval = setInterval(fetchTickets, 10000);
    return () => clearInterval(interval);
  }, [fetchTickets]);

  // Fetch comments when ticket is selected and poll every 5s
  useEffect(() => {
    if (!selectedTicketId) return;

    let isCancelled = false;
    const fetchComments = () => {
      getComments(selectedTicketId)
        .then((data) => {
          if (!isCancelled) setComments(data);
        })
        .catch(() => {
          if (!isCancelled) setComments([]);
        });
    };

    setCommentsLoading(true);
    fetchComments();
    const interval = window.setInterval(fetchComments, 5000);

    return () => {
      isCancelled = true;
      window.clearInterval(interval);
      setCommentsLoading(false);
    };
  }, [selectedTicketId]);

  // Tab filtering
  const getFilteredTickets = (): Ticket[] => {
    let base = allTickets;
    if (activeTab === 'in_progress') base = base.filter(t => t.status === 'IN_PROGRESS');
    else if (activeTab === 'resolved') base = base.filter(t => t.status === 'RESOLVED' || t.status === 'CLOSED');
    else if (activeTab === 'overdue') base = base.filter(isOverdue);
    // 'assigned' and 'activity' show all

    if (filterPriority !== 'ALL') base = base.filter(t => t.priority === filterPriority);

    return base.sort((a, b) => {
      if (sortBy === 'oldest') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      if (sortBy === 'due_date') return (new Date(a.dueDate ?? '9999').getTime()) - (new Date(b.dueDate ?? '9999').getTime());
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(); // newest
    });
  };

  const handleUpdateStatus = async (id: number, status: string) => {
    try {
      await updateTicketStatus(id, status);
    } catch { /* optimistic update still happens */ }
    setAllTickets(prev => prev.map(t => t.id === id ? { ...t, status } : t));
  };

  const handleTicketAssigned = (id: number, assigneeId: number) => {
    setAllTickets(prev => prev.map(t => t.id === id ? { ...t, assigneeId } : t));
  };

  const handlePostComment = async (ticketId: number, content: string) => {
    const optimistic: Comment = {
      id: Date.now(),
      ticketId,
      content,
      authorId: user?.id ?? 0,
      authorName: user?.name ?? 'Agent',
      createdAt: new Date().toISOString(),
    };
    setComments(prev => [...prev, optimistic]);
    try {
      const real = await postComment(ticketId, content);
      setComments(prev => prev.map(c => c.id === optimistic.id ? real : c));
    } catch { /* keep optimistic */ }
  };

  const counts = {
    assigned: allTickets.length,
    in_progress: allTickets.filter(t => t.status === 'IN_PROGRESS').length,
    resolved: allTickets.filter(t => t.status === 'RESOLVED' || t.status === 'CLOSED').length,
    overdue: allTickets.filter(isOverdue).length,
  };

  const filteredTickets = getFilteredTickets();
  const selectedTicket = allTickets.find(t => t.id === selectedTicketId) ?? null;

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-slate-100 dark:bg-slate-900 transition-colors duration-300">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={(tab) => { setActiveTab(tab as TabId); setSelectedTicketId(null); }}
        counts={counts}
        agentName={user?.name ?? 'Agent'}
        agentType={user?.agentType}
      />

      <div className="flex-1 flex overflow-hidden min-w-0">
        {/* Ticket List */}
        <div className="w-[380px] xl:w-[420px] flex-shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm z-10 flex flex-col transition-colors duration-300">
          <TicketList
            tickets={filteredTickets}
            selectedId={selectedTicketId}
            onSelect={setSelectedTicketId}
            loading={loading}
            filterPriority={filterPriority}
            setFilterPriority={setFilterPriority}
            sortBy={sortBy}
            setSortBy={setSortBy}
            onRefresh={fetchTickets}
          />
        </div>

        {/* Ticket Detail */}
        <div className="flex-1 hidden md:flex flex-col overflow-hidden bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
          <TicketDetail
            ticket={selectedTicket}
            comments={comments}
            commentsLoading={commentsLoading}
            onUpdateStatus={handleUpdateStatus}
            onTicketAssigned={handleTicketAssigned}
            onPostComment={handlePostComment}
            agentName={user?.name ?? 'Agent'}
          />
        </div>
      </div>
    </div>
  );
};

export default AgentWorkspace;
