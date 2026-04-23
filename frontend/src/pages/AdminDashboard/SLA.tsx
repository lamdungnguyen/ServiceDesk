import type { Ticket } from '../../types/ticket';
import { AlertTriangle, Clock, ShieldAlert } from 'lucide-react';

interface SLAProps {
  tickets: Ticket[];
}

const SLA = ({ tickets }: SLAProps) => {
  // In a real app, SLA logic is more complex. Mocking overdue logic here based on status.
  const overdueTickets = tickets.filter(t => t.priority === 'URGENT' || t.status === 'NEW');
  const warningTickets = tickets.filter(t => t.priority === 'HIGH' && t.status === 'IN_PROGRESS');

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">SLA Monitoring</h2>
          <p className="text-slate-500 dark:text-slate-400">Track Service Level Agreement compliance</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Overdue */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-red-200 dark:border-red-900/50 shadow-sm overflow-hidden flex flex-col h-full">
          <div className="p-5 border-b border-red-100 dark:border-red-900/30 bg-red-50 dark:bg-red-900/10 flex items-center gap-3">
            <ShieldAlert className="text-red-600 dark:text-red-400" size={24} />
            <h3 className="font-bold text-red-800 dark:text-red-400">SLA Breached (Overdue)</h3>
          </div>
          <div className="p-4 flex-1">
            {overdueTickets.length === 0 ? (
              <p className="text-slate-500 text-center py-8">No overdue tickets. Great job!</p>
            ) : (
              <div className="space-y-3">
                {overdueTickets.map(t => (
                  <div key={t.id} className="flex items-center justify-between p-3 rounded-xl border border-red-100 dark:border-red-900/30 bg-red-50/50 dark:bg-red-900/5">
                    <div>
                      <div className="font-medium text-slate-800 dark:text-slate-200 line-clamp-1">{t.title}</div>
                      <div className="text-xs text-slate-500 mt-1">Ticket #{t.id} • {t.priority}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-red-600 dark:text-red-400">-2h 45m</div>
                      <div className="text-xs text-slate-400">Past SLA</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Warning */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-amber-200 dark:border-amber-900/50 shadow-sm overflow-hidden flex flex-col h-full">
          <div className="p-5 border-b border-amber-100 dark:border-amber-900/30 bg-amber-50 dark:bg-amber-900/10 flex items-center gap-3">
            <AlertTriangle className="text-amber-600 dark:text-amber-400" size={24} />
            <h3 className="font-bold text-amber-800 dark:text-amber-400">Nearing SLA Breach</h3>
          </div>
          <div className="p-4 flex-1">
            {warningTickets.length === 0 ? (
              <p className="text-slate-500 text-center py-8">No tickets near breach.</p>
            ) : (
              <div className="space-y-3">
                {warningTickets.map(t => (
                  <div key={t.id} className="flex items-center justify-between p-3 rounded-xl border border-amber-100 dark:border-amber-900/30 bg-amber-50/50 dark:bg-amber-900/5">
                    <div>
                      <div className="font-medium text-slate-800 dark:text-slate-200 line-clamp-1">{t.title}</div>
                      <div className="text-xs text-slate-500 mt-1">Ticket #{t.id} • {t.priority}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                        <Clock size={14} />
                        45m left
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SLA;
