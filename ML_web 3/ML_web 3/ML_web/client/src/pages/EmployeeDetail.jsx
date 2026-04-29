import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell
} from "recharts";
import {
  AlertTriangle, AlertCircle, CheckCircle, ArrowRight,
  User as UserIcon, Building2 as BuildingIcon, Target as TargetIcon,
  Loader2, ChevronLeft, TrendingUp, TrendingDown, Minus, Activity
} from "lucide-react";

import {
  fetchEmployeeHistory,
  runEmployeePrediction,
  runForecastScenario
} from "../services/api";

const COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ec4899'];

export default function EmployeeDetail() {
  const { employeeId } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("weekly");
  const [scenario, setScenario] = useState({
    communicationDelta: 0,
    empathyDelta: 0,
    resolutionDelta: 0,
    kpiDelta: 0
  });
  const [scenarioResult, setScenarioResult] = useState(null);

  const loadHistory = useCallback(async () => {
    const response = await fetchEmployeeHistory(employeeId);
    return response;
  }, [employeeId]);

  useEffect(() => {
    let active = true;
    if (!employeeId || employeeId === "undefined" || employeeId === "null") {
      setLoading(false);
      setError("No employee ID provided");
      return;
    }
    setLoading(true);

    loadHistory()
      .then((response) => {
        if (!active) return;
        setData(response);
        setError("");
      })
      .catch((err) => {
        if (!active) return;
        setError(err.response?.data?.message || "Failed to load history");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, [loadHistory]);

  const scoreData = useMemo(() => {
    if (!data?.scores) return [];
    return data.scores.map((item, index) => ({
      sequence: `#${index + 1}`,
      kpi: Number(item.kpiScore || 0),
      communication: Number(item.communicationScore || 0),
      empathy: Number(item.empathyScore || 0),
      resolution: Number(item.resolutionScore || 0)
    }));
  }, [data]);

  // Radar chart data -- latest score breakdown
  const radarData = useMemo(() => {
    if (!data?.scores?.length) return [];
    const latest = data.scores[data.scores.length - 1];
    return [
      { metric: 'KPI', value: Number(latest.kpiScore || 0), fullMark: 100 },
      { metric: 'Communication', value: Number(latest.communicationScore || 0), fullMark: 100 },
      { metric: 'Empathy', value: Number(latest.empathyScore || 0), fullMark: 100 },
      { metric: 'Resolution', value: Number(latest.resolutionScore || 0), fullMark: 100 },
    ];
  }, [data]);

  // Average scores for donut
  const avgScores = useMemo(() => {
    if (!data?.scores?.length) return null;
    const n = data.scores.length;
    const sum = data.scores.reduce((acc, s) => ({
      kpi: acc.kpi + Number(s.kpiScore || 0),
      communication: acc.communication + Number(s.communicationScore || 0),
      empathy: acc.empathy + Number(s.empathyScore || 0),
      resolution: acc.resolution + Number(s.resolutionScore || 0),
    }), { kpi: 0, communication: 0, empathy: 0, resolution: 0 });
    return {
      kpi: Math.round(sum.kpi / n),
      communication: Math.round(sum.communication / n),
      empathy: Math.round(sum.empathy / n),
      resolution: Math.round(sum.resolution / n),
    };
  }, [data]);

  const donutData = useMemo(() => {
    if (!avgScores) return [];
    return [
      { name: 'KPI', value: avgScores.kpi },
      { name: 'Communication', value: avgScores.communication },
      { name: 'Empathy', value: avgScores.empathy },
      { name: 'Resolution', value: avgScores.resolution },
    ];
  }, [avgScores]);

  const factorData = useMemo(() => {
    if (!data?.predictions?.length) return [];
    const latest = data.predictions[data.predictions.length - 1];
    return (latest.factors || []).map((item) => ({
      name: item.name,
      impact: Number(item.impact || 0)
    }));
  }, [data]);

  const predictionTimeline = useMemo(() => {
    if (!data?.predictions) return [];
    return data.predictions.map((item, index) => ({
      sequence: `#${index + 1}`,
      effectiveness: Number(item.predictedEffectiveness || 0),
      risk: item.riskLevel
    }));
  }, [data]);

  // Score area chart -- cumulative view
  const scoreAreaData = useMemo(() => {
    if (!data?.scores) return [];
    return data.scores.map((item, index) => ({
      sequence: `#${index + 1}`,
      kpi: Number(item.kpiScore || 0),
      communication: Number(item.communicationScore || 0),
    }));
  }, [data]);

  const alertLevel = data?.insights?.alertLevel || "good";

  async function handleRunPrediction() {
    try {
      setNotice("Running forecast by period...");
      await runEmployeePrediction(employeeId, period);
      const response = await loadHistory();
      setData(response);
      setNotice("Updated new forecast");
      setTimeout(() => setNotice(""), 3000);
    } catch (err) {
      setNotice(err.response?.data?.message || "Failed to run forecast");
    }
  }

  async function handleScenario() {
    try {
      setNotice("Simulating improvement scenario...");
      const result = await runForecastScenario(employeeId, {
        period,
        adjustment: {
          communicationDelta: Number(scenario.communicationDelta || 0),
          empathyDelta: Number(scenario.empathyDelta || 0),
          resolutionDelta: Number(scenario.resolutionDelta || 0),
          kpiDelta: Number(scenario.kpiDelta || 0)
        }
      });
      setScenarioResult(result);
      setNotice("Simulation completed");
      setTimeout(() => setNotice(""), 3000);
    } catch (err) {
      setNotice(err.response?.data?.message || "Failed to simulate scenario");
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-pink-600" />
      </div>
    );
  }

  return (
    <main className="flex flex-col gap-6 animate-fade-in pb-10 min-w-0">
      {/* Header */}
      <header className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative overflow-hidden">
        <div className="relative z-10">
          <p className="text-xs uppercase tracking-widest font-bold text-pink-500 mb-1">Employee Analytics</p>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Performance Details</h1>
        </div>
        <Link className="btn-secondary whitespace-nowrap relative z-10 flex items-center gap-1.5" to="/performance">
           <ChevronLeft className="w-4 h-4" />
           Back to Overview
        </Link>
        <div className="absolute right-0 top-0 w-64 h-64 bg-slate-50 rounded-full blur-3xl -mx-10 -my-10 pointer-events-none"></div>
      </header>

      {error && <div className="bg-rose-50 border border-rose-200 text-rose-700 font-medium px-4 py-3 rounded-xl">{error}</div>}
      {notice && <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 font-medium px-4 py-3 rounded-xl">{notice}</div>}

      {/* Agent Profile + Status Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-pink-100 flex items-center justify-center text-pink-600 font-bold text-xl shrink-0">
            <UserIcon className="w-7 h-7" />
          </div>
          <div>
            <p className="text-xl font-bold text-slate-900">{data?.employee?.name || "N/A"}</p>
            <p className="text-sm text-slate-500 flex items-center gap-1.5 font-medium">
              <BuildingIcon className="w-4 h-4" /> {data?.employee?.team || "N/A"}
            </p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <p className="text-xs uppercase tracking-widest font-bold text-slate-500 mb-1 flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-pink-500" /> Alert Level
          </p>
          <div className="flex items-center gap-2 mt-1">
            {alertLevel === 'critical' && <AlertCircle className="w-5 h-5 text-rose-500" />}
            {alertLevel === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-500" />}
            {alertLevel === 'good' && <CheckCircle className="w-5 h-5 text-emerald-500" />}
            <span className={`text-lg font-extrabold uppercase ${
              alertLevel === 'critical' ? 'text-rose-600' :
              alertLevel === 'warning' ? 'text-amber-600' :
              'text-emerald-600'
            }`}>{alertLevel}</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <p className="text-xs uppercase tracking-widest font-bold text-slate-500 mb-1">Predicted Risk</p>
          <p className="text-lg font-extrabold text-slate-900 uppercase mt-1">{data?.insights?.latestRisk || "unknown"}</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <p className="text-xs uppercase tracking-widest font-bold text-slate-500 mb-1 flex items-center gap-1.5">
            {data?.insights?.trend?.direction === 'improving' ? <TrendingUp className="w-4 h-4 text-emerald-500" /> :
             data?.insights?.trend?.direction === 'declining' ? <TrendingDown className="w-4 h-4 text-rose-500" /> :
             <Minus className="w-4 h-4 text-slate-400" />} KPI Trend
          </p>
          <div className="flex items-end gap-2 mt-1">
            <span className="text-lg font-extrabold text-slate-900">{data?.insights?.trend?.direction || "stable"}</span>
            <span className="text-sm font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded mb-0.5">
              {Number(data?.insights?.trend?.delta || 0).toFixed(1)} pts
            </span>
          </div>
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-w-0">
        {/* KPI Timeline */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm min-w-0">
          <h3 className="text-lg font-bold text-slate-900 tracking-tight mb-6">Aggregate KPI Timeline</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={280}>
              <LineChart data={scoreData} margin={{top: 10, right: 10, left: -20, bottom: 0}}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="sequence" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis domain={[0, 100]} stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip wrapperStyle={{ borderRadius: '8px' }}/>
                <Legend wrapperStyle={{ paddingTop: '10px' }}/>
                <Line type="monotone" name="Global KPI" dataKey="kpi" stroke="#3b82f6" strokeWidth={3} dot={{ strokeWidth: 2, r: 4 }} activeDot={{ r: 6 }}/>
                <Line type="monotone" name="Empathy" dataKey="empathy" stroke="#ec4899" strokeWidth={2} dot={false}/>
                <Line type="monotone" name="Resolution" dataKey="resolution" stroke="#8b5cf6" strokeWidth={2} dot={false}/>
                <Line type="monotone" name="Communication" dataKey="communication" stroke="#f59e0b" strokeWidth={2} dot={false}/>
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Radar Chart - Skill Breakdown */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm min-w-0">
          <h3 className="text-lg font-bold text-slate-900 tracking-tight mb-6">Skill Radar (Latest Scores)</h3>
          <div className="h-[300px]">
            {radarData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={280}>
                <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis dataKey="metric" tick={{ fontSize: 12, fill: '#64748b' }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                  <Radar name="Score" dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} strokeWidth={2} />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400">No data available</div>
            )}
          </div>
        </div>
      </div>

      {/* Second Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-w-0">
        {/* Communication vs KPI Area */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm min-w-0">
          <h3 className="text-lg font-bold text-slate-900 tracking-tight mb-6">KPI vs Communication Trend</h3>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={220}>
              <AreaChart data={scoreAreaData} margin={{top: 10, right: 10, left: -20, bottom: 0}}>
                <defs>
                  <linearGradient id="colorKpi" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorComm" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="sequence" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis domain={[0, 100]} stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip />
                <Area type="monotone" dataKey="kpi" stroke="#3b82f6" fillOpacity={1} fill="url(#colorKpi)" strokeWidth={2} name="KPI" />
                <Area type="monotone" dataKey="communication" stroke="#f59e0b" fillOpacity={1} fill="url(#colorComm)" strokeWidth={2} name="Communication" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Average Score Breakdown Donut */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm min-w-0">
          <h3 className="text-lg font-bold text-slate-900 tracking-tight mb-6">Avg Score Distribution</h3>
          <div className="h-[250px]">
            {donutData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={220}>
                <PieChart>
                  <Pie data={donutData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={4}
                    label={({name, value}) => `${name} ${value}`}
                  >
                    {donutData.map((entry, index) => (
                      <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400">No data available</div>
            )}
          </div>
        </div>

        {/* Prediction Timeline */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm min-w-0">
          <h3 className="text-lg font-bold text-slate-900 tracking-tight mb-6">Prediction Trajectory</h3>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={220}>
              <LineChart data={predictionTimeline} margin={{top: 10, right: 10, left: -20, bottom: 0}}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="sequence" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis domain={[0, 100]} stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip wrapperStyle={{ borderRadius: '8px' }}/>
                <Line type="stepAfter" dataKey="effectiveness" stroke="#10b981" strokeWidth={3} dot={{r:4, fill: '#10b981'}} name="Effectiveness %" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* SHAP + Forecast Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-w-0">
        {/* Latest forecast */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col gap-4">
          <div className="flex justify-between items-center pb-4 border-b border-slate-100">
            <h3 className="text-lg font-bold text-slate-900 tracking-tight">Latest Machine Forecast</h3>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 items-end">
            <label className="form-label flex-1">
              Forecast Generation Period
              <select className="form-input bg-slate-50" value={period} onChange={(event) => setPeriod(event.target.value)}>
                <option value="weekly">Next 7 Days</option>
                <option value="monthly">Next 30 Days</option>
                <option value="quarterly">Next 90 Days</option>
              </select>
            </label>
            <button className="btn-secondary whitespace-nowrap h-[42px]" onClick={handleRunPrediction}>Run Forecast</button>
          </div>

          {data?.predictions?.length ? (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 mt-2 flex flex-col gap-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-600 font-medium">Algorithm Accuracy Expectancy:</span>
                <strong className="text-2xl text-slate-900">{data.predictions[data.predictions.length - 1].predictedEffectiveness}%</strong>
              </div>
              <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-pink-500 rounded-full transition-all duration-1000 ease-out"
                  style={{width: `${data.predictions[data.predictions.length - 1].predictedEffectiveness}%`}}
                ></div>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-200 text-sm">
                <span className="text-slate-600 font-medium">Burnout / Warning Risk:</span>
                <strong className="uppercase bg-white px-2 rounded-md border border-slate-200 text-xs flex items-center h-6">{data.predictions[data.predictions.length - 1].riskLevel}</strong>
              </div>
              <div className="pt-1">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">Top Negative Impact Drivers</span>
                <div className="flex flex-wrap gap-2">
                  {(data.predictions[data.predictions.length - 1].factors || []).map((item) => (
                    <span key={item.name} className="text-xs bg-white border border-slate-200 px-2 py-1 rounded shadow-sm flex items-center gap-1.5 text-slate-600">
                      <TargetIcon className="w-3 h-3 text-amber-500" /> {item.name} <span className="font-mono bg-slate-100 px-1 rounded">{Number(item.impact || 0).toFixed(2)}</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 border border-dashed border-slate-300 rounded-xl p-6 text-center text-sm text-slate-500 italic mt-2">
              No prediction available in timeline.
            </div>
          )}
        </div>

        {/* SHAP Feature Importance */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm min-w-0">
          <h3 className="text-lg font-bold text-slate-900 tracking-tight mb-2">SHAP Feature Importance</h3>
          <p className="text-sm text-slate-500 mb-6 leading-relaxed">Explanation generated by ML model identifying parameters carrying the most weight on prediction outcomes.</p>
          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={230}>
              <BarChart data={factorData} layout="vertical" margin={{top: 10, right: 30, left: 20, bottom: 0}}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" domain={[0, 1]} stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} width={110} />
                <Tooltip cursor={{fill: '#f8fafc'}}/>
                <Bar dataKey="impact" fill="#8b5cf6" radius={[0, 6, 6, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Simulation Sandbox */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col">
        <h3 className="text-lg font-bold text-slate-900 tracking-tight mb-2">Simulation Sandbox</h3>
        <p className="text-sm text-slate-500 mb-5 leading-relaxed">Adjust individual metric scores to simulate potential growth in future employee evaluation periods.</p>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
          <label className="form-label">
            Communication Δ
            <input className="form-input text-center" type="number" value={scenario.communicationDelta}
              onChange={(event) => setScenario({ ...scenario, communicationDelta: event.target.value })} />
          </label>
          <label className="form-label">
            Empathy Δ
            <input className="form-input text-center" type="number" value={scenario.empathyDelta}
              onChange={(event) => setScenario({ ...scenario, empathyDelta: event.target.value })} />
          </label>
          <label className="form-label">
            Resolution Δ
            <input className="form-input text-center" type="number" value={scenario.resolutionDelta}
              onChange={(event) => setScenario({ ...scenario, resolutionDelta: event.target.value })} />
          </label>
          <label className="form-label">
            Overall KPI Δ
            <input className="form-input text-center" type="number" value={scenario.kpiDelta}
              onChange={(event) => setScenario({ ...scenario, kpiDelta: event.target.value })} />
          </label>
        </div>

        <button className="btn-primary w-full shadow-md py-3 font-semibold flex items-center justify-center gap-2" onClick={handleScenario}>
          <Activity className="w-5 h-5" /> Simulate Outcomes
        </button>

        {scenarioResult && (
          <div className="mt-5 p-4 rounded-xl border-dashed border-2 border-emerald-200 bg-emerald-50 text-emerald-800 text-sm flex justify-between items-center animate-fade-in shadow-inner">
            <div className="flex flex-col gap-1">
              <span className="font-bold uppercase tracking-widest text-[10px]">Projected Outcome Result</span>
              <span className="text-2xl font-extrabold">{Number(scenarioResult.scenario.predictedEffectiveness || 0).toFixed(1)}%</span>
            </div>
            <div className="text-right flex flex-col gap-1">
              <span className="font-bold uppercase tracking-widest text-[10px]">Expected Risk Status</span>
              <strong className="uppercase bg-white px-2 py-1 rounded shadow-sm text-xs border border-emerald-100 inline-block">{scenarioResult.scenario.riskLevel}</strong>
            </div>
          </div>
        )}
      </div>

      {/* Automated Action Plans */}
      <section className="bg-gradient-to-br from-pink-50 to-rose-50 border border-pink-100 rounded-2xl p-6 shadow-sm min-w-0">
        <h3 className="text-lg font-bold text-pink-900 tracking-tight mb-4 flex items-center gap-2">
          <CheckCircle className="w-5 h-5" /> Automated Action Plans
        </h3>
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-pink-800 font-medium">
          {(data?.insights?.recommendations || []).map((item, index) => (
            <li key={`${index}-${item}`} className="bg-white/60 p-3 rounded-lg flex items-start gap-2 border border-pink-100/50 shadow-sm shadow-pink-500/5">
              <span className="text-pink-500 mt-0.5">•</span> {item}
            </li>
          ))}
          {(!data?.insights?.recommendations || data.insights.recommendations.length === 0) && (
            <li className="italic text-pink-600/60 p-2">Wait for more data points...</li>
          )}
        </ul>
      </section>
    </main>
  );
}
