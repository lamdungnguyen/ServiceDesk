import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  AreaChart,
  Area
} from "recharts";
import {
  BarChart3,
  BrainCircuit,
  Globe,
  Users,
  User as UserIcon,
  Inbox,
  Bot,
  Target
} from "lucide-react";

import ConversationForm from "../components/ConversationForm";
import ConversationsTable from "../components/ConversationsTable";
import InsightsPanel from "../components/InsightsPanel";
import StatCard from "../components/StatCard";
import { useAuth } from "../context/AuthContext";
import {
  analyzeBatch,
  analyzeConversation,
  fetchConversationsWithFilters,
  fetchDashboardReportWithFilters,
  ingestConversation,
  predictEmployee
} from "../services/api";

function buildCsv(rows) {
  const header = [
    "conversationId",
    "employeeName",
    "customerName",
    "language",
    "sentimentLabel",
    "sentimentScore",
    "customerSatisfaction",
    "latestKpi",
    "summary"
  ];

  const body = rows.map((row) => [
    row.conversationId,
    row.employeeName,
    row.customerName,
    row.language,
    row.sentimentLabel,
    row.sentimentScore,
    row.customerSatisfaction,
    row.latestKpi,
    row.summary?.replaceAll(",", " ")
  ]);

  return [header, ...body].map((line) => line.join(",")).join("\n");
}

export default function Dashboard() {
  const [loading, setLoading] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [report, setReport] = useState(null);
  const [notice, setNotice] = useState("");
  const [selectedInsight, setSelectedInsight] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [filters, setFilters] = useState({
    language: "all",
    team: "all",
    employeeId: "all"
  });

  const loadData = useCallback(async () => {
    const [conversationData, reportData] = await Promise.all([
      fetchConversationsWithFilters(filters),
      fetchDashboardReportWithFilters(filters)
    ]);

    setConversations(conversationData);
    setReport(reportData);
    setSelectedInsight(reportData.analysisFeed?.[0] || null);
    return reportData;
  }, [filters]);

  useEffect(() => {
    loadData().catch((error) => {
      setNotice(error.response?.data?.message || "Failed to load data");
    });
  }, [loadData]);

  const topChart = useMemo(() => {
    const rows = report?.topPerformers || [];
    return rows.map((row) => ({
      name: row.employee?.name,
      kpi: Number(row.dataValues?.avgKpi || 0).toFixed(1)
    }));
  }, [report]);

  const mockTrendData = useMemo(() => {
    return [
      { day: 'Mon', score: 65, volume: 120 },
      { day: 'Tue', score: 72, volume: 150 },
      { day: 'Wed', score: 68, volume: 140 },
      { day: 'Thu', score: 78, volume: 110 },
      { day: 'Fri', score: 85, volume: 90 },
      { day: 'Sat', score: 82, volume: 60 },
      { day: 'Sun', score: 88, volume: 75 },
    ]
  }, [])

  async function handleIngest(payload) {
    try {
      setLoading(true);
      await ingestConversation(payload);
      await loadData();
      setNotice("Successfully saved conversation");
      setTimeout(() => setNotice(""), 3000);
    } catch (error) {
      setNotice(error.response?.data?.message || "Failed to save conversation");
    } finally {
      setLoading(false);
    }
  }

  async function handleAnalyze(conversationId) {
    try {
      setNotice("Analyzing conversation...");
      const result = await analyzeConversation(conversationId);
      const refreshedReport = await loadData();
      const insight = refreshedReport?.analysisFeed?.find((item) => item.conversationId === conversationId);
      if (insight) {
        setSelectedInsight(insight);
      }
      setNotice(`Analyzed conversation #${conversationId}`);
      setTimeout(() => setNotice(""), 3000);
      return result;
    } catch (error) {
      setNotice(error.response?.data?.message || "Failed to analyze");
      return null;
    }
  }

  async function handlePredict(employeeId) {
    if (!employeeId) {
      setNotice("Cannot predict: No agent assigned to this conversation");
      return;
    }
    try {
      setNotice("Predicting employee performance...");
      await predictEmployee(employeeId);
      await loadData();
      setNotice(`Created prediction for employee #${employeeId}`);
      setTimeout(() => setNotice(""), 3000);
    } catch (error) {
      setNotice(error.response?.data?.message || "Failed to predict");
    }
  }

  async function handleAnalyzeBatch() {
    try {
      setNotice("Running NLP batch for unanalyzed conversations...");
      const result = await analyzeBatch(50);
      await loadData();
      if (result.analyzedCount === 0) {
        setNotice("No new conversations requiring NLP analysis found.");
      } else {
        setNotice(`Batch analyzed ${result.analyzedCount} conversations`);
      }
      setTimeout(() => setNotice(""), 5000);
    } catch (error) {
      setNotice(error.response?.data?.message || "Failed NLP batch - possibly no valid conversations to process");
    }
  }

  function exportCsv() {
    const rows = report?.analysisFeed || [];
    if (!rows.length) {
      setNotice("No data to export");
      return;
    }
    const csv = buildCsv(rows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `cs-analytics-report-${Date.now()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  return (
    <main className="w-full flex flex-col gap-6 animate-fade-in pb-10 min-w-0">
      <header className="bg-gradient-to-r from-pink-50 to-white border border-pink-100 rounded-3xl p-6 lg:p-8 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 shadow-sm overflow-hidden relative">
        <div className="flex-1 relative z-10">
          <p className="text-xs uppercase tracking-widest font-bold text-pink-600 mb-2">AI-Powered Workforce Intelligence</p>
          <h1 className="text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight mb-3">Customer Care <br className="hidden lg:block" />Performance Center</h1>
          <p className="text-slate-600 text-sm lg:text-base max-w-xl leading-relaxed">
            Real-time analytics engine to collect insights, score KPIs, run sentiment analysis,
            and forecast your agents' productivity accurately.
          </p>

          <div className="flex gap-2 mt-6 overflow-x-auto pb-1 overscroll-x-contain">
            <button
              className={`px-4 py-2 font-semibold text-sm rounded-lg transition-colors whitespace-nowrap flex items-center gap-2 ${activeTab === 'overview' ? 'bg-pink-600 text-white shadow-md shadow-pink-500/20' : 'bg-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-900'}`}
              onClick={() => setActiveTab('overview')}
            >
              <BarChart3 className="w-4 h-4" /> Overview Hub
            </button>
            <button
              className={`px-4 py-2 font-semibold text-sm rounded-lg transition-colors whitespace-nowrap flex items-center gap-2 ${activeTab === 'nlp' ? 'bg-pink-600 text-white shadow-md shadow-pink-500/20' : 'bg-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-900'}`}
              onClick={() => setActiveTab('nlp')}
            >
              <BrainCircuit className="w-4 h-4" /> NLP Studio
            </button>
          </div>
        </div>
        <div className="flex flex-row lg:flex-col gap-3 relative z-10">
          <Link className="btn-primary" to="/employee/1">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
            View Agent Profile
          </Link>
          <button className="btn-secondary" onClick={loadData}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
              <path d="M3 3v5h5"></path>
            </svg>
            Sync Real-time
          </button>
        </div>
        {/* Decorative background circle */}
        <div className="absolute -right-32 -top-32 w-96 h-96 bg-pink-100/50 rounded-full blur-3xl pointer-events-none"></div>
      </header>

      {notice && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl flex items-center gap-3 font-medium shadow-sm animate-fade-in">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><path d="M12 8v4"></path><path d="M12 16h.01"></path></svg>
          {notice}
        </div>
      )}

      {activeTab === 'overview' && (
        <div className="flex flex-col gap-6">
          <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col md:flex-row md:items-end justify-between gap-5 min-w-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 flex-1">
              <label className="form-label">
                <span className="flex items-center gap-1.5"><Globe className="w-4 h-4 text-pink-500" /> Language Filter</span>
                <select
                  className="form-input bg-slate-50"
                  value={filters.language}
                  onChange={(event) => setFilters((prev) => ({ ...prev, language: event.target.value }))}
                >
                  <option value="all">Global (All)</option>
                  <option value="vi">Vietnamese</option>
                  <option value="en">English</option>
                  <option value="mix">Multilingual</option>
                </select>
              </label>
              <label className="form-label">
                <span className="flex items-center gap-1.5"><UserIcon className="w-4 h-4 text-pink-500" /> Agent Name</span>
                <select
                  className="form-input bg-slate-50"
                  value={filters.employeeId}
                  onChange={(event) => setFilters((prev) => ({ ...prev, employeeId: event.target.value }))}
                >
                  <option value="all">All Agents</option>
                  {(report?.options?.employees || []).map((employee) => (
                    <option key={employee.id} value={employee.id}>{employee.name}</option>
                  ))}
                </select>
              </label>
            </div>
            <div className="shrink-0">
              <button className="btn-secondary w-full md:w-auto" onClick={exportCsv}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                Export CSV Server
              </button>
            </div>
          </section>

          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Total Conversations"
              value={report?.totals?.totalConversations || 0}
              helper="Ingested interactions"
              icon={<Inbox className="w-6 h-6 text-pink-500" />}
            />
            <StatCard
              label="AI Analyzed (NLP)"
              value={report?.totals?.analyzedConversations || 0}
              helper="Summarized & Scored"
              icon={<Bot className="w-6 h-6 text-purple-500" />}
            />
            <StatCard
              label="Tracked Workforce"
              value={report?.totals?.employeeCount || 0}
              helper="Active Agents in DB"
              icon={<Users className="w-6 h-6 text-indigo-500" />}
            />
            <StatCard
              label="Global Satisfaction"
              value={`${(report?.totals?.avgSatisfaction || 0).toFixed(1)}%`}
              helper="Calculated Emotion CSAT"
              icon={<Target className="w-6 h-6 text-emerald-500" />}
            />
          </section>

          <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-w-0">
            {/* 1. Top Performers */}
            <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col min-w-0">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Top Performers</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 italic">Live KPI</span>
              </div>
              <div className="h-[240px] min-h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topChart} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip cursor={{ fill: '#f8fafc' }} />
                    <Bar dataKey="kpi" radius={[4, 4, 0, 0]}>
                      {topChart.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#3b82f6' : '#60a5fa'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>

            {/* 2. Sentiment Aggregation */}
            <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm min-w-0">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-6">Sentiment Mix</h3>
              <div className="h-[240px] min-h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={report?.sentimentDistribution || []}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={4}
                      stroke="none"
                    >
                      {(report?.sentimentDistribution || []).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={
                          entry.name === 'positive' ? '#10b981' :
                          entry.name === 'negative' ? '#f43f5e' :
                          entry.name === 'neutral' ? '#64748b' : '#3b82f6'
                        } />
                      ))}
                    </Pie>
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </section>

            {/* 3. Channel Breakdown (Call vs Text) */}
            <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm min-w-0">
               <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-6">Channel distribution</h3>
               <div className="h-[240px] min-h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Voice Calls', value: 35, fill: '#8b5cf6' },
                        { name: 'Live Chat', value: 65, fill: '#3b82f6' }
                      ]}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={0}
                      outerRadius={80}
                      stroke="none"
                    />
                    <Legend iconType="circle" verticalAlign="bottom" wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }} />
                    <Tooltip contentStyle={{ borderRadius: '12px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </section>
          </section>

          <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-w-0">
            {/* 4. Volume & Score Trend */}
            <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm min-w-0">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Quality Score vs Volume Trend</h3>
                <div className="flex gap-4">
                  <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-pink-500"></span><span className="text-[10px] font-bold text-slate-500">Volume</span></div>
                  <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-indigo-500"></span><span className="text-[10px] font-bold text-slate-500">Score</span></div>
                </div>
              </div>
              <div className="h-[300px] min-h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={mockTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorVol" x1="0" y1="0" x2="0" y2="1">
                         <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.1} />
                         <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="day" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: 'none' }} />
                    <Area type="monotone" dataKey="score" stroke="#3b82f6" fillOpacity={1} fill="url(#colorScore)" strokeWidth={3} />
                    <Area type="monotone" dataKey="volume" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorVol)" strokeWidth={3} strokeDasharray="5 5" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </section>

            {/* 5. Team Satisfaction Matrix */}
            <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm min-w-0">
               <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-6">Sentiment Velocity</h3>
               <div className="h-[300px] min-h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[
                    { team: 'Support', pos: 85, neg: 5, neu: 10 },
                    { team: 'Billing', pos: 60, neg: 25, neu: 15 },
                    { team: 'Tech', pos: 75, neg: 10, neu: 15 },
                    { team: 'Sales', pos: 90, neg: 2, neu: 8 }
                  ]} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                    <XAxis type="number" stroke="#64748b" fontSize={10} hide />
                    <YAxis dataKey="team" type="category" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '12px' }} />
                    <Bar dataKey="pos" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} barSize={20} />
                    <Bar dataKey="neu" stackId="a" fill="#94a3b8" />
                    <Bar dataKey="neg" stackId="a" fill="#f43f5e" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>
          </section>

          {/* New row: Resolution & Language Matrix */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-w-0">
             <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm min-w-0">
               <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-6">Language Distribution (Market Share)</h3>
               <div className="h-[240px] min-h-[240px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Vietnamese', value: 75, fill: '#3b82f6' },
                          { name: 'English', value: 20, fill: '#8b5cf6' },
                          { name: 'Other', value: 5, fill: '#cbd5e1' }
                        ]}
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                         <Cell fill="#3b82f6" />
                         <Cell fill="#8b5cf6" />
                         <Cell fill="#cbd5e1" />
                      </Pie>
                      <Tooltip />
                      <Legend verticalAlign="bottom" wrapperStyle={{ fontSize: '10px' }} />
                    </PieChart>
                  </ResponsiveContainer>
               </div>
             </section>

             <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm min-w-0">
               <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-6">Resolution Success Rate</h3>
               <div className="flex flex-col items-center justify-center h-[240px]">
                  <div className="relative w-40 h-40 flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Resolved', value: 88, fill: '#10b981' },
                            { name: 'Pending', value: 12, fill: '#f1f5f9' }
                          ]}
                          startAngle={180}
                          endAngle={0}
                          innerRadius={65}
                          outerRadius={80}
                          dataKey="value"
                          stroke="none"
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pt-8">
                       <span className="text-3xl font-black text-slate-900">88%</span>
                       <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Efficiency</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 mt-4 text-center max-w-[200px]">Percentage of conversations resolved within 24 hours.</p>
               </div>
             </section>
          </section>

          {/* Existing form row */}
          <section className="grid grid-cols-1 lg:grid-cols-1 gap-6 min-w-0">
             <ConversationForm onSubmit={handleIngest} isLoading={loading} />
          </section>
        </div>
      )}

      {activeTab === 'nlp' && (
        <div className="flex flex-col gap-6">
          <div className="bg-pink-50 border border-pink-200 rounded-2xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h3 className="text-lg font-bold text-pink-900 flex items-center gap-2">
                <BrainCircuit className="w-5 h-5" /> Batch Inference Engine
              </h3>
              <p className="mt-1 text-pink-700 text-sm">Automatically processes unanalyzed chats tracking HuggingFace DistilBERT and BART summaries.</p>
            </div>
            <button onClick={handleAnalyzeBatch} className="btn-primary shrink-0 bg-pink-600 hover:bg-pink-700">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
              Launch Batch NLP
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            <div className="lg:col-span-2 min-w-0 overflow-x-auto">
              <ConversationsTable rows={conversations} onAnalyze={handleAnalyze} onPredict={handlePredict} />
            </div>
            <div className="lg:col-span-1 border-gray-200">
              <InsightsPanel item={selectedInsight} />
            </div>
          </div>
        </div>
      )}


    </main>
  );
}
