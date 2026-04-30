import { useState, useEffect, useRef } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';

export interface TicketFilters {
  keyword: string;
  status: string;
  priority: string;
  overdue: string; // 'ALL' | 'true' | 'false'
}

interface FilterBarProps {
  filters: TicketFilters;
  onFilterChange: (filters: TicketFilters) => void;
}

const STATUS_OPTIONS = [
  { value: 'ALL', label: 'All Status' },
  { value: 'NEW', label: 'New' },
  { value: 'ASSIGNED', label: 'Assigned' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'RESOLVED', label: 'Resolved' },
];

const PRIORITY_OPTIONS = [
  { value: 'ALL', label: 'All Priority' },
  { value: 'LOW', label: 'Low' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HIGH', label: 'High' },
  { value: 'URGENT', label: 'Urgent' },
];

const SLA_OPTIONS = [
  { value: 'ALL', label: 'All SLA' },
  { value: 'true', label: 'Overdue' },
  { value: 'false', label: 'On Track' },
];

const FilterBar = ({ filters, onFilterChange }: FilterBarProps) => {
  const [localKeyword, setLocalKeyword] = useState(filters.keyword);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Sync external keyword changes
  useEffect(() => {
    setLocalKeyword(filters.keyword);
  }, [filters.keyword]);

  // Debounced keyword search
  useEffect(() => {
    debounceRef.current = setTimeout(() => {
      if (localKeyword !== filters.keyword) {
        onFilterChange({ ...filters, keyword: localKeyword });
      }
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [localKeyword]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleChange = (field: keyof TicketFilters, value: string) => {
    onFilterChange({ ...filters, [field]: value });
  };

  const hasActiveFilters =
    filters.keyword.trim() !== '' ||
    filters.status !== 'ALL' ||
    filters.priority !== 'ALL' ||
    filters.overdue !== 'ALL';

  const clearAll = () => {
    setLocalKeyword('');
    onFilterChange({ keyword: '', status: 'ALL', priority: 'ALL', overdue: 'ALL' });
  };

  return (
    <div className="px-3 py-2.5 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 space-y-2">
      {/* Search row */}
      <div className="relative">
        <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={localKeyword}
          onChange={(e) => setLocalKeyword(e.target.value)}
          placeholder="Search tickets..."
          className="w-full pl-8 pr-8 py-1.5 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
        />
        {localKeyword && (
          <button
            onClick={() => setLocalKeyword('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            <X size={13} />
          </button>
        )}
      </div>

      {/* Dropdowns row */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 text-slate-400">
          <SlidersHorizontal size={12} />
        </div>

        <select
          value={filters.status}
          onChange={(e) => handleChange('status', e.target.value)}
          className="flex-1 text-[11px] py-1 px-2 border border-slate-200 dark:border-slate-700 rounded-md text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-blue-500/30 outline-none cursor-pointer"
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        <select
          value={filters.priority}
          onChange={(e) => handleChange('priority', e.target.value)}
          className="flex-1 text-[11px] py-1 px-2 border border-slate-200 dark:border-slate-700 rounded-md text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-blue-500/30 outline-none cursor-pointer"
        >
          {PRIORITY_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        <select
          value={filters.overdue}
          onChange={(e) => handleChange('overdue', e.target.value)}
          className="flex-1 text-[11px] py-1 px-2 border border-slate-200 dark:border-slate-700 rounded-md text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-blue-500/30 outline-none cursor-pointer"
        >
          {SLA_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        {hasActiveFilters && (
          <button
            onClick={clearAll}
            className="text-[10px] font-medium text-blue-600 hover:text-blue-700 whitespace-nowrap px-1.5 py-1"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
};

export default FilterBar;
