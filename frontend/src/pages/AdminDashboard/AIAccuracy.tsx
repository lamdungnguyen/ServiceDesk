import { useEffect, useState } from 'react';
import {
  Brain, TrendingUp, CheckCircle2, XCircle, Download,
  RefreshCw, AlertCircle, Zap, Database, BarChart3, Tag, Flag,
} from 'lucide-react';
import { getAIAccuracyStats, exportAITrainingCSV, exportAITrainingJSONL, type AIAccuracyStats } from '../../api/apiClient';

// ── Helpers ──────────────────────────────────────────────────────────────────

const CATEGORY_COLOR: Record<string, string> = {
  NETWORK:        'bg-blue-500',
  ACCOUNT:        'bg-purple-500',
  INFRASTRUCTURE: 'bg-red-500',
  HARDWARE:       'bg-amber-500',
  SOFTWARE:       'bg-emerald-500',
  GENERAL:        'bg-slate-400',
};

const PRIORITY_COLOR: Record<string, string> = {
  LOW:    'bg-emerald-500',
  MEDIUM: 'bg-amber-500',
  HIGH:   'bg-orange-500',
  URGENT: 'bg-red-600',
};

const SOURCE_COLOR: Record<string, string> = {
  RULE_BASED: 'bg-violet-500',
  ZERO_SHOT:  'bg-sky-500',
  FALLBACK:   'bg-slate-400',
};

const SOURCE_LABEL: Record<string, string> = {
  RULE_BASED: 'Rule-Based Keywords',
  ZERO_SHOT:  'Zero-Shot ML Model',
  FALLBACK:   'Service Fallback',
};

function accuracyColor(pct: number) {
  if (pct >= 85) return 'text-emerald-500';
  if (pct >= 70) return 'text-amber-500';
  return 'text-red-500';
}

function AccuracyBar({ value, barClass }: { value: number; barClass: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${barClass}`}
          style={{ width: `${Math.min(value, 100)}%` }}
        />
      </div>
      <span className={`text-sm font-bold w-12 text-right ${accuracyColor(value)}`}>
        {value.toFixed(1)}%
      </span>
    </div>
  );
}

// ── Sub-sections ─────────────────────────────────────────────────────────────

function SectionTitle({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle?: string }) {
  return (
    <div className="flex items-start gap-3 mb-5">
      <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 mt-0.5">
        {icon}
      </div>
      <div>
        <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">{title}</h3>
        {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}

function AccuracySection({
  title, subtitle, icon,
  accuracyMap, countMap, colorMap, labelMap,
}: {
  title: string; subtitle?: string; icon: React.ReactNode;
  accuracyMap: Record<string, number>;
  countMap: Record<string, number>;
  colorMap: Record<string, string>;
  labelMap?: Record<string, string>;
}) {
  const entries = Object.entries(accuracyMap);
  if (entries.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
        <SectionTitle icon={icon} title={title} subtitle={subtitle} />
        <p className="text-sm text-slate-400 text-center py-6">No verified data</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
      <SectionTitle icon={icon} title={title} subtitle={subtitle} />
      <div className="space-y-4">
        {entries.map(([key, pct]) => (
          <div key={key}>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${colorMap[key] ?? 'bg-slate-400'}`} />
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  {labelMap?.[key] ?? key}
                </span>
              </div>
              <span className="text-xs text-slate-400">
                {countMap[key] ?? 0} verified
              </span>
            </div>
            <AccuracyBar
              value={pct}
              barClass={colorMap[key] ?? 'bg-slate-400'}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

const AIAccuracy = () => {
  const [stats, setStats] = useState<AIAccuracyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const data = await getAIAccuracyStats();
      setStats(data);
    } catch {
      setError('Cannot load AI Accuracy data. Ensure AI Service and Spring Boot are running.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { void fetchStats(); }, []);

  const handleExportCSV = () => {
    const url = exportAITrainingCSV();
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ai_training_data.csv';
    a.click();
  };

  const handleExportJSONL = () => {
    const url = exportAITrainingJSONL();
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ai_training_data.jsonl';
    a.click();
  };

  // ── Loading ──
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-80 gap-4">
        <div className="w-12 h-12 rounded-full border-4 border-purple-200 border-t-purple-600 animate-spin" />
        <p className="text-slate-500 text-sm">Loading AI Analytics...</p>
      </div>
    );
  }

  // ── Error ──
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-80 gap-4 text-center px-6">
        <div className="w-14 h-14 rounded-2xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center text-red-500">
          <AlertCircle size={28} />
        </div>
        <div>
          <p className="font-bold text-slate-700 dark:text-slate-200 mb-1">Error loading data</p>
          <p className="text-sm text-slate-400 max-w-md">{error}</p>
        </div>
        <button
          onClick={() => void fetchStats()}
          className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold text-sm transition-colors"
        >
          <RefreshCw size={15} /> Retry
        </button>
      </div>
    );
  }

  if (!stats) return null;

  const noData = stats.totalVerified === 0;

  return (
    <div className="space-y-6 pb-8">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-purple-500/30">
            <Brain size={22} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">AI Accuracy Analytics</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Based on {stats.totalVerified} tickets verified by Agent
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => void fetchStats(true)}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-4 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-sm font-semibold transition-colors"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm shadow-violet-500/20"
          >
            <Download size={14} />
            Export CSV
          </button>
          <button
            onClick={handleExportJSONL}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm"
          >
            <Download size={14} />
            Export JSONL
          </button>
        </div>
      </div>

      {/* ── No data banner ── */}
      {noData && (
        <div className="flex items-start gap-4 p-5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50 rounded-2xl">
          <AlertCircle size={20} className="text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-700 dark:text-amber-300 text-sm">No verified data</p>
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
              System will calculate accuracy after an Agent reviews and confirms/corrects AI prediction of at least 1 ticket.
              Use API <code className="bg-amber-100 dark:bg-amber-900/40 px-1 rounded">POST /api/v1/ai-feedback</code> to record feedback.
            </p>
          </div>
        </div>
      )}

      {/* ── Summary Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            icon: <BarChart3 size={20} />,
            label: 'Category Accuracy',
            value: `${stats.overallCategoryAccuracy.toFixed(1)}%`,
            color: 'from-violet-500 to-purple-600',
            shadow: 'shadow-purple-500/20',
          },
          {
            icon: <Flag size={20} />,
            label: 'Priority Accuracy',
            value: `${stats.overallPriorityAccuracy.toFixed(1)}%`,
            color: 'from-blue-500 to-indigo-600',
            shadow: 'shadow-blue-500/20',
          },
          {
            icon: <CheckCircle2 size={20} />,
            label: 'Total Correct',
            value: `${stats.totalCorrect}`,
            sub: `/ ${stats.totalVerified} verified`,
            color: 'from-emerald-500 to-green-600',
            shadow: 'shadow-emerald-500/20',
          },
          {
            icon: <XCircle size={20} />,
            label: 'Corrected by Agent',
            value: `${stats.totalCorrected}`,
            sub: stats.totalVerified > 0
              ? `${((stats.totalCorrected / stats.totalVerified) * 100).toFixed(1)}% error rate`
              : '—',
            color: 'from-red-500 to-rose-600',
            shadow: 'shadow-red-500/20',
          },
        ].map((card) => (
          <div
            key={card.label}
            className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 flex flex-col gap-3"
          >
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center text-white shadow-lg ${card.shadow}`}>
              {card.icon}
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium mb-1">{card.label}</p>
              <p className={`text-2xl font-black ${accuracyColor(parseFloat(card.value))}`}>{card.value}</p>
              {card.sub && <p className="text-xs text-slate-400 mt-0.5">{card.sub}</p>}
            </div>
          </div>
        ))}
      </div>

      {/* ── Accuracy by Section ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AccuracySection
          title="Category Accuracy"
          subtitle="Classification accuracy by category"
          icon={<Tag size={18} />}
          accuracyMap={stats.categoryAccuracy}
          countMap={stats.categoryVerifiedCount}
          colorMap={CATEGORY_COLOR}
        />
        <AccuracySection
          title="Priority Accuracy"
          subtitle="Priority prediction accuracy"
          icon={<Flag size={18} />}
          accuracyMap={stats.priorityAccuracy}
          countMap={stats.priorityVerifiedCount}
          colorMap={PRIORITY_COLOR}
        />
      </div>

      {/* ── Source Accuracy ── */}
      <AccuracySection
        title="Accuracy by Prediction Source"
        subtitle="Compare Rule-based Keywords with Zero-shot ML model"
        icon={<Zap size={18} />}
        accuracyMap={stats.sourceAccuracy}
        countMap={stats.sourceVerifiedCount}
        colorMap={SOURCE_COLOR}
        labelMap={SOURCE_LABEL}
      />

      {/* ── Training Data CTA ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '16px 16px' }} />
        <div className="relative flex items-start gap-4">
          <div className="p-2.5 bg-white/20 rounded-xl">
            <Database size={22} className="text-white" />
          </div>
          <div>
            <h4 className="font-bold text-white text-base">Export Training Data</h4>
            <p className="text-violet-100 text-xs mt-0.5 max-w-md">
              Download dataset labeled by Agent to fine-tune PhoBERT / XLM-RoBERTa.
              Only exports verified records.
            </p>
          </div>
        </div>
        <div className="relative flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-slate-50 text-violet-700 rounded-xl font-bold text-sm transition-all hover:scale-105 active:scale-95 shadow-lg whitespace-nowrap"
          >
            <Download size={15} />
            Download CSV
          </button>
          <button
            onClick={handleExportJSONL}
            className="flex items-center gap-2 px-5 py-2.5 bg-slate-950/80 hover:bg-slate-950 text-white rounded-xl font-bold text-sm transition-all hover:scale-105 active:scale-95 shadow-lg whitespace-nowrap"
          >
            <Download size={15} />
            Download JSONL
          </button>
        </div>
      </div>

      {/* ── Methodology note ── */}
      <div className="flex items-start gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl">
        <TrendingUp size={16} className="text-slate-400 shrink-0 mt-0.5" />
        <p className="text-xs text-slate-400 leading-relaxed">
          <strong className="text-slate-600 dark:text-slate-300">Calculation Method:</strong> Accuracy is only calculated on Tickets that the Agent has actually reviewed and submitted feedback for (verified records).
          Tickets predicted by AI but not yet reviewed by Agent are excluded to prevent bias.
          Category and priority accuracy are calculated independently, so partial corrections are counted correctly.
        </p>
      </div>
    </div>
  );
};

export default AIAccuracy;
