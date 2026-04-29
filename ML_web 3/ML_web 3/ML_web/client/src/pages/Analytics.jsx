import React, { useState, useEffect, useMemo } from 'react';
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
  ResponsiveContainer, Legend, AreaChart, Area, PieChart, Pie, Cell, 
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from "recharts";
import { 
  BarChart4, Download, Filter, TrendingUp, Users, Target, Clock, 
  Loader2, Globe, Calendar, Zap, MessageSquare, Phone
} from 'lucide-react';
import { fetchDashboardReport } from '../services/api';

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#f43f5e', '#64748b'];

const volumeTrendData = [
  { name: 'Jan', conversations: 450, tickets: 380 },
  { name: 'Feb', conversations: 520, tickets: 410 },
  { name: 'Mar', conversations: 480, tickets: 450 },
  { name: 'Apr', conversations: 610, tickets: 520 },
  { name: 'May', conversations: 550, tickets: 480 },
  { name: 'Jun', conversations: 670, tickets: 580 },
];

const teamData = [
  { subject: 'Speed', Support: 120, Billing: 110, Tech: 150, fullMark: 150 },
  { subject: 'Accuracy', Support: 130, Billing: 130, Tech: 140, fullMark: 150 },
  { subject: 'Empathy', Support: 150, Billing: 120, Tech: 100, fullMark: 150 },
  { subject: 'Resolution', Support: 110, Billing: 150, Tech: 130, fullMark: 150 },
  { subject: 'Language', Support: 90, Billing: 140, Tech: 120, fullMark: 150 },
];

const channelData = [
  { name: 'Live Chat', value: 45, icon: <MessageSquare className="w-4 h-4" /> },
  { name: 'Voice Call', value: 30, icon: <Phone className="w-4 h-4" /> },
  { name: 'Email', value: 15, icon: <Globe className="w-4 h-4" /> },
  { name: 'WhatsApp', value: 10, icon: <Zap className="w-4 h-4" /> },
];

const sentimentData = [
  { name: 'Mon', positive: 400, negative: 140, neutral: 240 },
  { name: 'Tue', positive: 300, negative: 139, neutral: 221 },
  { name: 'Wed', positive: 200, negative: 300, neutral: 229 },
  { name: 'Thu', positive: 278, negative: 190, neutral: 200 },
  { name: 'Fri', positive: 189, negative: 280, neutral: 218 },
  { name: 'Sat', positive: 239, negative: 180, neutral: 250 },
  { name: 'Sun', positive: 349, negative: 130, neutral: 210 },
];

const resolutionData = [
    { day: 'Mon', time: 12 },
    { day: 'Tue', time: 14 },
    { day: 'Wed', time: 18 },
    { day: 'Thu', time: 15 },
    { day: 'Fri', time: 19 },
    { day: 'Sat', time: 22 },
    { day: 'Sun', time: 10 },
];

export default function Analytics() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeRange, setActiveRange] = useState('30d');

  useEffect(() => {
    async function loadData() {
      try {
        const data = await fetchDashboardReport();
        setReport(data);
      } catch (err) {
        console.error("Failed to load analytics", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[70vh]">
         <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-6 animate-fade-in pb-16 min-w-0">
      {/* Header Section */}
      <header className="bg-white border border-slate-200 rounded-3xl p-6 lg:p-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 shadow-sm relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border border-emerald-200">
               Live Intelligence
            </span>
          </div>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
             Global Statistics
          </h1>
          <p className="text-slate-500 mt-2 text-lg max-w-2xl">
             Explore deep metrics from the AI analysis engine, comparing channel performance, 
             sentiment shifts, and team effectiveness globally.
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 relative z-10 shrink-0">
            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
               {['7d', '30d', '90d'].map(range => (
                 <button 
                   key={range}
                   onClick={() => setActiveRange(range)}
                   className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
                     activeRange === range ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                   }`}
                 >
                   {range.toUpperCase()}
                 </button>
               ))}
            </div>
            <button className="btn-secondary flex items-center gap-2 border-slate-300">
                <Download className="w-4 h-4" /> Export Report
            </button>
        </div>

        {/* Decorative elements */}
        <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-emerald-50 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
        <div className="absolute left-1/2 top-0 w-96 h-96 bg-pink-50 rounded-full blur-3xl opacity-30 pointer-events-none -translate-x-1/2"></div>
      </header>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow group">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Target className="w-5 h-5" />
              </div>
              <span className="text-slate-500 text-xs font-bold tracking-widest uppercase">Global CSAT</span>
              <div className="flex items-baseline gap-2 mt-1">
                <p className="text-3xl font-black text-slate-900">{report?.totals?.avgSatisfaction?.toFixed(1) || 86.4}%</p>
                <span className="text-xs font-bold text-emerald-500">+2.4%</span>
              </div>
          </div>
          
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow group">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Clock className="w-5 h-5" />
              </div>
              <span className="text-slate-500 text-xs font-bold tracking-widest uppercase">Avg Resolution</span>
              <div className="flex items-baseline gap-2 mt-1">
                <p className="text-3xl font-black text-slate-900">14.2<small className="text-sm font-bold text-slate-400 ml-1">min</small></p>
                <span className="text-xs font-bold text-rose-500">+0.8m</span>
              </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow group">
              <div className="w-10 h-10 rounded-2xl bg-pink-50 text-pink-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Users className="w-5 h-5" />
              </div>
              <span className="text-slate-500 text-xs font-bold tracking-widest uppercase">Resolution Rate</span>
              <div className="flex items-baseline gap-2 mt-1">
                <p className="text-3xl font-black text-slate-900">92.8%</p>
                <span className="text-xs font-bold text-emerald-500">+1.5%</span>
              </div>
          </div>

          <div className="bg-slate-900 p-6 rounded-3xl shadow-lg flex flex-col justify-between relative overflow-hidden group">
              <div className="relative z-10">
                <span className="text-slate-400 text-xs font-bold tracking-widest uppercase">Analyzed Volume</span>
                <p className="text-3xl font-black text-white mt-1">{report?.totals?.totalConversations || 1240}</p>
                <p className="text-slate-400 text-xs mt-2 font-medium">Total interactions scanned</p>
              </div>
              <div className="absolute bottom-0 right-0 w-24 h-24 bg-pink-500/20 rounded-full -mr-10 -mb-10 blur-2xl group-hover:bg-pink-500/40 transition-colors"></div>
              <BarChart4 className="absolute top-6 right-6 w-8 h-8 text-slate-800" />
          </div>
      </div>

      {/* Main Charts area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Row 1: Volume Trend & Sentiment (Classic Line & Bar) */}
          <section className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Interaction Volume Trend</h3>
                  <p className="text-xs text-slate-500 font-medium">Monthly growth of conversations and resolved tickets</p>
                </div>
                <div className="flex gap-4">
                   <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-pink-500"></span><span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Conversations</span></div>
                   <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span><span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Tickets</span></div>
                </div>
              </div>
              <div className="h-[300px] min-h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={volumeTrendData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} stroke="#64748b" fontSize={12} dy={10} />
                    <YAxis axisLine={false} tickLine={false} stroke="#64748b" fontSize={12} />
                    <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                    <Line type="monotone" dataKey="conversations" stroke="#3b82f6" strokeWidth={4} dot={{ r: 6, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 8 }} />
                    <Line type="monotone" dataKey="tickets" stroke="#10b981" strokeWidth={4} dot={{ r: 6, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 8 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
          </section>

          {/* Channel Distribution (Classic Doughnut/Pie) */}
          <section className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col">
              <h3 className="text-lg font-bold text-slate-900 mb-2">Channel Distribution</h3>
              <p className="text-xs text-slate-500 font-medium mb-6">Inbound traffic per communication gateway</p>
              <div className="h-[240px] relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={channelData}
                      cx="50%" cy="50%"
                      innerRadius={65} outerRadius={85}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {channelData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip contentStyle={{ borderRadius: '12px' }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                   <span className="text-2xl font-black text-slate-900">100%</span>
                   <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Aggregate</span>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                 {channelData.map((item, index) => (
                   <div key={item.name} className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                      <span className="text-[10px] font-bold text-slate-700 whitespace-nowrap">{item.name}</span>
                      <span className="text-[10px] font-bold text-slate-400 ml-auto">{item.value}%</span>
                   </div>
                 ))}
              </div>
          </section>

          {/* Radar Chart: Team Performance Comparison (Advanced Classic) */}
          <section className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm min-w-0">
              <h3 className="text-lg font-bold text-slate-900 mb-2">Performance Radar</h3>
              <p className="text-xs text-slate-500 font-medium mb-6">Cross-team attribute mapping</p>
              <div className="h-[300px] min-h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={teamData}>
                      <PolarGrid stroke="#e2e8f0" />
                      <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: '#64748b' }} />
                      <PolarRadiusAxis angle={30} domain={[0, 150]} tick={false} axisLine={false} />
                      <Radar name="Support" dataKey="Support" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                      <Radar name="Tech" dataKey="Tech" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.3} />
                      <Legend wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }} />
                      <RechartsTooltip />
                    </RadarChart>
                  </ResponsiveContainer>
              </div>
          </section>

          {/* Sentiment Over Time (Classic Stacked Bar) */}
          <section className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 mb-2">Sentiment Volatity</h3>
              <p className="text-xs text-slate-500 font-medium mb-8">Daily emotional shifts captured via NLP batch</p>
              <div className="h-[300px] min-h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={sentimentData} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} stroke="#64748b" fontSize={11} />
                      <YAxis axisLine={false} tickLine={false} stroke="#64748b" fontSize={11} />
                      <RechartsTooltip cursor={{fill: '#f8fafc'}} />
                      <Legend iconType="circle" />
                      <Bar dataKey="positive" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} barSize={40} name="Positive" />
                      <Bar dataKey="neutral" stackId="a" fill="#94a3b8" name="Neutral" />
                      <Bar dataKey="negative" stackId="a" fill="#f43f5e" radius={[6, 6, 0, 0]} name="Negative" />
                    </BarChart>
                  </ResponsiveContainer>
              </div>
          </section>

          {/* Avg Resolution Area (Classic Area) */}
          <section className="lg:col-span-3 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Resolution Efficiency Matrix</h3>
                <p className="text-xs text-slate-500 font-medium">Tracking average time to resolve across all channels</p>
              </div>
              <div className="flex gap-2">
                <span className="bg-amber-50 text-amber-600 text-[10px] font-bold px-2 py-0.5 rounded border border-amber-100">Avg: 14.2 min</span>
                <span className="bg-pink-50 text-pink-600 text-[10px] font-bold px-2 py-0.5 rounded border border-pink-100">Target: 12.0 min</span>
              </div>
            </div>
            <div className="h-[260px] min-h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={resolutionData} margin={{ top: 10, right: 30, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorTimeGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="day" axisLine={false} tickLine={false} stroke="#64748b" fontSize={12} />
                    <YAxis axisLine={false} tickLine={false} stroke="#64748b" fontSize={12} />
                    <RechartsTooltip contentStyle={{ borderRadius: '12px' }} />
                    <Area type="monotone" dataKey="time" stroke="#f59e0b" fillOpacity={1} fill="url(#colorTimeGradient)" strokeWidth={4} />
                  </AreaChart>
                </ResponsiveContainer>
            </div>
          </section>
      </div>
    </div>
  );
}
