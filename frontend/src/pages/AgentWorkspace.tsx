import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/auth';
import { getTickets, updateTicketStatus, getComments, assignTicket } from '../api/apiClient';
import type { TicketFilterParams } from '../api/apiClient';
import { subscribeToTicket, sendChatMessage, type ChatMessagePayload } from '../services/websocket';
import type { Ticket } from '../types/ticket';
import type { Comment } from '../api/apiClient';
import Sidebar from '../components/AgentWorkspace/Sidebar';
import TicketList from '../components/AgentWorkspace/TicketList';
import TicketDetail from '../components/AgentWorkspace/TicketDetail';
import FilterBar, { type TicketFilters } from '../components/AgentWorkspace/FilterBar';
import AgentMiniDashboard from '../components/AgentWorkspace/AgentMiniDashboard';
import UserInfoPanel from '../components/AgentWorkspace/UserInfoPanel';
import GlobalCallPanel from '../components/GlobalCallPanel';
import MessagesTab from '../components/MessagesTab';
import SupportRequestsPanel from '../components/SupportRequestsPanel';
import SupportRequestDetail from '../components/SupportRequestDetail';

export type TabId = 'assigned' | 'in_progress' | 'resolved' | 'overdue' | 'activity' | 'messages' | 'support_requests';

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
  const [sortBy, setSortBy] = useState('newest');
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);

  const [selectedSupportRequest, setSelectedSupportRequest] = useState<{
    id: number;
    customerName: string;
    topic: string;
    description: string;
    conversationId: number;
    createdAt: string;
  } | null>(null);

  // Filter state
  const [filters, setFilters] = useState<TicketFilters>({
    keyword: '',
    status: 'ALL',
    priority: 'ALL',
    overdue: 'ALL',
  });

  const buildApiParams = useCallback((): TicketFilterParams | undefined => {
    const params: TicketFilterParams = {};

    if (activeTab === 'in_progress') {
      params.status = 'IN_PROGRESS';
    } else if (activeTab === 'resolved') {
      params.status = 'RESOLVED';
    } else if (activeTab === 'overdue') {
      params.overdue = true;
    }

    if (filters.status !== 'ALL') {
      params.status = filters.status;
    }
    if (filters.priority !== 'ALL') {
      params.priority = filters.priority;
    }
    if (filters.overdue !== 'ALL') {
      params.overdue = filters.overdue === 'true';
    }
    if (filters.keyword.trim()) {
      params.keyword = filters.keyword.trim();
    }

    if (Object.keys(params).length === 0) return undefined;
    return params;
  }, [activeTab, filters]);

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      const params = buildApiParams();
      const data = await getTickets(params);
      // Backend filters by assignee for AGENT role — no need to filter client-side
      setAllTickets(data);
    } catch {
      console.warn('Backend unavailable');
      setAllTickets([]);
    } finally {
      setLoading(false);
    }
  }, [buildApiParams]);

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
        if (targetTicket.status === 'IN_PROGRESS') {
          setActiveTab('in_progress');
        } else if (targetTicket.status === 'RESOLVED' || targetTicket.status === 'CLOSED') {
          setActiveTab('resolved');
        } else if (isOverdue(targetTicket)) {
          setActiveTab('overdue');
        } else {
          setActiveTab('assigned');
        }
        setSearchParams({}, { replace: true });
      }
    }
  }, [searchParams, allTickets, setSearchParams]);

  // Polling for real-time updates
  useEffect(() => {
    const interval = setInterval(fetchTickets, 10000);
    return () => clearInterval(interval);
  }, [fetchTickets]);

  // Handle incoming WS message
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

  // Fetch comments via REST + subscribe via WebSocket
  useEffect(() => {
    if (!selectedTicketId) return;

    let isCancelled = false;

    setCommentsLoading(true);
    getComments(selectedTicketId)
      .then(data => { if (!isCancelled) setComments(data); })
      .catch(() => { if (!isCancelled) setComments([]); })
      .finally(() => { if (!isCancelled) setCommentsLoading(false); });

    const unsubscribeWs = subscribeToTicket(selectedTicketId, handleWsMessage);

    return () => {
      isCancelled = true;
      unsubscribeWs();
    };
  }, [selectedTicketId, handleWsMessage]);

  // Client-side filtering for resolved tab (both RESOLVED and CLOSED)
  const getDisplayTickets = (): Ticket[] => {
    let base = allTickets;

    // For 'resolved' tab, also include CLOSED since backend only filters by RESOLVED
    if (activeTab === 'resolved') {
      base = base.filter(t => t.status === 'RESOLVED' || t.status === 'CLOSED');
    }

    return [...base].sort((a, b) => {
      if (sortBy === 'oldest') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      if (sortBy === 'due_date') return (new Date(a.dueDate ?? '9999').getTime()) - (new Date(b.dueDate ?? '9999').getTime());
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
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

  const handleAssignToMe = async (id: number) => {
    if (!user) return;
    setAllTickets(prev => prev.map(t =>
      t.id === id ? { ...t, assigneeId: user.id, status: t.status === 'NEW' ? 'ASSIGNED' : t.status } : t
    ));
    try {
      await assignTicket(id, user.id);
    } catch {
      fetchTickets();
    }
  };

  const handleQuickStatusChange = async (id: number, status: string) => {
    setAllTickets(prev => prev.map(t =>
      t.id === id ? { ...t, status } : t
    ));
    try {
      await updateTicketStatus(id, status);
    } catch {
      fetchTickets();
    }
  };

  const handlePostComment = (_ticketId: number, content: string) => {
    if (!selectedTicketId || !user) return;
    sendChatMessage({
      ticketId: selectedTicketId,
      senderId: user.id,
      senderName: user.name,
      senderRole: user.role,
      content,
    });
  };

  const counts = {
    assigned: allTickets.filter(t => t.status !== 'RESOLVED' && t.status !== 'CLOSED').length,
    in_progress: allTickets.filter(t => t.status === 'IN_PROGRESS').length,
    resolved: allTickets.filter(t => t.status === 'RESOLVED' || t.status === 'CLOSED').length,
    overdue: allTickets.filter(isOverdue).length,
  };

  const displayTickets = getDisplayTickets();
  const selectedTicket = allTickets.find(t => t.id === selectedTicketId) ?? null;

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-slate-100 dark:bg-slate-900 transition-colors duration-300">
      {user && (
        <GlobalCallPanel
          agentId={user.id}
          agentName={user.name}
          currentViewingTicketId={selectedTicketId}
        />
      )}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={(tab) => { setActiveTab(tab as TabId); setSelectedTicketId(null); }}
        counts={counts}
        agentName={user?.name ?? 'Agent'}
        agentType={user?.agentType}
      />

      <div className="flex-1 flex overflow-hidden min-w-0">
        {activeTab === 'messages' ? (
          <MessagesTab
            selfId={user?.id ?? 0}
            selfName={user?.name ?? 'Agent'}
            selfRole="AGENT"
          />
        ) : (
          <>
            {/* Left Panel (List) */}
            <div className="w-[380px] xl:w-[420px] flex-shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm z-10 flex flex-col transition-colors duration-300">
              {activeTab === 'support_requests' ? (
                <SupportRequestsPanel
                  onSelectRequest={(request) => setSelectedSupportRequest(request)}
                />
              ) : (
                <>
                  <AgentMiniDashboard />
                  <FilterBar filters={filters} onFilterChange={setFilters} />
                  <TicketList
                    tickets={displayTickets}
                    selectedId={selectedTicketId}
                    onSelect={setSelectedTicketId}
                    loading={loading}
                    filterPriority={filters.priority}
                    setFilterPriority={(p) => setFilters(prev => ({ ...prev, priority: p }))}
                    sortBy={sortBy}
                    setSortBy={setSortBy}
                    onRefresh={fetchTickets}
                    onAssignToMe={handleAssignToMe}
                    onQuickStatusChange={handleQuickStatusChange}
                    currentUserId={user?.id}
                  />
                </>
              )}
            </div>

            {/* Right Panel (Detail + User Info) */}
            <div className="flex-1 flex overflow-hidden">
              <div className="flex-1 hidden md:flex flex-col overflow-hidden bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
                {activeTab === 'support_requests' ? (
                  selectedSupportRequest ? (
                    <SupportRequestDetail
                      supportRequest={selectedSupportRequest}
                      onClose={() => setSelectedSupportRequest(null)}
                      onConversationUpdated={() => {}}
                    />
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 gap-4 bg-slate-50 dark:bg-slate-900">
                      <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-2">
                        <svg width="40" height="40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.306 5.48.183.184.281.436.273.693l-.062 2.05c-.007.243.19.444.428.411l2.091-.284c.241-.033.486.012.697.126A8.67 8.67 0 0012 20.25z" />
                        </svg>
                      </div>
                      <p className="text-lg font-medium text-slate-600 dark:text-slate-300">Trung tâm Hỗ trợ</p>
                      <p className="text-sm max-w-sm text-center">Chọn một yêu cầu hỗ trợ từ danh sách bên trái để xem chi tiết và trò chuyện.</p>
                    </div>
                  )
                ) : (
                  <TicketDetail
                    ticket={selectedTicket}
                    comments={comments}
                    commentsLoading={commentsLoading}
                    onUpdateStatus={handleUpdateStatus}
                    onTicketAssigned={handleTicketAssigned}
                    onPostComment={handlePostComment}
                    agentName={user?.name ?? 'Agent'}
                  />
                )}
              </div>

              {/* User Info Panel — shown when viewing a ticket (not support requests) */}
              <UserInfoPanel userId={activeTab !== 'support_requests' ? (selectedTicket?.reporterId ?? null) : null} />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AgentWorkspace;
