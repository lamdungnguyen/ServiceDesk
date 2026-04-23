import { useState } from 'react';
import type { Ticket } from '../../types/ticket';
import { Search, Filter, MoreVertical, ShieldAlert } from 'lucide-react';

interface TicketsProps {
  tickets: Ticket[];
}

const Tickets = ({ tickets }: TicketsProps) => {
  const [searchTerm, setSearchTerm] = useState('');

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
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-400">#{ticket.id}</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200 line-clamp-1 max-w-[250px]">
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
                <td className="p-4">
                  {ticket.assigneeId ? (
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xs font-bold">
                        A
                      </div>
                      <span className="text-sm text-slate-600 dark:text-slate-400">Agent {ticket.assigneeId}</span>
                    </div>
                  ) : (
                    <span className="text-sm text-slate-400 dark:text-slate-500 italic">Unassigned</span>
                  )}
                </td>
                <td className="p-4 text-right pr-6">
                  <button className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100">
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
    </div>
  );
};

export default Tickets;
