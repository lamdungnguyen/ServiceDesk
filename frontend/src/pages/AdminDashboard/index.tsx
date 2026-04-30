import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { LayoutDashboard, Ticket, Users, Clock, Settings, Shield } from 'lucide-react';
import { getTickets } from '../../api/apiClient';
import type { Ticket as TicketType } from '../../types/ticket';

import Overview from './Overview';
import Tickets from './Tickets';
import UsersList from './Users';
import SLA from './SLA';

const AdminDashboard = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('overview');
  const [tickets, setTickets] = useState<TicketType[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);

  const fetchTickets = async () => {
    try {
      const data = await getTickets();
      setTickets(data);
    } catch (err) {
      console.error("Failed to fetch tickets", err);
    } finally {
      setLoading(false);
    }
  };

  const handleTicketAssigned = (ticketId: number, assigneeId: number) => {
    setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, assigneeId, status: t.status === 'NEW' ? 'ASSIGNED' : t.status } : t));
    fetchTickets(); // Refresh to ensure data sync
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchTickets();
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  // Handle query params for notification navigation
  useEffect(() => {
    const ticketIdParam = searchParams.get('ticketId');
    const ticketsTab = searchParams.get('tickets');
    
    if (ticketsTab !== null || ticketIdParam) {
      setActiveTab('tickets');
    }
    
    if (ticketIdParam) {
      setSelectedTicketId(Number(ticketIdParam));
      // Clear query params after processing
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const navItems = [
    { id: 'overview', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { id: 'tickets', label: 'All Tickets', icon: <Ticket size={20} /> },
    { id: 'users', label: 'User Management', icon: <Users size={20} /> },
    { id: 'sla', label: 'SLA Monitoring', icon: <Clock size={20} /> },
  ];

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-slate-50 dark:bg-slate-900">
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col h-full z-10 hidden md:flex">
        <div className="p-6 pb-2">
          <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 mb-6">
            <Shield size={24} />
            <h2 className="font-bold text-lg">Admin Center</h2>
          </div>
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Navigation</div>
        </div>
        <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${
                activeTab === item.id
                  ? 'bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <div className={activeTab === item.id ? 'text-purple-600 dark:text-purple-400' : 'text-slate-400'}>
                {item.icon}
              </div>
              {item.label}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-200 dark:border-slate-800">
          <button className="w-full flex items-center gap-3 px-4 py-3 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors font-medium">
            <Settings size={20} className="text-slate-400" />
            System Settings
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8 relative">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          </div>
        ) : (
          <div className="max-w-7xl mx-auto h-full">
            {activeTab === 'overview' && <Overview tickets={tickets} />}
            {activeTab === 'tickets' && (
              <Tickets 
                tickets={tickets} 
                onTicketAssigned={handleTicketAssigned} 
                initialSelectedTicketId={selectedTicketId}
                onTicketViewed={() => setSelectedTicketId(null)}
              />
            )}
            {activeTab === 'users' && <UsersList />}
            {activeTab === 'sla' && <SLA tickets={tickets} />}
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
