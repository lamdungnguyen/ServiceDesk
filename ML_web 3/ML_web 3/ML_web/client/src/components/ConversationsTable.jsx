export default function ConversationsTable({ rows, onAnalyze, onPredict }) {
  return (
    <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm mt-6 min-w-0 flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold text-slate-900 tracking-tight">Conversation List</h3>
        <span className="text-xs bg-slate-100 text-slate-500 py-1 px-3 rounded-full font-medium border border-slate-200 shadow-sm">
           {rows.length} Total
        </span>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-inner">
        <table className="w-full text-left border-collapse min-w-[700px]">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="py-3 px-4 font-semibold text-xs uppercase tracking-widest text-slate-500 whitespace-nowrap">ID</th>
              <th className="py-3 px-4 font-semibold text-xs uppercase tracking-widest text-slate-500 whitespace-nowrap">Agent</th>
              <th className="py-3 px-4 font-semibold text-xs uppercase tracking-widest text-slate-500 whitespace-nowrap">Customer</th>
              <th className="py-3 px-4 font-semibold text-xs uppercase tracking-widest text-slate-500 whitespace-nowrap">Lang</th>
              <th className="py-3 px-4 font-semibold text-xs uppercase tracking-widest text-slate-500 whitespace-nowrap">Status</th>
              <th className="py-3 px-4 font-semibold text-xs uppercase tracking-widest text-slate-500 whitespace-nowrap">Sentiment</th>
              <th className="py-3 px-4 font-semibold text-xs uppercase tracking-widest text-slate-500 whitespace-nowrap">Live KPI</th>
              <th className="py-3 px-4 font-semibold text-xs uppercase tracking-widest text-slate-500 text-right whitespace-nowrap">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((conversation) => (
              <tr key={conversation.id} className="hover:bg-pink-50/50 transition-colors group">
                <td className="py-3 px-4 text-sm font-medium text-slate-900">#{conversation.id}</td>
                <td className="py-3 px-4 text-sm font-medium text-slate-700">{conversation.employee?.name}</td>
                <td className="py-3 px-4 text-sm text-slate-600">{conversation.customer?.name}</td>
                <td className="py-3 px-4 text-sm">
                   <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-md uppercase text-xs font-bold border border-slate-200">
                      {conversation.language}
                   </span>
                </td>
                <td className="py-3 px-4 text-sm">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      conversation.status === 'analyzed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                      {conversation.status}
                  </span>
                </td>
                <td className="py-3 px-4 text-sm">
                    {conversation.analysis_result?.sentimentLabel ? (
                        <span className="flex items-center gap-1.5 font-medium text-slate-700">
                             {conversation.analysis_result.sentimentLabel === 'Positive' && <span className="text-emerald-500">↑</span>}
                             {conversation.analysis_result.sentimentLabel === 'Negative' && <span className="text-rose-500">↓</span>}
                             {conversation.analysis_result.sentimentLabel === 'Neutral' && <span className="text-slate-400">-</span>}
                             {conversation.analysis_result.sentimentLabel}
                        </span>
                    ) : (
                        <span className="text-slate-400 italic text-xs">Awaiting...</span>
                    )}
                </td>
                <td className="py-3 px-4 text-sm">
                  {conversation.performance_scores?.length ? (
                    <span className="font-bold text-pink-700 bg-pink-50 px-2 py-1 rounded-md">
                        {Number(conversation.performance_scores[conversation.performance_scores.length - 1].kpiScore).toFixed(1)}
                    </span>
                  ) : (
                    <span className="text-slate-300">-</span>
                  )}
                </td>
                <td className="py-3 px-4 text-sm text-right whitespace-nowrap">
                  <div className="flex justify-end gap-2 opacity-100 lg:opacity-60 lg:group-hover:opacity-100 transition-opacity">
                      <button 
                         onClick={() => onAnalyze(conversation.id)}
                         className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 hover:text-pink-600 hover:border-pink-300 rounded shadow-sm text-xs font-semibold transition-all"
                      >
                         NLP Scan
                      </button>
                      <button 
                         onClick={() => onPredict(conversation.employee_id)}
                         disabled={!conversation.employee_id}
                         className={`px-3 py-1.5 rounded shadow-sm text-xs font-bold transition-all ${
                            !conversation.employee_id 
                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200' 
                            : 'bg-pink-50 border border-pink-200 text-pink-700 hover:bg-pink-600 hover:text-white'
                         }`}
                         title={!conversation.employee_id ? "Assign an agent first to run forecast" : "Run ML Forecast"}
                      >
                         Forecast
                      </button>
                  </div>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan="8" className="py-8 text-center text-slate-400 italic">No conversations available in the database.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
