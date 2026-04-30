import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from 'recharts';
import { TrendingUp, Users, CheckCircle2, Clock, AlertTriangle, RefreshCw, Trophy } from 'lucide-react';
import { getAgentPerformance, type AgentPerformance } from '../../api/apiClient';

const AgentPerformanceTab = () => {
  const [agents, setAgents] = useState<AgentPerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAgentPerformance();
      setAgents(data);
    } catch {
      setError('Failed to load agent performance data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchData();
  }, []);

  const getRowClass = (agent: AgentPerformance) => {
    if (agent.overdueTickets >= 3) return 'bg-red-50/60 dark:bg-red-900/10 border-l-4 border-l-red-500';
    if (agent.totalResolved > 0 && agent.overdueTickets === 0) return 'bg-emerald-50/40 dark:bg-emerald-900/10 border-l-4 border-l-emerald-500';
    return '';
  };

  const getOverdueBadge = (count: number) => {
    if (count === 0) return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
    if (count <= 2) return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
    return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
  };

  const formatTime = (minutes: number) => {
    if (minutes === 0) return '—';
    if (minutes < 60) return `${Math.round(minutes)}m`;
    const h = Math.floor(minutes / 60);
    const m = Math.round(minutes % 60);
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  };

  const bestAgent = agents.length > 0
    ? agents.reduce((best, a) =>
        (a.totalResolved > best.totalResolved && a.overdueTickets <= best.overdueTickets) ? a : best,
        agents[0]
      )
    : null;

  const chartData = agents.map(a => ({
    name: a.name.split(' ')[0],
    Resolved: a.totalResolved,
    Overdue: a.overdueTickets,
    Assigned: a.totalAssigned,
  }));

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Agent Performance</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Track workload, efficiency, and SLA compliance per agent</p>
        </div>
        <button
          onClick={() => void fetchData()}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Summary Cards */}
      {!loading && agents.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4">
            <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-900/20">
              <Users size={22} className="text-purple-500" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Agents</p>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-white">{agents.length}</h3>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4">
            <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20">
              <TrendingUp size={22} className="text-blue-500" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Assigned</p>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-white">
                {agents.reduce((s, a) => s + a.totalAssigned, 0)}
              </h3>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4">
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20">
              <CheckCircle2 size={22} className="text-emerald-500" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Resolved</p>
              <h3 className="text-2xl font-bold text-emerald-600">
                {agents.reduce((s, a) => s + a.totalResolved, 0)}
              </h3>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4">
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20">
              <AlertTriangle size={22} className="text-red-500" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Overdue</p>
              <h3 className="text-2xl font-bold text-red-600">
                {agents.reduce((s, a) => s + a.overdueTickets, 0)}
              </h3>
            </div>
          </div>
        </div>
      )}

      {/* Bar Chart + Best Performer */}
      {!loading && agents.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Tickets per Agent</h3>
            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} allowDecimals={false} />
                  <RechartsTooltip
                    cursor={{ fill: 'transparent' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgb(0 0 0 / 0.1)', fontSize: '13px' }}
                  />
                  <Bar dataKey="Assigned" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Resolved" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Overdue" radius={[4, 4, 0, 0]}>
                    {chartData.map((_, i) => (
                      <Cell key={i} fill="#ef4444" />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center gap-4 mt-3 justify-center">
              {[{ color: '#94a3b8', label: 'Assigned' }, { color: '#10b981', label: 'Resolved' }, { color: '#ef4444', label: 'Overdue' }].map(l => (
                <div key={l.label} className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                  <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: l.color }} />
                  {l.label}
                </div>
              ))}
            </div>
          </div>

          {/* Best Performer Card */}
          {bestAgent && (
            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-6 text-white shadow-lg flex flex-col justify-between">
              <div className="flex items-center gap-2 mb-4">
                <Trophy size={20} className="text-yellow-300" />
                <span className="text-sm font-bold text-emerald-100 uppercase tracking-wide">Top Performer</span>
              </div>
              <div>
                <h3 className="text-2xl font-bold mb-1">{bestAgent.name}</h3>
                <p className="text-emerald-100 text-sm mb-4">Agent #{bestAgent.agentId}</p>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-emerald-100">Resolved</span>
                    <span className="font-bold">{bestAgent.totalResolved} tickets</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-emerald-100">Avg Time</span>
                    <span className="font-bold">{formatTime(bestAgent.avgResolutionTime)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-emerald-100">Overdue</span>
                    <span className="font-bold">{bestAgent.overdueTickets}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Agent Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 dark:border-slate-700 flex items-center gap-3">
          <Users size={18} className="text-slate-400" />
          <h3 className="font-bold text-slate-800 dark:text-white">Detailed Agent Metrics</h3>
          <div className="ml-auto flex items-center gap-3 text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-emerald-500 inline-block" /> Best
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-red-500 inline-block" /> Critical
            </span>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
          </div>
        ) : error ? (
          <div className="text-center py-12 text-red-500 text-sm">{error}</div>
        ) : agents.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-sm">
            <Users size={32} className="mx-auto mb-3 opacity-20" />
            No agents found in the system.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 text-xs uppercase tracking-wider text-slate-500 font-semibold">
                  <th className="p-4 pl-6">Agent</th>
                  <th className="p-4 text-center">Assigned</th>
                  <th className="p-4 text-center">Resolved</th>
                  <th className="p-4 text-center">Resolution Rate</th>
                  <th className="p-4 text-center">
                    <span className="flex items-center justify-center gap-1">
                      <Clock size={12} /> Avg Time
                    </span>
                  </th>
                  <th className="p-4 text-center pr-6">Overdue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {agents.map((agent) => {
                  const rate = agent.totalAssigned > 0
                    ? Math.round((agent.totalResolved / agent.totalAssigned) * 100)
                    : 0;
                  const isBest = bestAgent?.agentId === agent.agentId;
                  return (
                    <tr
                      key={agent.agentId}
                      className={`transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/50 ${getRowClass(agent)}`}
                    >
                      <td className="p-4 pl-6">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
                            {agent.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-800 dark:text-slate-200 text-sm flex items-center gap-2">
                              {agent.name}
                              {isBest && <Trophy size={13} className="text-yellow-500" />}
                            </div>
                            <div className="text-xs text-slate-400">Agent #{agent.agentId}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{agent.totalAssigned}</span>
                      </td>
                      <td className="p-4 text-center">
                        <span className="text-sm font-semibold text-emerald-600">{agent.totalResolved}</span>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-20 bg-slate-200 dark:bg-slate-700 rounded-full h-1.5">
                            <div
                              className={`h-1.5 rounded-full ${rate >= 75 ? 'bg-emerald-500' : rate >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                              style={{ width: `${rate}%` }}
                            />
                          </div>
                          <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 w-8">{rate}%</span>
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                          {formatTime(agent.avgResolutionTime)}
                        </span>
                      </td>
                      <td className="p-4 text-center pr-6">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold ${getOverdueBadge(agent.overdueTickets)}`}>
                          {agent.overdueTickets}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AgentPerformanceTab;
