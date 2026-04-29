import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  LineChart, Line, BarChart, Bar, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from 'recharts';
import {
  LineChart as LineChartIcon, Users, AlertTriangle, CheckCircle, ShieldAlert, Shield,
  ArrowRight, TrendingUp, TrendingDown, Minus, Loader2, Eye
} from 'lucide-react';
import { fetchTeam, fetchDashboardReport } from '../services/api';

export default function PerformanceOverview() {
  const [team, setTeam] = useState([]);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('csat');
  const [sortDir, setSortDir] = useState('desc');

  useEffect(() => {
    async function load() {
      try {
        const [teamData, reportData] = await Promise.all([
          fetchTeam(),
          fetchDashboardReport()
        ]);
        setTeam(teamData);
        setReport(reportData);
      } catch (err) {
        console.error("Failed to load performance data", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-pink-600" />
      </div>
    );
  }

  const sorted = [...team].sort((a, b) => {
    const aVal = a[sortBy] || 0;
    const bVal = b[sortBy] || 0;
    return sortDir === 'desc' ? bVal - aVal : aVal - bVal;
  });

  const toggleSort = (field) => {
    if (sortBy === field) {
      setSortDir(prev => prev === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(field);
      setSortDir('desc');
    }
  };

  // Summary stats
  const totalAgents = team.length;
  const avgCsat = team.length ? Math.round(team.reduce((s, a) => s + a.csat, 0) / team.length) : 0;
  const atRisk = team.filter(a => a.status === 'At Risk').length;
  const topPerformer = team.reduce((best, a) => a.csat > (best?.csat || 0) ? a : best, null);

  // Build chart data from topPerformers in report
  const performerChart = (report?.topPerformers || []).map(p => ({
    name: p.employee?.name?.split(' ')[0] || `#${p.employee_id}`,
    kpi: Math.round(p.dataValues?.avgKpi || 0)
  }));

  // Prediction data
  const predictionChart = (report?.latestPredictions || []).map((p, i) => ({
    name: p.employee?.name?.split(' ')[0] || `#${p.employee_id}`,
    effectiveness: Math.round(p.predictedEffectiveness || 0),
    risk: p.riskLevel
  }));

  return (
    <div className="w-full flex flex-col gap-6 animate-fade-in pb-10 min-w-0">
      {/* Header */}
      <header className="bg-gradient-to-r from-indigo-50 to-white border border-indigo-100 rounded-3xl p-6 lg:p-8 shadow-sm overflow-hidden relative">
        <div className="relative z-10">
          <p className="text-xs uppercase tracking-widest font-bold text-indigo-600 mb-2">ML Performance Intelligence</p>
          <h1 className="text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight mb-1">Performance Details</h1>
          <p className="text-slate-500 max-w-xl">View individual employee performance metrics, KPI history, and ML predictions. Click any employee to see their detailed analytics.</p>
        </div>
        <div className="absolute right-0 top-0 w-80 h-80 bg-indigo-100/30 rounded-full blur-3xl -mx-10 -my-10 pointer-events-none"></div>
      </header>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-xs uppercase tracking-widest font-bold text-slate-500 mb-2 flex items-center gap-1.5">
            <Users className="w-4 h-4 text-pink-500" /> Total Agents
          </p>
          <p className="text-3xl font-extrabold text-slate-900">{totalAgents}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-xs uppercase tracking-widest font-bold text-slate-500 mb-2 flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-emerald-500" /> Avg CSAT
          </p>
          <p className="text-3xl font-extrabold text-slate-900">{avgCsat}%</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-xs uppercase tracking-widest font-bold text-slate-500 mb-2 flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-rose-500" /> At Risk
          </p>
          <p className="text-3xl font-extrabold text-slate-900">{atRisk}</p>
        </div>
        <div className="bg-gradient-to-br from-emerald-600 to-teal-700 p-5 rounded-2xl shadow-md text-white">
          <p className="text-emerald-100 text-xs uppercase tracking-widest font-bold mb-2">Top Performer</p>
          <p className="text-2xl font-extrabold">{topPerformer?.name || 'N/A'}</p>
          <p className="text-emerald-200 text-sm mt-1">{topPerformer?.csat || 0}% CSAT</p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm min-w-0">
          <h3 className="text-lg font-bold text-slate-900 mb-6">Top Performers by KPI</h3>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={performerChart} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} stroke="#64748b" fontSize={12} />
                <YAxis domain={[0, 100]} axisLine={false} tickLine={false} stroke="#64748b" fontSize={11} />
                <Tooltip cursor={{ fill: '#f8fafc' }} />
                <Bar dataKey="kpi" fill="#3b82f6" radius={[6, 6, 0, 0]} name="Avg KPI" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm min-w-0">
          <h3 className="text-lg font-bold text-slate-900 mb-6">ML Prediction Effectiveness</h3>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={predictionChart} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} stroke="#64748b" fontSize={12} />
                <YAxis domain={[0, 100]} axisLine={false} tickLine={false} stroke="#64748b" fontSize={11} />
                <Tooltip cursor={{ fill: '#f8fafc' }} />
                <Bar dataKey="effectiveness" fill="#10b981" radius={[6, 6, 0, 0]} name="Predicted %" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Employee Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden min-w-0">
        <div className="p-5 border-b border-slate-100 bg-slate-50/50">
          <h3 className="text-lg font-bold text-slate-900">All Employees — Performance Breakdown</h3>
          <p className="text-sm text-slate-500 mt-1">Click any row to view detailed KPI history, ML predictions, and simulation sandbox.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 font-bold border-b border-slate-200">Agent</th>
                <th className="px-6 py-4 font-bold border-b border-slate-200 cursor-pointer select-none" onClick={() => toggleSort('status')}>
                  Status {sortBy === 'status' && (sortDir === 'desc' ? '↓' : '↑')}
                </th>
                <th className="px-6 py-4 font-bold border-b border-slate-200 cursor-pointer select-none" onClick={() => toggleSort('csat')}>
                  CSAT Score {sortBy === 'csat' && (sortDir === 'desc' ? '↓' : '↑')}
                </th>
                <th className="px-6 py-4 font-bold border-b border-slate-200">Performance Bar</th>
                <th className="px-6 py-4 font-bold border-b border-slate-200 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sorted.map(agent => (
                <tr key={agent.id} className="hover:bg-pink-50/30 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                        agent.csat >= 80 ? 'bg-emerald-100 text-emerald-700' :
                        agent.csat >= 50 ? 'bg-amber-100 text-amber-700' :
                        'bg-rose-100 text-rose-700'
                      }`}>
                        {agent.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">{agent.name}</p>
                        <p className="text-xs text-slate-500">{agent.role}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-md text-xs font-bold inline-flex items-center gap-1 ${
                      agent.status === 'Active' ? 'bg-emerald-100 text-emerald-700' :
                      agent.status === 'At Risk' ? 'bg-rose-100 text-rose-700' :
                      agent.status === 'Warning' ? 'bg-amber-100 text-amber-700' :
                      'bg-slate-200 text-slate-600'
                    }`}>
                      {(agent.status === 'Active' || agent.status === 'Warning') && <Shield className="w-3 h-3" />}
                      {agent.status === 'At Risk' && <ShieldAlert className="w-3 h-3" />}
                      {agent.status === 'Lock' && <div className="w-2 h-2 rounded-full bg-slate-500 mr-1" />}
                      {agent.status === 'Lock' ? 'Locked' : agent.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-lg font-extrabold ${
                      agent.csat >= 80 ? 'text-emerald-600' :
                      agent.csat >= 50 ? 'text-amber-600' :
                      'text-rose-600'
                    }`}>
                      {agent.csat}%
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="w-32 h-2.5 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          agent.csat >= 80 ? 'bg-emerald-500' :
                          agent.csat >= 50 ? 'bg-amber-500' :
                          'bg-rose-500'
                        }`}
                        style={{ width: `${Math.min(agent.csat, 100)}%` }}
                      ></div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      to={`/employee/${agent.id}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-pink-50 text-pink-700 hover:bg-pink-100 rounded-lg text-sm font-semibold transition-colors group-hover:bg-pink-100"
                    >
                      <Eye className="w-4 h-4" /> View
                      <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
