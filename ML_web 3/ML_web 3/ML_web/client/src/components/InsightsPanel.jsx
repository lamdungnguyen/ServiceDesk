import { BrainCircuit, Smile, Frown, Meh, AlignLeft, BarChart2 } from 'lucide-react';

export default function InsightsPanel({ item }) {
  if (!item) {
    return (
      <div className="bg-slate-50/50 border border-dashed border-slate-300 rounded-2xl p-8 flex flex-col items-center justify-center min-h-[400px] text-center mt-6">
          <BrainCircuit className="w-12 h-12 text-pink-400 mb-4 opacity-50" strokeWidth={1.5} />
          <h3 className="text-lg font-bold text-slate-700 mb-2">No NLP Data Available</h3>
          <p className="text-sm text-slate-500 max-w-sm">Run NLP Batch or select "NLP Scan" on a specific conversation in the list to generate insights.</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm min-w-0 mt-6 lg:mt-0 flex flex-col h-full sticky top-6">
      <div className="flex justify-between items-center mb-5 pb-4 border-b border-slate-100">
          <h3 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
             <svg className="w-5 h-5 text-pink-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                 <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
             </svg>
             Live Insight #{item.conversationId}
          </h3>
          <span className="text-xs bg-pink-50 text-pink-700 font-bold px-3 py-1 rounded-full border border-pink-200">
             Score: {(item.sentimentScore ? item.sentimentScore * 100 : 0).toFixed(0)}/100
          </span>
      </div>

      <div className="space-y-5 flex-1 overflow-y-auto pr-2">
          {/* Sentiment */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Detected Sentiment</span>
              <p className="text-slate-800 font-semibold text-lg flex items-center gap-2">
                  {item.sentimentLabel === 'Positive' && <Smile className="text-emerald-500 w-5 h-5" />}
                  {item.sentimentLabel === 'Negative' && <Frown className="text-rose-500 w-5 h-5" />}
                  {item.sentimentLabel === 'Neutral' && <Meh className="text-amber-500 w-5 h-5" />}
                  {item.sentimentLabel || "N/A"}
              </p>
          </div>

          {/* AI Summary */}
          <div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                 <AlignLeft className="w-4 h-4 text-purple-500" />
                 AI Conversation Summary
              </span>
              <p className="text-slate-700 bg-white border border-slate-200 rounded-xl p-4 text-sm leading-relaxed shadow-sm italic">
                  "{item.summary || "No summary generated. Conversation might be too short."}"
              </p>
          </div>

          {/* KPI Breakdown */}
          <div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                 <BarChart2 className="w-4 h-4 text-emerald-500" />
                 Calculated KPI Matrix
              </span>
              <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl">
                      <p className="text-3xl font-extrabold text-pink-600 mb-1">{Number(item.kpi || 0).toFixed(1)}</p>
                      <p className="text-xs text-slate-500 font-medium">Aggregate Average</p>
                  </div>
                  <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl flex flex-col justify-center">
                       <div className="flex justify-between items-center mb-1">
                          <span className="text-xs text-slate-500">Sat</span>
                          <span className="text-xs font-bold text-slate-700">{Number(item.customerSatisfaction || 0).toFixed(1)}</span>
                       </div>
                       <div className="w-full bg-slate-200 rounded-full h-1.5">
                           <div className="bg-pink-500 h-1.5 rounded-full" style={{width: `${item.customerSatisfaction}%`}}></div>
                       </div>
                  </div>
              </div>
          </div>
      </div>
    </div>
  );
}
