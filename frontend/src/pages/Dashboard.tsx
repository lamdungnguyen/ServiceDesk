import { useCallback, useEffect, useState } from 'react';
import type { Ticket as TicketType } from '../types/ticket';
import { getTickets } from '../api/apiClient';
import TicketCard from '../components/TicketCard';
import CreateTicketModal from '../components/CreateTicketModal';
import { useAuth } from '../context/auth';
import { Plus, Filter, LayoutGrid, List as ListIcon, RefreshCcw, CheckCircle2, Clock, AlertCircle, TrendingUp } from 'lucide-react';

const mockTickets: TicketType[] = [
  {
    id: 101,
    title: "Cannot access VPN from home network",
    description: "I am getting a connection timeout error when trying to connect to the corporate VPN using Cisco AnyConnect. It was working fine yesterday.",
    status: "NEW",
    priority: "HIGH",
    category: "NETWORK",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    dueDate: null,
    reporterId: 1,
    reporterName: "John Doe",
    reporterEmail: "john.doe@example.com",
    assigneeId: null
  },
  {
    id: 102,
    title: "Need software license for Adobe Creative Cloud",
    description: "Please assign a license for my account so I can start working on the new marketing materials.",
    status: "IN_PROGRESS",
    priority: "MEDIUM",
    category: "SOFTWARE",
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 3600000).toISOString(),
    dueDate: null,
    reporterId: 2,
    reporterName: "Alice Smith",
    reporterEmail: "alice.smith@example.com",
    assigneeId: 5
  },
  {
    id: 103,
    title: "Laptop screen flickering intermittently",
    description: "My Dell XPS 15 screen keeps flickering when I open multiple heavy applications. Could it be a hardware issue?",
    status: "ASSIGNED",
    priority: "MEDIUM",
    category: "HARDWARE",
    createdAt: new Date(Date.now() - 172800000).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
    dueDate: null,
    reporterId: 3,
    reporterName: "Bob Williams",
    reporterEmail: "bob.w@example.com",
    assigneeId: 4
  },
  {
    id: 104,
    title: "Update security policies on production servers",
    description: "We need to apply the latest security patches to all production servers before the upcoming audit next week. This is extremely critical.",
    status: "RESOLVED",
    priority: "URGENT",
    category: "SECURITY",
    createdAt: new Date(Date.now() - 345600000).toISOString(),
    updatedAt: new Date(Date.now() - 43200000).toISOString(),
    dueDate: null,
    reporterId: 4,
    reporterName: "System Alert",
    reporterEmail: "alert@system.local",
    assigneeId: 1
  }
];

const StatCard = ({ title, value, icon, trend, colorClass }: { title: string, value: string, icon: React.ReactNode, trend: string, colorClass: string }) => (
  <div className="glass-card p-5 relative overflow-hidden group">
    <div className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-3xl opacity-20 -mr-8 -mt-8 ${colorClass} transition-transform duration-500 group-hover:scale-150`}></div>
    <div className="flex justify-between items-start mb-4 relative z-10">
      <h4 className="text-slate-500 dark:text-slate-400 font-medium text-sm">{title}</h4>
      <div className={`p-2 rounded-lg ${colorClass} bg-opacity-10 text-current`}>
        {icon}
      </div>
    </div>
    <div className="flex items-baseline gap-3 relative z-10">
      <span className="text-3xl font-bold text-slate-800 dark:text-white">{value}</span>
      <span className="flex items-center text-xs font-medium text-emerald-500">
        <TrendingUp size={12} className="mr-1" /> {trend}
      </span>
    </div>
  </div>
);

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<TicketType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUsingMock, setIsUsingMock] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    setError(null);
    setIsUsingMock(false);
    try {
      const data = await getTickets();
      setTickets(data);
    } catch (err) {
      console.error("Failed to fetch tickets:", err);
      setError("Cannot connect to backend. Showing mock data for UI preview.");
      setTickets(mockTickets);
      setIsUsingMock(true);
    } finally {
      setTimeout(() => setLoading(false), 600); // Fake delay for smooth skeleton transition
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchTickets();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [fetchTickets]);

  const stats = [
    { title: "Total Tickets", value: tickets.length.toString(), icon: <LayoutGrid size={20} className="text-primary-500" />, trend: "+12%", colorClass: "bg-primary-500" },
    { title: "In Progress", value: tickets.filter(t => t.status === 'IN_PROGRESS' || t.status === 'ASSIGNED').length.toString(), icon: <Clock size={20} className="text-amber-500" />, trend: "+5%", colorClass: "bg-amber-500" },
    { title: "Resolved", value: tickets.filter(t => t.status === 'RESOLVED' || t.status === 'CLOSED').length.toString(), icon: <CheckCircle2 size={20} className="text-emerald-500" />, trend: "+18%", colorClass: "bg-emerald-500" },
    { title: "Urgent", value: tickets.filter(t => t.priority === 'URGENT').length.toString(), icon: <AlertCircle size={20} className="text-red-500" />, trend: "-2%", colorClass: "bg-red-500" },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-2 tracking-tight">
            {user?.role === 'ADMIN' ? 'All Tickets Overview' : 
             user?.role === 'AGENT' ? 'Assigned Tickets' : 
             'My Tickets'}
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            {user?.role === 'ADMIN' ? 'Manage and assign system tickets.' : 
             user?.role === 'AGENT' ? 'Resolve and update ticket status.' : 
             'Track and manage your support requests.'}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button onClick={fetchTickets} className="p-2.5 text-slate-500 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm focus:ring-2 focus:ring-primary-500/20">
            <RefreshCcw size={18} className={loading ? "animate-spin" : ""} />
          </button>
          
          {user?.role === 'CUSTOMER' && (
            <button onClick={() => setIsCreateModalOpen(true)} className="flex items-center gap-2 bg-gradient-to-r from-primary-600 to-indigo-600 text-white px-5 py-2.5 rounded-lg font-medium hover:from-primary-700 hover:to-indigo-700 transition-all shadow-lg shadow-primary-500/30 active:scale-95 transform">
              <Plus size={18} />
              <span>New Ticket</span>
            </button>
          )}
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="mb-8 p-4 bg-amber-50/80 dark:bg-amber-900/20 border border-amber-200/50 dark:border-amber-800/50 rounded-xl flex items-center justify-between backdrop-blur-sm shadow-sm animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="flex items-center gap-3 text-amber-700 dark:text-amber-400">
            <AlertCircle size={20} />
            <p className="font-medium text-sm">{error}</p>
          </div>
          {isUsingMock && (
             <span className="text-[10px] px-2 py-1 bg-amber-100 dark:bg-amber-900/40 rounded-md text-amber-700 dark:text-amber-400 font-bold uppercase tracking-widest shadow-sm">Preview Mode</span>
          )}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, idx) => (
          <div key={idx} className="animate-in fade-in slide-in-from-bottom-4" style={{ animationDelay: `${idx * 100}ms`, animationFillMode: 'both' }}>
             <StatCard {...stat} />
          </div>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="glass-card p-2 sm:p-6 mb-8">
        {/* Controls Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 px-2 sm:px-0">
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/50 p-1 rounded-lg w-full sm:w-auto overflow-x-auto hide-scrollbar">
            {['All Tickets', 'My Assigned', 'Unresolved'].map((tab) => {
              const tabId = tab.toLowerCase().replace(' ', '-');
              return (
                <button 
                  key={tabId}
                  onClick={() => setActiveTab(tabId)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap ${
                    activeTab === tabId 
                    ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm' 
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-700/50'
                  }`}
                >
                  {tab}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <div className="flex bg-slate-100 dark:bg-slate-800/50 rounded-lg p-1">
              <button className="p-1.5 bg-white dark:bg-slate-700 text-slate-800 dark:text-white rounded shadow-sm transition-colors">
                <LayoutGrid size={16} />
              </button>
              <button className="p-1.5 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white rounded transition-colors">
                <ListIcon size={16} />
              </button>
            </div>
            <button className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 px-3 py-2 rounded-lg font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-sm">
              <Filter size={16} />
              <span className="hidden sm:inline">Filters</span>
            </button>
          </div>
        </div>

        {/* Ticket Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="glass-card p-5 animate-pulse min-h-[220px] flex flex-col border border-slate-200/50 dark:border-slate-700/30">
                <div className="flex justify-between items-start mb-4">
                  <div className="h-4 bg-slate-200 dark:bg-slate-700/50 rounded w-16"></div>
                  <div className="h-6 bg-slate-200 dark:bg-slate-700/50 rounded-full w-20"></div>
                </div>
                <div className="h-5 bg-slate-200 dark:bg-slate-700/50 rounded w-4/5 mb-3"></div>
                <div className="h-4 bg-slate-200 dark:bg-slate-700/50 rounded w-full mb-2"></div>
                <div className="h-4 bg-slate-200 dark:bg-slate-700/50 rounded w-2/3 mb-6"></div>
                <div className="mt-auto flex justify-between items-center pt-4 border-t border-slate-100 dark:border-slate-800/50">
                  <div className="flex gap-2"><div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700/50"></div></div>
                  <div className="w-16 h-4 rounded bg-slate-200 dark:bg-slate-700/50"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {tickets.map((ticket, idx) => (
              <div key={ticket.id} className="animate-in fade-in slide-in-from-bottom-4 h-full" style={{ animationDelay: `${idx * 100}ms`, animationFillMode: 'both' }}>
                <TicketCard ticket={ticket} />
              </div>
            ))}
          </div>
        )}
      </div>

      <CreateTicketModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
        onTicketCreated={fetchTickets} 
      />
    </div>
  );
};



export default Dashboard;
