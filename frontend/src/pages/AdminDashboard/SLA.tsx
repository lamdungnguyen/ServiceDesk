import { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts';
import { CheckCircle2, AlertTriangle, ShieldAlert, LayoutGrid, Clock, RefreshCw } from 'lucide-react';
import { getSlaStats, type SlaStats } from '../../api/apiClient';
import type { Ticket } from '../../types/ticket';

interface SLAProps {
  tickets: Ticket[];
}

const SLA = ({ tickets }: SLAProps) => {
  const [stats, setStats] = useState<SlaStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchStats = async () => {
    setLoading(true);
    try {
      const data = await getSlaStats();
      setStats(data);
      setLastUpdated(new Date());
    } catch {
      // fallback to client-side calculation
      const now = new Date();
      const total = tickets.length;
      const overdueCount = tickets.filter(t =>
        t.dueDate && now > new Date(t.dueDate) && t.status !== 'RESOLVED' && t.status !== 'CLOSED'
      ).length;
      const nearDeadlineCount = tickets.filter(t => {
        if (!t.dueDate || t.status === 'RESOLVED' || t.status === 'CLOSED') return false;
        const due = new Date(t.dueDate);
        const diff = due.getTime() - now.getTime();
        return diff > 0 && diff <= 30 * 60 * 1000;
      }).length;
      const onTime = total - overdueCount;
      setStats({
        totalTickets: total,
        onTime,
        overdue: overdueCount,
        nearDeadline: nearDeadlineCount,
        slaCompliance: total > 0 ? Math.round((onTime / total) * 1000) / 10 : 100,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchStats();
  }, [tickets.length]);

  const nearDeadlineTickets = tickets.filter(t => {
    if (!t.dueDate || t.status === 'RESOLVED' || t.status === 'CLOSED') return false;
    const now = new Date();
    const due = new Date(t.dueDate);
    const diff = due.getTime() - now.getTime();
    return diff > 0 && diff <= 30 * 60 * 1000;
  });

  const overdueTickets = tickets.filter(t =>
    t.dueDate && new Date() > new Date(t.dueDate) && t.status !== 'RESOLVED' && t.status !== 'CLOSED'
  );

  const pieData = stats ? [
    { name: 'On Time', value: stats.onTime, color: '#10b981' },
    { name: 'Overdue', value: stats.overdue, color: '#ef4444' },
  ].filter(d => d.value > 0) : [];

  const complianceColor = !stats ? 'text-slate-500'
    : stats.slaCompliance >= 85 ? 'text-emerald-600'
    : stats.slaCompliance >= 70 ? 'text-amber-500'
    : 'text-red-500';

  const complianceBg = !stats ? 'bg-slate-50 border-slate-200'
    : stats.slaCompliance >= 85 ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/10 dark:border-emerald-800/40'
    : stats.slaCompliance >= 70 ? 'bg-amber-50 border-amber-200 dark:bg-amber-900/10 dark:border-amber-800/40'
    : 'bg-red-50 border-red-200 dark:bg-red-900/10 dark:border-red-800/40';

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">SLA Dashboard</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </p>
        </div>
        <button
          onClick={() => void fetchStats()}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Stat Cards */}
      {loading && !stats ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 animate-pulse h-28" />
          ))}
        </div>
      ) : stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Total Tickets</p>
              <h3 className="text-3xl font-bold text-slate-800 dark:text-white">{stats.totalTickets}</h3>
            </div>
            <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20">
              <LayoutGrid size={24} className="text-blue-500" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">On Time</p>
              <h3 className="text-3xl font-bold text-emerald-600">{stats.onTime}</h3>
            </div>
            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20">
              <CheckCircle2 size={24} className="text-emerald-500" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Overdue</p>
              <h3 className="text-3xl font-bold text-red-600">{stats.overdue}</h3>
            </div>
            <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20">
              <ShieldAlert size={24} className="text-red-500" />
            </div>
          </div>

          <div className={`rounded-2xl p-6 border shadow-sm flex items-center justify-between ${complianceBg}`}>
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">SLA Compliance</p>
              <h3 className={`text-3xl font-bold ${complianceColor}`}>{stats.slaCompliance}%</h3>
            </div>
            <div className={`p-4 rounded-xl ${complianceBg}`}>
              <AlertTriangle size={24} className={complianceColor} />
            </div>
          </div>
        </div>
      )}

      {/* Chart + Near Deadline */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">SLA Status Distribution</h3>
          {!stats || stats.totalTickets === 0 ? (
            <div className="h-[260px] flex items-center justify-center text-slate-400 text-sm">No ticket data available.</div>
          ) : (
            <>
              <div className="h-[260px] w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={80}
                      outerRadius={110}
                      paddingAngle={4}
                      dataKey="value"
                      stroke="none"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgb(0 0 0 / 0.1)', fontSize: '13px' }}
                    />
                    <Legend
                      iconType="circle"
                      iconSize={10}
                      formatter={(value) => <span className="text-slate-600 dark:text-slate-300 text-xs font-semibold">{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none" style={{ top: '-20px' }}>
                  <span className={`text-3xl font-extrabold ${complianceColor}`}>{stats.slaCompliance}%</span>
                  <span className="text-xs text-slate-500 font-medium">Compliance</span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Near Deadline */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-amber-200 dark:border-amber-800/40 shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-amber-100 dark:border-amber-800/30 bg-amber-50 dark:bg-amber-900/10 flex items-center gap-3">
            <Clock className="text-amber-600 dark:text-amber-400" size={20} />
            <h3 className="font-bold text-amber-800 dark:text-amber-300">Near Deadline (≤ 30 min)</h3>
            {stats && stats.nearDeadline > 0 && (
              <span className="ml-auto bg-amber-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {stats.nearDeadline}
              </span>
            )}
          </div>
          <div className="p-4 flex-1 overflow-y-auto max-h-72">
            {nearDeadlineTickets.length === 0 ? (
              <p className="text-slate-500 text-center py-8 text-sm">No tickets nearing deadline.</p>
            ) : (
              <div className="space-y-2">
                {nearDeadlineTickets.map(t => {
                  const due = new Date(t.dueDate!);
                  const mins = Math.max(0, Math.floor((due.getTime() - Date.now()) / 60000));
                  return (
                    <div key={t.id} className="flex items-center justify-between p-3 rounded-xl border border-amber-100 dark:border-amber-900/30 bg-amber-50/50 dark:bg-amber-900/5">
                      <div className="min-w-0">
                        <div className="font-medium text-slate-800 dark:text-slate-200 truncate text-sm">{t.title}</div>
                        <div className="text-xs text-slate-500 mt-0.5">#{t.id} · {t.priority}</div>
                      </div>
                      <div className="ml-3 shrink-0 text-right">
                        <span className="text-sm font-bold text-amber-600 dark:text-amber-400">{mins}m left</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Overdue list */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-red-200 dark:border-red-800/40 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-red-100 dark:border-red-800/30 bg-red-50 dark:bg-red-900/10 flex items-center gap-3">
          <ShieldAlert className="text-red-600 dark:text-red-400" size={20} />
          <h3 className="font-bold text-red-800 dark:text-red-300">SLA Breached — Overdue Tickets</h3>
          {overdueTickets.length > 0 && (
            <span className="ml-auto bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
              {overdueTickets.length}
            </span>
          )}
        </div>
        <div className="p-4">
          {overdueTickets.length === 0 ? (
            <p className="text-slate-500 text-center py-8 text-sm flex items-center justify-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-500" />
              All tickets are within SLA. Great job!
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {overdueTickets.map(t => {
                const due = new Date(t.dueDate!);
                const overdueMins = Math.floor((Date.now() - due.getTime()) / 60000);
                const overdueDisplay = overdueMins >= 60
                  ? `${Math.floor(overdueMins / 60)}h ${overdueMins % 60}m overdue`
                  : `${overdueMins}m overdue`;
                return (
                  <div key={t.id} className="flex items-center justify-between p-3 rounded-xl border border-red-100 dark:border-red-900/30 bg-red-50/40 dark:bg-red-900/5">
                    <div className="min-w-0">
                      <div className="font-medium text-slate-800 dark:text-slate-200 truncate text-sm">{t.title}</div>
                      <div className="text-xs text-slate-500 mt-0.5">#{t.id} · {t.priority} · {t.status}</div>
                    </div>
                    <div className="ml-3 shrink-0 text-right">
                      <span className="text-xs font-bold text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30 px-2 py-0.5 rounded-md">
                        {overdueDisplay}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SLA;
