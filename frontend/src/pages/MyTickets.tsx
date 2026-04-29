import { useCallback, useEffect, useState } from 'react';
import type { Ticket as TicketType } from '../types/ticket';
import { getTickets } from '../api/apiClient';
import TicketCard from '../components/TicketCard';
import CustomerTicketDetailModal from '../components/CustomerTicketDetailModal';
import { useAuth } from '../context/auth';
import { RefreshCcw, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const MyTickets = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<TicketType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<TicketType | null>(null);

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getTickets();
      setTickets(data);
    } catch (err) {
      console.error("Failed to fetch tickets:", err);
      setError("Cannot connect to backend to fetch your tickets.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      const timer = window.setTimeout(() => {
        void fetchTickets();
      }, 0);
      return () => window.clearTimeout(timer);
    }
  }, [fetchTickets, user]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-2 tracking-tight">My Tickets</h1>
          <p className="text-slate-500 dark:text-slate-400">Track and manage your support requests.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button onClick={fetchTickets} className="p-2.5 text-slate-500 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm focus:ring-2 focus:ring-primary-500/20">
            <RefreshCcw size={18} className={loading ? "animate-spin" : ""} />
          </button>
          
          <Link to="/" className="flex items-center gap-2 bg-gradient-to-r from-primary-600 to-indigo-600 text-white px-5 py-2.5 rounded-lg font-medium hover:from-primary-700 hover:to-indigo-700 transition-all shadow-lg shadow-primary-500/30 active:scale-95 transform">
            <span>Submit New Request</span>
          </Link>
        </div>
      </div>

      {error && (
        <div className="mb-8 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-xl flex items-center gap-3 text-red-700 dark:text-red-400">
          <AlertCircle size={20} />
          <p className="font-medium text-sm">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="glass-card p-5 animate-pulse min-h-[220px] flex flex-col border border-slate-200/50 dark:border-slate-700/30">
              <div className="h-6 bg-slate-200 dark:bg-slate-700/50 rounded-full w-20 mb-4"></div>
              <div className="h-5 bg-slate-200 dark:bg-slate-700/50 rounded w-4/5 mb-3"></div>
              <div className="h-4 bg-slate-200 dark:bg-slate-700/50 rounded w-2/3 mb-6"></div>
            </div>
          ))}
        </div>
      ) : tickets.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-12 text-center">
          <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={32} />
          </div>
          <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">No tickets found</h3>
          <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            You haven't submitted any support requests yet. When you do, they will appear here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {tickets.map((ticket) => (
            <TicketCard key={ticket.id} ticket={ticket} onClick={() => setSelectedTicket(ticket)} />
          ))}
        </div>
      )}

      {selectedTicket && (
        <CustomerTicketDetailModal 
          ticket={selectedTicket} 
          isOpen={!!selectedTicket} 
          onClose={() => setSelectedTicket(null)} 
        />
      )}
    </div>
  );
};

export default MyTickets;
