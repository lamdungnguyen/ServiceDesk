import React from 'react';
import { HeadphonesIcon, LayoutList, Loader, CheckCircle2, AlertTriangle, Activity, MessageSquare, Headset } from 'lucide-react';


type TabId = 'assigned' | 'in_progress' | 'resolved' | 'overdue' | 'activity' | 'messages' | 'support_requests';

interface SidebarProps {
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;
  counts: { assigned: number; in_progress: number; resolved: number; overdue: number };
  agentName: string;
  agentType?: string;
}

const NAV_ITEMS: { id: TabId; label: string; icon: React.ReactNode; danger?: boolean; divider?: boolean }[] = [
  { id: 'assigned', label: 'Assigned Tickets', icon: <LayoutList size={18} /> },
  { id: 'in_progress', label: 'In Progress', icon: <Loader size={18} /> },
  { id: 'resolved', label: 'Resolved', icon: <CheckCircle2 size={18} /> },
  { id: 'overdue', label: 'Overdue', icon: <AlertTriangle size={18} />, danger: true },
  { id: 'activity', label: 'My Activity', icon: <Activity size={18} /> },
  { id: 'support_requests', label: 'Support Requests', icon: <Headset size={18} /> },
  { id: 'messages', label: 'Messages', icon: <MessageSquare size={18} />, divider: true },
];

const Sidebar = ({ activeTab, setActiveTab, counts, agentName, agentType }: SidebarProps) => {
  const getCount = (id: TabId): number | null => {
    if (id === 'assigned') return counts.assigned;
    if (id === 'in_progress') return counts.in_progress;
    if (id === 'resolved') return counts.resolved;
    if (id === 'overdue') return counts.overdue;
    return null;
  };

  return (
    <aside className="w-60 bg-white border-r border-slate-200 flex flex-col h-full shadow-sm z-20 hidden md:flex">
      {/* Agent Info */}
      <div className="p-5 border-b border-slate-100 bg-gradient-to-br from-slate-800 to-slate-900">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-md">
            {agentName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="font-bold text-white text-sm truncate">{agentName}</div>
            <div className="text-xs text-slate-400 font-medium">{agentType ? `${agentType} Agent` : 'Support Agent'}</div>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
          <span className="text-xs text-slate-400">Online & Available</span>
        </div>
      </div>

      {/* Nav */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 pb-2">Queue</div>
        {NAV_ITEMS.map(item => {
          const count = getCount(item.id);
          const isActive = activeTab === item.id;
          return (
            <React.Fragment key={item.id}>
              {item.divider && (
                <div className="pt-2 pb-1">
                  <div className="border-t border-slate-100 mb-2" />
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 pb-1">Internal</div>
                </div>
              )}
              <button
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? item.danger
                      ? 'bg-red-50 text-red-700 border border-red-100'
                      : item.id === 'messages'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                        : 'bg-blue-50 text-blue-700 border border-blue-100'
                    : item.danger
                      ? 'text-red-500 hover:bg-red-50/50 border border-transparent'
                      : 'text-slate-600 hover:bg-slate-50 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className={isActive
                    ? item.danger ? 'text-red-600' : item.id === 'messages' ? 'text-emerald-600' : 'text-blue-600'
                    : 'text-slate-400'}>
                    {item.icon}
                  </span>
                  {item.label}
                </div>
                {count != null && count > 0 && (
                  <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-full min-w-[20px] text-center ${
                    item.danger ? 'bg-red-100 text-red-700' : isActive ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            </React.Fragment>
          );
        })}
      </div>

      {/* Status Footer */}
      <div className="p-4 border-t border-slate-100">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <HeadphonesIcon size={14} />
          <span>Workspace v2.0</span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
