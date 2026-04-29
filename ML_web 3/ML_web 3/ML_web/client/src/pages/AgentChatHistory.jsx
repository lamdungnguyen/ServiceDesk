import React, { useState, useEffect } from 'react';
import { fetchConversationsWithFilters } from '../services/api';
import { MessageSquare, Loader2, Clock, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AgentChatHistory() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchConversationsWithFilters({ employeeId: user?.id });
        setConversations(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    if (user?.id) {
      load();
    }
  }, [user?.id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in p-4 lg:p-6 bg-slate-50 min-h-full">
      <header className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <p className="text-xs uppercase tracking-widest font-bold text-emerald-600 mb-1">Support Portal</p>
        <h1 className="text-2xl font-extrabold text-slate-900">Chat History</h1>
        <p className="text-slate-500 text-sm mt-1">Review your handled conversations only.</p>
      </header>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
            <tr>
              <th className="px-6 py-4 font-bold border-b border-slate-200">#ID</th>
              <th className="px-6 py-4 font-bold border-b border-slate-200">Customer</th>
              <th className="px-6 py-4 font-bold border-b border-slate-200">Employee</th>
              <th className="px-6 py-4 font-bold border-b border-slate-200">Status</th>
              <th className="px-6 py-4 font-bold border-b border-slate-200">Language</th>
              <th className="px-6 py-4 font-bold border-b border-slate-200">Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {conversations.map(conv => (
              <tr key={conv.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-3 text-sm font-mono text-slate-500">#{conv.id}</td>
                <td className="px-6 py-3 text-sm font-semibold text-slate-900">{conv.customer?.name || 'Unknown'}</td>
                <td className="px-6 py-3 text-sm text-slate-700">{conv.employee?.name || '—'}</td>
                <td className="px-6 py-3">
                  <span className={`px-2 py-1 rounded-md text-xs font-bold inline-flex items-center gap-1 ${
                    conv.status === 'resolved' ? 'bg-emerald-100 text-emerald-700' :
                    conv.status === 'open' ? 'bg-amber-100 text-amber-700' :
                    'bg-slate-100 text-slate-600'
                  }`}>
                    {conv.status === 'resolved' ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                    {conv.status}
                  </span>
                </td>
                <td className="px-6 py-3 text-sm text-slate-500">{conv.language}</td>
                <td className="px-6 py-3 text-xs text-slate-500">
                  {conv.startedAt ? new Date(conv.startedAt).toLocaleString('en-US') : '—'}
                </td>
              </tr>
            ))}
            {conversations.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                  <MessageSquare className="w-10 h-10 mx-auto mb-3 text-slate-300" />
                  No conversations found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
