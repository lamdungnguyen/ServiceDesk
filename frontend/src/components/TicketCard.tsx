import React from 'react';
import type { Ticket as TicketType } from '../types/ticket';
import { Clock, AlertCircle, CheckCircle2, MessageSquare, MoreHorizontal } from 'lucide-react';

interface TicketCardProps {
  ticket: TicketType;
  onClick?: () => void;
}

const statusConfig: Record<string, { color: string, icon: React.ReactNode }> = {
  NEW: { color: 'bg-blue-100/80 text-blue-700 border-blue-200/50 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20', icon: <AlertCircle size={12} /> },
  ASSIGNED: { color: 'bg-purple-100/80 text-purple-700 border-purple-200/50 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/20', icon: <Clock size={12} /> },
  IN_PROGRESS: { color: 'bg-amber-100/80 text-amber-700 border-amber-200/50 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20', icon: <Clock size={12} /> },
  RESOLVED: { color: 'bg-emerald-100/80 text-emerald-700 border-emerald-200/50 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20', icon: <CheckCircle2 size={12} /> },
  CLOSED: { color: 'bg-slate-100/80 text-slate-700 border-slate-200/50 dark:bg-slate-500/10 dark:text-slate-400 dark:border-slate-500/20', icon: <CheckCircle2 size={12} /> },
};

const priorityIcons: Record<string, { icon: React.ReactNode, class: string }> = {
  LOW: { icon: <Clock size={14} />, class: "text-slate-400 bg-slate-100 dark:bg-slate-800" },
  MEDIUM: { icon: <Clock size={14} />, class: "text-blue-500 bg-blue-50 dark:bg-blue-500/10" },
  HIGH: { icon: <AlertCircle size={14} />, class: "text-orange-500 bg-orange-50 dark:bg-orange-500/10" },
  URGENT: { icon: <AlertCircle size={14} />, class: "text-red-500 bg-red-50 dark:bg-red-500/10" },
};

const TicketCard: React.FC<TicketCardProps> = ({ ticket, onClick }) => {
  const status = statusConfig[ticket.status] || statusConfig.NEW;
  const priority = priorityIcons[ticket.priority] || priorityIcons.LOW;

  return (
    <div onClick={onClick} className="glass-card p-5 hover:-translate-y-1 hover:shadow-xl transition-all duration-300 cursor-pointer group flex flex-col h-full border border-slate-200/60 dark:border-slate-700/50">
      <div className="flex justify-between items-start mb-4">
        <div className="flex flex-col gap-2">
          <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 tracking-wider uppercase">
            TKT-{ticket.id}
          </span>
          <span className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium border ${status.color} shadow-sm w-fit`}>
            {status.icon}
            {ticket.status.replace('_', ' ')}
          </span>
        </div>
        <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800">
          <MoreHorizontal size={18} />
        </button>
      </div>
      
      <h3 className="font-semibold text-slate-800 dark:text-slate-100 mb-2 group-hover:text-primary-500 dark:group-hover:text-primary-400 transition-colors line-clamp-2 leading-tight">
        {ticket.title}
      </h3>
      
      <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mb-6 flex-grow font-normal leading-relaxed">
        {ticket.description}
      </p>
      
      <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100 dark:border-slate-800/60">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
             {/* Reporter Avatar Mock */}
             <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-[10px] text-white font-bold shadow-sm">
                R{ticket.reporterId}
             </div>
             {ticket.assigneeId && (
               <div className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-[10px] text-white font-bold shadow-sm -ml-3 border-2 border-white dark:border-slate-900">
                  A{ticket.assigneeId}
               </div>
             )}
          </div>
          
          <div className="flex items-center gap-1 text-xs text-slate-400">
            <MessageSquare size={12} />
            <span>2</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
           <div className={`flex items-center justify-center w-6 h-6 rounded-full ${priority.class} shadow-sm`} title={`Priority: ${ticket.priority}`}>
             {priority.icon}
           </div>
           <div className="text-xs font-medium text-slate-400 dark:text-slate-500">
             {new Date(ticket.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
           </div>
        </div>
      </div>
    </div>
  );
};

export default TicketCard;
