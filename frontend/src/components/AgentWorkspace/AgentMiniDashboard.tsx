import { useEffect, useState } from 'react';
import { getAgentMiniDashboard, type AgentMiniDashboard as AgentMiniDashboardData } from '../../api/apiClient';
import { LayoutList, Loader, AlertTriangle, CheckCircle2 } from 'lucide-react';

const STAT_CARDS = [
  { key: 'assigned' as const, label: 'Assigned', icon: LayoutList, color: 'blue' },
  { key: 'inProgress' as const, label: 'In Progress', icon: Loader, color: 'amber' },
  { key: 'overdue' as const, label: 'Overdue', icon: AlertTriangle, color: 'red' },
  { key: 'resolvedToday' as const, label: 'Resolved Today', icon: CheckCircle2, color: 'green' },
] as const;

const COLOR_MAP = {
  blue: 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-950 dark:border-blue-800 dark:text-blue-300',
  amber: 'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-950 dark:border-amber-800 dark:text-amber-300',
  red: 'bg-red-50 border-red-200 text-red-700 dark:bg-red-950 dark:border-red-800 dark:text-red-300',
  green: 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950 dark:border-emerald-800 dark:text-emerald-300',
} as const;

const ICON_COLOR_MAP = {
  blue: 'text-blue-500',
  amber: 'text-amber-500',
  red: 'text-red-500',
  green: 'text-emerald-500',
} as const;

const AgentMiniDashboard = () => {
  const [data, setData] = useState<AgentMiniDashboardData | null>(null);

  useEffect(() => {
    getAgentMiniDashboard()
      .then(setData)
      .catch(() => setData(null));
  }, []);

  if (!data) return null;

  return (
    <div className="grid grid-cols-4 gap-2 px-3 py-3 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950">
      {STAT_CARDS.map(({ key, label, icon: Icon, color }) => (
        <div
          key={key}
          className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border transition-colors ${COLOR_MAP[color]}`}
        >
          <Icon size={16} className={ICON_COLOR_MAP[color]} />
          <span className="text-lg font-bold leading-none">{data[key]}</span>
          <span className="text-[10px] font-medium uppercase tracking-wide opacity-70">{label}</span>
        </div>
      ))}
    </div>
  );
};

export default AgentMiniDashboard;
