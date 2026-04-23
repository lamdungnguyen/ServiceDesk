import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { LayoutGrid, AlertCircle, Clock, CheckCircle2 } from 'lucide-react';
import type { Ticket } from '../../types/ticket';

interface OverviewProps {
  tickets: Ticket[];
}

const Overview = ({ tickets }: OverviewProps) => {
  const stats = [
    { title: 'Total Tickets', value: tickets.length, icon: <LayoutGrid size={24} className="text-blue-500" />, bg: 'bg-blue-50 dark:bg-blue-900/20' },
    { title: 'Open / New', value: tickets.filter(t => t.status === 'NEW').length, icon: <AlertCircle size={24} className="text-amber-500" />, bg: 'bg-amber-50 dark:bg-amber-900/20' },
    { title: 'In Progress', value: tickets.filter(t => t.status === 'IN_PROGRESS').length, icon: <Clock size={24} className="text-purple-500" />, bg: 'bg-purple-50 dark:bg-purple-900/20' },
    { title: 'Resolved', value: tickets.filter(t => t.status === 'RESOLVED').length, icon: <CheckCircle2 size={24} className="text-emerald-500" />, bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
  ];

  const statusData = [
    { name: 'NEW', value: tickets.filter(t => t.status === 'NEW').length, color: '#3b82f6' },
    { name: 'ASSIGNED', value: tickets.filter(t => t.status === 'ASSIGNED').length, color: '#6366f1' },
    { name: 'IN_PROGRESS', value: tickets.filter(t => t.status === 'IN_PROGRESS').length, color: '#f59e0b' },
    { name: 'RESOLVED', value: tickets.filter(t => t.status === 'RESOLVED').length, color: '#10b981' },
    { name: 'CLOSED', value: tickets.filter(t => t.status === 'CLOSED').length, color: '#64748b' },
  ].filter(d => d.value > 0);

  const priorityData = [
    { name: 'LOW', count: tickets.filter(t => t.priority === 'LOW').length, color: '#10b981' },
    { name: 'MEDIUM', count: tickets.filter(t => t.priority === 'MEDIUM').length, color: '#f59e0b' },
    { name: 'HIGH', count: tickets.filter(t => t.priority === 'HIGH').length, color: '#f97316' },
    { name: 'URGENT', count: tickets.filter(t => t.priority === 'URGENT').length, color: '#ef4444' },
  ];

  const resolvedOrClosed = tickets.filter(t => t.status === 'RESOLVED' || t.status === 'CLOSED').length;
  const slaCompliance = tickets.length > 0 ? Math.round((resolvedOrClosed / tickets.length) * 100) : 0;
  const recentTickets = [...tickets].reverse().slice(0, 5);

  const getPriorityColor = (p: string) => {
    if (p === 'URGENT') return 'text-red-600 bg-red-50 border-red-100';
    if (p === 'HIGH') return 'text-orange-600 bg-orange-50 border-orange-100';
    if (p === 'MEDIUM') return 'text-amber-600 bg-amber-50 border-amber-100';
    return 'text-emerald-600 bg-emerald-50 border-emerald-100';
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">System Overview</h2>
          <p className="text-slate-500 dark:text-slate-400">Monitor service desk performance and metrics</p>
        </div>
        <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-2xl px-5 py-3 shadow-sm">
          <div className={`text-2xl font-extrabold ${slaCompliance >= 80 ? 'text-emerald-600' : slaCompliance >= 60 ? 'text-amber-500' : 'text-red-500'}`}>
            {slaCompliance}%
          </div>
          <div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">SLA</div>
            <div className="text-xs text-slate-400">Compliance</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">{stat.title}</p>
              <h3 className="text-3xl font-bold text-slate-800 dark:text-white">{stat.value}</h3>
            </div>
            <div className={`p-4 rounded-xl ${stat.bg}`}>
              {stat.icon}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6">Tickets by Priority</h3>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={priorityData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} allowDecimals={false} />
                <RechartsTooltip cursor={{fill: 'transparent'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgb(0 0 0 / 0.1)', fontSize: '13px'}} />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {priorityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">Ticket Status Distribution</h3>
          {tickets.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">No data available yet.</div>
          ) : (
            <>
              <div className="flex-1 min-h-[240px] w-full flex items-center justify-center relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={statusData} cx="50%" cy="50%" innerRadius={75} outerRadius={105} paddingAngle={4} dataKey="value" stroke="none">
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgb(0 0 0 / 0.1)', fontSize: '13px'}} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-3xl font-bold text-slate-800 dark:text-white">{tickets.length}</span>
                  <span className="text-sm text-slate-500">Total</span>
                </div>
              </div>
              <div className="flex flex-wrap justify-center gap-3 mt-2">
                {statusData.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 font-semibold">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                    {item.name} ({item.value})
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {recentTickets.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <h3 className="text-lg font-bold text-slate-800">Recent Tickets</h3>
          </div>
          <div className="divide-y divide-slate-100">
            {recentTickets.map(ticket => (
              <div key={ticket.id} className="p-4 px-6 flex items-center justify-between gap-4 hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-xs font-bold text-slate-400 shrink-0">#{ticket.id}</span>
                  <span className="text-sm font-semibold text-slate-700 truncate">{ticket.title}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase border ${getPriorityColor(ticket.priority)}`}>
                    {ticket.priority}
                  </span>
                  <span className="text-xs font-semibold text-slate-500 hidden sm:block">{ticket.status.replace('_', ' ')}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Overview;
