import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchEmployeeHistory } from '../services/api';
import {
  LineChart, Line, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import { Loader2, TrendingUp, AlertTriangle, CheckCircle, Activity } from 'lucide-react';

export default function AgentStats() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const resp = await fetchEmployeeHistory(user.id);
        setData(resp);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    if (user?.id) load();
  }, [user]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  const scores = (data?.scores || []).map((s, i) => ({
    seq: `#${i + 1}`,
    kpi: Number(s.kpiScore || 0),
    empathy: Number(s.empathyScore || 0),
    resolution: Number(s.resolutionScore || 0),
    communication: Number(s.communicationScore || 0),
  }));

  const latestScore = data?.scores?.length ? data.scores[data.scores.length - 1] : null;
  const radarData = latestScore ? [
    { metric: 'KPI', value: Number(latestScore.kpiScore || 0) },
    { metric: 'Communication', value: Number(latestScore.communicationScore || 0) },
    { metric: 'Empathy', value: Number(latestScore.empathyScore || 0) },
    { metric: 'Resolution', value: Number(latestScore.resolutionScore || 0) },
  ] : [];

  const alertLevel = data?.insights?.alertLevel || 'good';

  return (
    <div className="flex flex-col gap-6 animate-fade-in p-4 lg:p-6 bg-slate-50 min-h-full">
      <header className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <p className="text-xs uppercase tracking-widest font-bold text-emerald-600 mb-1">My Performance</p>
        <h1 className="text-2xl font-extrabold text-slate-900">{user?.name || 'Agent'} — Personal Stats</h1>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <p className="text-xs uppercase tracking-widest font-bold text-slate-500 mb-2 flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-emerald-500" /> Alert Level
          </p>
          <div className="flex items-center gap-2">
            {alertLevel === 'critical' && <AlertTriangle className="w-5 h-5 text-rose-500" />}
            {alertLevel === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-500" />}
            {alertLevel === 'good' && <CheckCircle className="w-5 h-5 text-emerald-500" />}
            <span className={`text-lg font-extrabold uppercase ${
              alertLevel === 'critical' ? 'text-rose-600' :
              alertLevel === 'warning' ? 'text-amber-600' : 'text-emerald-600'
            }`}>{alertLevel}</span>
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <p className="text-xs uppercase tracking-widest font-bold text-slate-500 mb-2">KPI Trend</p>
          <p className="text-lg font-extrabold text-slate-900">{data?.insights?.trend?.direction || 'stable'}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <p className="text-xs uppercase tracking-widest font-bold text-slate-500 mb-2">Total Evaluations</p>
          <p className="text-lg font-extrabold text-slate-900">{data?.scores?.length || 0}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-6">KPI Timeline</h3>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={scores}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="seq" fontSize={11} stroke="#64748b" axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} fontSize={11} stroke="#64748b" axisLine={false} tickLine={false} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="kpi" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} name="KPI" />
                <Line type="monotone" dataKey="empathy" stroke="#ec4899" strokeWidth={2} dot={false} name="Empathy" />
                <Line type="monotone" dataKey="resolution" stroke="#8b5cf6" strokeWidth={2} dot={false} name="Resolution" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-6">Skill Radar</h3>
          <div className="h-[280px]">
            {radarData.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis dataKey="metric" tick={{ fontSize: 12, fill: '#64748b' }} />
                  <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                  <Radar dataKey="value" stroke="#10b981" fill="#10b981" fillOpacity={0.2} strokeWidth={2} />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400">No evaluation data yet</div>
            )}
          </div>
        </div>
      </div>

      {data?.insights?.recommendations?.length > 0 && (
        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-bold text-emerald-900 mb-4">💡 Improvement Suggestions</h3>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {data.insights.recommendations.map((r, i) => (
              <li key={i} className="bg-white/70 p-3 rounded-lg text-sm text-emerald-800 font-medium border border-emerald-100/50 flex items-start gap-2">
                <span className="text-emerald-500 mt-0.5">•</span> {r}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
