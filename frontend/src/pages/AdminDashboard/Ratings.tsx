```typescript
import { useState, useEffect } from 'react';
import { Star, TrendingUp, Users, MessageSquare, ChevronDown, ChevronUp, Search } from 'lucide-react';
import { getAllAgentRatingStats, type AgentRatingStats } from '../../api/apiClient';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

function StarDisplay({ score, size = 16 }: { score: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(s => (
        <Star
          key={s}
          size={size}
          className={s <= Math.round(score) ? 'text-amber-400 fill-amber-400' : 'text-slate-200 dark:text-slate-700'}
        />
      ))}
    </div>
  );
}

function getScoreColor(score: number) {
  if (score >= 4.5) return 'text-emerald-600 dark:text-emerald-400';
  if (score >= 3.5) return 'text-blue-600 dark:text-blue-400';
  if (score >= 2.5) return 'text-amber-600 dark:text-amber-400';
  return 'text-red-600 dark:text-red-400';
}

function getScoreBg(score: number) {
  if (score >= 4.5) return 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800';
  if (score >= 3.5) return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
  if (score >= 2.5) return 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800';
  return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
}

const Ratings = () => {
  const [stats, setStats] = useState<AgentRatingStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedAgent, setExpandedAgent] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    getAllAgentRatingStats()
      .then(data => setStats(data))
      .catch(err => console.error('Failed to fetch rating stats', err))
      .finally(() => setLoading(false));
  }, []);

  const totalRatings = stats.reduce((sum, s) => sum + s.totalRatings, 0);
  const overallAvg = stats.length > 0
    ? stats.reduce((sum, s) => sum + s.averageScore * s.totalRatings, 0) / (totalRatings || 1)
    : 0;

  const filtered = stats.filter(s =>
    s.agentName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Score distribution across all agents
  const allRatings = stats.flatMap(s => s.recentRatings || []);
  const scoreDistribution = [5, 4, 3, 2, 1].map(score => ({
    score,
    count: allRatings.filter(r => r.score === score).length,
  }));
  const maxDistCount = Math.max(...scoreDistribution.map(d => d.count), 1);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      <div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Agent Ratings</h2>
        <p className="text-slate-500 dark:text-slate-400">Monitor agent performance based on customer feedback</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Overall Rating</p>
              <div className="flex items-center gap-2">
                <h3 className={`text-3xl font-bold ${getScoreColor(overallAvg)}`}>
                  {overallAvg > 0 ? overallAvg.toFixed(1) : '—'}
                </h3>
                <StarDisplay score={overallAvg} size={18} />
              </div>
            </div>
            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20">
              <Star size={24} className="text-amber-500" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Total Reviews</p>
              <h3 className="text-3xl font-bold text-slate-800 dark:text-white">{totalRatings}</h3>
            </div>
            <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20">
              <MessageSquare size={24} className="text-blue-500" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Rated Agents</p>
              <h3 className="text-3xl font-bold text-slate-800 dark:text-white">{stats.length}</h3>
            </div>
            <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-900/20">
              <Users size={24} className="text-purple-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Score Distribution + Top Agents */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Score Distribution */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
            <TrendingUp size={18} className="text-purple-500" />
            Score Distribution
          </h3>
          {totalRatings === 0 ? (
            <div className="text-center py-8 text-slate-400 text-sm">No ratings yet</div>
          ) : (
            <div className="space-y-3">
              {scoreDistribution.map(d => (
                <div key={d.score} className="flex items-center gap-3">
                  <div className="flex items-center gap-1 w-16 shrink-0">
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{d.score}</span>
                    <Star size={14} className="text-amber-400 fill-amber-400" />
                  </div>
                  <div className="flex-1 bg-slate-100 dark:bg-slate-700 rounded-full h-3 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-amber-400 to-yellow-400 transition-all duration-500"
                      style={{ width: `${(d.count / maxDistCount) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 w-8 text-right">{d.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Agents */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Top Performing Agents</h3>
          {stats.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-sm">No ratings yet</div>
          ) : (
            <div className="space-y-3">
              {stats.slice(0, 5).map((agent, idx) => (
                <div key={agent.agentId} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                    idx === 0 ? 'bg-amber-100 text-amber-700' : idx === 1 ? 'bg-slate-200 text-slate-600' : idx === 2 ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 dark:text-white truncate">{agent.agentName}</p>
                    <div className="flex items-center gap-2">
                      <StarDisplay score={agent.averageScore} size={12} />
                      <span className="text-[10px] text-slate-400">{agent.totalRatings} reviews</span>
                    </div>
                  </div>
                  <span className={`text-lg font-bold ${getScoreColor(agent.averageScore)}`}>
                    {agent.averageScore.toFixed(1)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* All Agents Detailed List */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate