import React, { useState, useMemo, useEffect } from 'react';
import { Users, UserPlus, Search, Edit2, Trash2, Mail, Shield, ShieldAlert, Award, X, Save, AlertTriangle } from 'lucide-react';
import { fetchTeam, createTeamMember, updateTeamMember, deleteTeamMember, fetchGames } from '../services/api';

function AgentModal({ agent, games, onClose, onSave }) {
  const isEdit = !!agent?.id;
  const [form, setForm] = useState({
    name: agent?.name || '',
    email: agent?.email || '',
    team: agent?.team || 'Care Team A',
    role: agent?.role || 'customer_care_agent',
    status: agent?.status || 'Active',
    password: agent?.password || '',
    supportsAllGames: Boolean(agent?.supportsAllGames),
    allowedGameIds: Array.isArray(agent?.allowedGameIds) ? agent.allowedGameIds.map(Number) : [],
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await onSave(form);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-slate-200 p-0 relative" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-900">{isEdit ? 'Edit Agent' : 'Invite New Agent'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-500 hover:text-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 bg-rose-50 text-rose-600 border border-rose-200 text-sm font-medium px-4 py-3 rounded-xl flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="form-label block mb-1.5">Full Name *</label>
              <input
                type="text"
                required
                minLength={2}
                className="form-input w-full bg-slate-50"
                placeholder="e.g. John Doe"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div>
              <label className="form-label block mb-1.5">Email</label>
              <input
                type="email"
                className="form-input w-full bg-slate-50"
                placeholder="john.doe@falcongames.com"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="form-label block mb-1.5">Role</label>
              <select
                className="form-input w-full bg-slate-50"
                value={form.role}
                onChange={e => setForm({ ...form, role: e.target.value })}
              >
                <option value="customer_care_agent">Customer Care Agent</option>
                <option value="leader">Leader</option>
              </select>
            </div>
            <div>
              <label className="form-label block mb-1.5">Account Status</label>
              <select
                className={`form-input w-full font-bold ${
                   form.status === 'Active' ? 'text-emerald-600 bg-emerald-50 border-emerald-100' :
                   form.status === 'Warning' ? 'text-amber-600 bg-amber-50 border-amber-100' :
                   'text-slate-600 bg-slate-100 border-slate-200'
                }`}
                value={form.status}
                onChange={e => setForm({ ...form, status: e.target.value })}
              >
                <option value="Active">Active (Default)</option>
                <option value="Warning">Warning (Manual)</option>
                <option value="Lock">Lock / Suspended</option>
              </select>
            </div>
            <div>
              <label className="form-label block mb-1.5">Password {isEdit ? '(leave blank to keep current)' : '*'}</label>
              <input
                type="text"
                className="form-input w-full bg-slate-50"
                placeholder="123456"
                required={!isEdit}
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
              />
            </div>

            <div className="sm:col-span-2">
              <label className="form-label block mb-2">Game Support Permissions</label>

              <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                <input
                  type="checkbox"
                  checked={form.supportsAllGames}
                  onChange={(e) => setForm({ ...form, supportsAllGames: e.target.checked })}
                />
                Supports all games
              </label>

              {!form.supportsAllGames && (
                <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-xl bg-slate-50 p-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {games.length === 0 && <p className="text-xs text-slate-500">No games found.</p>}
                  {games.map((game) => {
                    const checked = form.allowedGameIds.includes(Number(game.id));
                    return (
                      <label key={game.id} className="inline-flex items-center gap-2 text-xs text-slate-700">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => {
                            const gameId = Number(game.id);
                            setForm((prev) => ({
                              ...prev,
                              allowedGameIds: e.target.checked
                                ? Array.from(new Set([...prev.allowedGameIds, gameId]))
                                : prev.allowedGameIds.filter((id) => id !== gameId)
                            }));
                          }}
                        />
                        {game.name}
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-2">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
              {saving ? (
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
              ) : <Save className="w-4 h-4" />}
              {isEdit ? 'Update Agent' : 'Create Agent'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DeleteConfirmModal({ agent, onClose, onConfirm }) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await onConfirm();
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 p-6" onClick={e => e.stopPropagation()}>
        <div className="flex flex-col items-center text-center gap-4">
          <div className="w-14 h-14 rounded-full bg-rose-100 flex items-center justify-center text-rose-600">
            <Trash2 className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Delete Agent</h2>
          <p className="text-slate-500">Are you sure you want to remove <strong className="text-slate-800">{agent.name}</strong> from the system? This will also remove their conversations and performance data.</p>
          <div className="flex gap-3 w-full mt-2">
            <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button onClick={handleDelete} disabled={deleting} className="flex-1 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-md shadow-rose-500/20">
              {deleting ? (
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
              ) : <Trash2 className="w-4 h-4" />}
              Delete Permanently
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TeamManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [team, setTeam] = useState([]);
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editAgent, setEditAgent] = useState(null);
  const [deleteAgent, setDeleteAgent] = useState(null);
  const [notice, setNotice] = useState("");
  
  const [filterRole, setFilterRole] = useState("All Roles");
  const [filterStatus, setFilterStatus] = useState("All Status");

  async function loadTeam() {
    try {
      const data = await fetchTeam();
      setTeam(data);
    } catch (error) {
      console.error("Failed to load team data", error);
    } finally {
      setLoading(false);
    }
  }

  async function loadGames() {
    try {
      const data = await fetchGames();
      setGames(data || []);
    } catch (error) {
      console.error("Failed to load games", error);
    }
  }

  useEffect(() => {
    loadTeam();
    loadGames();
  }, []);

  const roles = useMemo(() => ["All Roles", ...new Set(team.map(a => a.role))], [team]);
  const statuses = useMemo(() => ["All Status", ...new Set(team.map(a => a.status))], [team]);

  const filteredTeam = team.filter(agent => {
    const matchesSearch = agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (agent.email || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = filterRole === "All Roles" || agent.role === filterRole;
    const matchesStatus = filterStatus === "All Status" || agent.status === filterStatus;

    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleCreate = async (form) => {
    await createTeamMember(form);
    setNotice("Agent created successfully");
    setTimeout(() => setNotice(""), 3000);
    await loadTeam();
  };

  const handleUpdate = async (form) => {
    await updateTeamMember(editAgent.id, form);
    setNotice("Agent updated successfully");
    setTimeout(() => setNotice(""), 3000);
    await loadTeam();
  };

  const handleDelete = async () => {
    await deleteTeamMember(deleteAgent.id);
    setNotice("Agent removed successfully");
    setTimeout(() => setNotice(""), 3000);
    await loadTeam();
  };

  return (
    <div className="w-full flex flex-col gap-6 animate-fade-in pb-10 min-w-0">
      <header className="bg-white border border-slate-200 rounded-3xl p-6 lg:p-8 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 shadow-sm">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
             <div className="p-2.5 bg-indigo-100/50 rounded-xl text-indigo-600">
                <Users className="w-7 h-7" />
             </div>
             Team Directory
          </h1>
          <p className="text-slate-500 mt-2">Manage customer support agents, organizational structure, and roles.</p>
        </div>
        <button className="btn-primary flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/20 py-3" onClick={() => { setEditAgent(null); setShowModal(true); }}>
           <UserPlus className="w-5 h-5" />
           Add Agent
        </button>
      </header>

      {notice && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl flex items-center gap-3 font-medium shadow-sm animate-fade-in">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
          {notice}
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden min-w-0">
         <div className="p-6 border-b border-slate-100 flex flex-col gap-5 bg-slate-50/30">
             <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
               <div className="relative w-full lg:w-96">
                  <Search className="w-5 h-5 absolute left-3 top-3 text-slate-400" />
                  <input
                     type="text"
                     placeholder="Search names, emails..."
                     className="form-input w-full pl-10 bg-white border-slate-200"
                     value={searchTerm}
                     onChange={(e) => setSearchTerm(e.target.value)}
                  />
               </div>
               <span className="text-sm text-slate-500 font-bold bg-white px-3 py-1 rounded-full border border-slate-200 shadow-sm">
                 {filteredTeam.length} Result{filteredTeam.length !== 1 ? 's' : ''}
               </span>
             </div>

             <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <select 
                  className="form-input bg-white text-sm font-medium border-slate-200"
                  value={filterRole}
                  onChange={(e) => setFilterRole(e.target.value)}
                >
                  {roles.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1).replace('_', ' ')}</option>)}
                </select>

                <select 
                  className="form-input bg-white text-sm font-medium border-slate-200"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  {statuses.map(s => <option key={s}>{s}</option>)}
                </select>
             </div>
         </div>

         <div className="overflow-x-auto">
             <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                   <tr>
                     <th className="px-6 py-4 font-bold border-b border-slate-200">Agent Profile</th>
                     <th className="px-6 py-4 font-bold border-b border-slate-200">Status</th>
                     <th className="px-6 py-4 font-bold border-b border-slate-200">Avg CSAT</th>
                     <th className="px-6 py-4 font-bold border-b border-slate-200 text-right">Actions</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                   {loading ? (
                       <tr>
                           <td colSpan="5" className="px-6 py-12 text-center text-slate-500">Loading team...</td>
                       </tr>
                   ) : filteredTeam.length === 0 ? (
                       <tr>
                           <td colSpan="5" className="px-6 py-12 text-center text-slate-500">No agents found matching your search.</td>
                       </tr>
                   ) : filteredTeam.map(agent => (
                       <tr key={agent.id} className="hover:bg-slate-50 transition-colors">
                           <td className="px-6 py-4">
                               <div className="flex items-center gap-3">
                                   <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold">
                                       {agent.name.charAt(0)}
                                   </div>
                                   <div>
                                       <p className="font-bold text-slate-900">{agent.name}</p>
                                       <p className="text-xs text-slate-500 flex items-center gap-1"><Mail className="w-3 h-3"/> {agent.email}</p>
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
                               <div className="flex items-center gap-2">
                                   <Award className={`w-4 h-4 ${agent.csat > 90 ? 'text-emerald-500' : 'text-amber-500'}`} />
                                   <span className="font-bold text-slate-700">{agent.csat}%</span>
                               </div>
                           </td>
                           <td className="px-6 py-4 text-right">
                               <div className="flex items-center justify-end gap-2">
                                   <button
                                     onClick={() => { setEditAgent(agent); setShowModal(true); }}
                                     className="p-2 text-slate-400 hover:text-pink-600 hover:bg-pink-50 rounded-lg transition-colors"
                                     title="Edit agent"
                                   >
                                      <Edit2 className="w-4 h-4" />
                                   </button>
                                   <button
                                     onClick={() => setDeleteAgent(agent)}
                                     className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                     title="Delete agent"
                                   >
                                      <Trash2 className="w-4 h-4" />
                                   </button>
                               </div>
                           </td>
                       </tr>
                   ))}
                </tbody>
             </table>
         </div>
      </div>

      {/* Create / Edit Modal */}
      {showModal && (
        <AgentModal
          agent={editAgent}
          games={games}
          onClose={() => { setShowModal(false); setEditAgent(null); }}
          onSave={editAgent ? handleUpdate : handleCreate}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteAgent && (
        <DeleteConfirmModal
          agent={deleteAgent}
          onClose={() => setDeleteAgent(null)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}
