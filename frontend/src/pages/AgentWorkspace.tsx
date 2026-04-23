import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { getTickets, updateTicketStatus, getComments, postComment } from '../api/apiClient';
import type { Ticket } from '../types/ticket';
import type { Comment } from '../api/apiClient';
import Sidebar from '../components/AgentWorkspace/Sidebar';
import TicketList from '../components/AgentWorkspace/TicketList';
import TicketDetail from '../components/AgentWorkspace/TicketDetail';

// Rich mock data used as fallback when backend is unavailable
const MOCK_TICKETS: Ticket[] = [
  {
    id: 101,
    title: "Cannot access VPN from home network",
    description: "I am getting a connection timeout error when trying to connect to the corporate VPN using Cisco AnyConnect. It was working fine yesterday. I've tried restarting my router and reinstalling the client but nothing helps.",
    status: "NEW",
    priority: "HIGH",
    category: "NETWORK",
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    updatedAt: new Date(Date.now() - 3600000).toISOString(),
    dueDate: new Date(Date.now() + 7200000).toISOString(), // 2h from now
    reporterId: 1,
    reporterName: "John Doe",
    reporterEmail: "john.doe@example.com",
    assigneeId: 5,
  },
  {
    id: 102,
    title: "Need software license for Adobe Creative Cloud",
    description: "Please assign a license for my account so I can start working on the new Q3 marketing materials. My team lead has approved the purchase.",
    status: "IN_PROGRESS",
    priority: "MEDIUM",
    category: "SOFTWARE",
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 3600000).toISOString(),
    dueDate: new Date(Date.now() + 86400000).toISOString(), // 1 day from now
    reporterId: 2,
    reporterName: "Alice Smith",
    reporterEmail: "alice.smith@example.com",
    assigneeId: 5,
  },
  {
    id: 103,
    title: "Laptop screen flickering intermittently",
    description: "My Dell XPS 15 screen has been flickering every 10-15 minutes. It happened after installing a Windows update last Tuesday. Serial: DX15-8823.",
    status: "NEW",
    priority: "MEDIUM",
    category: "HARDWARE",
    createdAt: new Date(Date.now() - 43200000).toISOString(),
    updatedAt: new Date(Date.now() - 43200000).toISOString(),
    dueDate: new Date(Date.now() - 3600000).toISOString(), // OVERDUE by 1h
    reporterId: 3,
    reporterName: "Bob Williams",
    reporterEmail: "bob.w@example.com",
    assigneeId: 5,
  },
  {
    id: 104,
    title: "Update security policies on production servers",
    description: "Apply latest security patches to all production servers before the upcoming compliance audit. Priority: Critical. Downtime window: Sunday 02:00–06:00.",
    status: "RESOLVED",
    priority: "URGENT",
    category: "HARDWARE",
    createdAt: new Date(Date.now() - 345600000).toISOString(),
    updatedAt: new Date(Date.now() - 43200000).toISOString(),
    dueDate: new Date(Date.now() - 86400000).toISOString(),
    reporterId: 4,
    reporterName: "System Alert",
    reporterEmail: "alert@system.local",
    assigneeId: 5,
  },
  {
    id: 105,
    title: "Email signature template not rendering in Outlook",
    description: "The new company email signature HTML template shows broken images in Outlook 2019 for about 30% of users. Works fine in Gmail and Apple Mail.",
    status: "ASSIGNED",
    priority: "LOW",
    category: "SOFTWARE",
    createdAt: new Date(Date.now() - 172800000).toISOString(),
    updatedAt: new Date(Date.now() - 7200000).toISOString(),
    dueDate: new Date(Date.now() + 172800000).toISOString(),
    reporterId: 5,
    reporterName: "Carol Johnson",
    reporterEmail: "c.johnson@example.com",
    assigneeId: 5,
  },
];

const MOCK_COMMENTS: Record<number, Comment[]> = {
  101: [
    { id: 1, ticketId: 101, content: "I've checked the VPN logs. The issue seems to be with the user's ISP blocking port 443. Can you try switching to a different network?", authorId: 5, authorName: "Support Agent", createdAt: new Date(Date.now() - 1800000).toISOString() },
    { id: 2, ticketId: 101, content: "Tried my mobile hotspot and still getting the same error. Please advise.", authorId: 1, authorName: "John Doe", createdAt: new Date(Date.now() - 900000).toISOString() },
  ],
  102: [
    { id: 3, ticketId: 102, content: "License request submitted to procurement. ETA 2 business days.", authorId: 5, authorName: "Support Agent", createdAt: new Date(Date.now() - 3600000).toISOString() },
  ],
};

export type TabId = 'assigned' | 'in_progress' | 'resolved' | 'overdue' | 'activity';

const isOverdue = (ticket: Ticket) =>
  ticket.dueDate != null &&
  new Date(ticket.dueDate) < new Date() &&
  ticket.status !== 'RESOLVED' &&
  ticket.status !== 'CLOSED';

const AgentWorkspace = () => {
  const { user } = useAuth();
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
      setAllTickets(mine.length > 0 ? mine : MOCK_TICKETS);
    } catch {
      console.warn('Backend unavailable – using mock tickets');
      setAllTickets(MOCK_TICKETS);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchTickets(); }, [fetchTickets]);

  // Fetch comments when ticket is selected
  useEffect(() => {
    if (!selectedTicketId) return;
    setCommentsLoading(true);
    getComments(selectedTicketId)
      .then(setComments)
      .catch(() => setComments(MOCK_COMMENTS[selectedTicketId] ?? []))
      .finally(() => setCommentsLoading(false));
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
    <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-slate-100">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={(tab) => { setActiveTab(tab as TabId); setSelectedTicketId(null); }}
        counts={counts}
        agentName={user?.name ?? 'Agent'}
        agentType={user?.agentType}
      />

      <div className="flex-1 flex overflow-hidden min-w-0">
        {/* Ticket List */}
        <div className="w-[380px] xl:w-[420px] flex-shrink-0 border-r border-slate-200 bg-white shadow-sm z-10 flex flex-col">
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
        <div className="flex-1 hidden md:flex flex-col overflow-hidden bg-slate-50">
          <TicketDetail
            ticket={selectedTicket}
            comments={comments}
            commentsLoading={commentsLoading}
            onUpdateStatus={handleUpdateStatus}
            onPostComment={handlePostComment}
            agentName={user?.name ?? 'Agent'}
          />
        </div>
      </div>
    </div>
  );
};

export default AgentWorkspace;
