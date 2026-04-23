import { useState, useEffect } from 'react';
import { UserPlus, Search, Shield, User as UserIcon, HeadphonesIcon, CheckCircle2, XCircle, Clock } from 'lucide-react';

interface MockUser {
  id: number;
  name: string;
  username: string;
  email?: string;
  phone?: string;
  role: string;
  agentType?: string;
  status?: string;
}

const Users = () => {
  const [users, setUsers] = useState<MockUser[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('ALL');

  const loadUsers = () => {
    const mockUsers: MockUser[] = JSON.parse(localStorage.getItem('mock_users') || '[]');
    setUsers(mockUsers);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleApprove = (userId: number) => {
    const mockUsers: MockUser[] = JSON.parse(localStorage.getItem('mock_users') || '[]');
    const updated = mockUsers.map(u => u.id === userId ? { ...u, status: 'ACTIVE' } : u);
    localStorage.setItem('mock_users', JSON.stringify(updated));
    loadUsers();
  };

  const handleReject = (userId: number) => {
    const mockUsers: MockUser[] = JSON.parse(localStorage.getItem('mock_users') || '[]');
    const updated = mockUsers.map(u => u.id === userId ? { ...u, status: 'INACTIVE' } : u);
    localStorage.setItem('mock_users', JSON.stringify(updated));
    loadUsers();
  };

  const handleDelete = (userId: number) => {
    const mockUsers: MockUser[] = JSON.parse(localStorage.getItem('mock_users') || '[]');
    const updated = mockUsers.filter(u => u.id !== userId);
    localStorage.setItem('mock_users', JSON.stringify(updated));
    loadUsers();
  };

  const filteredUsers = users.filter(u => {
    const matchSearch =
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchRole = filterRole === 'ALL' || u.role === filterRole;
    return matchSearch && matchRole;
  });

  const pendingCount = users.filter(u => u.status === 'PENDING').length;

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'ADMIN': return <Shield size={16} className="text-purple-500" />;
      case 'AGENT': return <HeadphonesIcon size={16} className="text-emerald-500" />;
      case 'CUSTOMER': return <UserIcon size={16} className="text-blue-500" />;
      default: return <UserIcon size={16} />;
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
            <span className="text-xs font-semibold text-emerald-600">Active</span>
          </div>
        );
      case 'PENDING':
        return (
          <div className="flex items-center gap-1.5">
            <Clock size={12} className="text-amber-500" />
            <span className="text-xs font-semibold text-amber-600">Pending</span>
          </div>
        );
      case 'INACTIVE':
        return (
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-slate-400"></div>
            <span className="text-xs font-semibold text-slate-500">Inactive</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
            <span className="text-xs font-semibold text-emerald-600">Active</span>
          </div>
        );
    }
  };

  const getRoleBadge = (role: string, agentType?: string) => {
    const base = "px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border";
    switch (role) {
      case 'ADMIN': return <span className={`${base} bg-purple-100 text-purple-700 border-purple-200`}>ADMIN</span>;
      case 'AGENT': return (
        <div className="flex gap-1 flex-wrap">
          <span className={`${base} bg-emerald-100 text-emerald-700 border-emerald-200`}>AGENT</span>
          {agentType && <span className={`${base} bg-slate-100 text-slate-600 border-slate-200`}>{agentType}</span>}
        </div>
      );
      case 'CUSTOMER': return <span className={`${base} bg-blue-100 text-blue-700 border-blue-200`}>CUSTOMER</span>;
      default: return null;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      {/* Pending Alert */}
      {pendingCount > 0 && (
        <div className="p-5 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <Clock className="text-amber-500 shrink-0" size={24} />
            <div>
              <p className="font-bold text-amber-800">
                {pendingCount} agent registration{pendingCount > 1 ? 's' : ''} awaiting your approval
              </p>
              <p className="text-sm text-amber-600 mt-0.5">Review and approve below to grant workspace access.</p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-800">User Management</h2>
            <p className="text-sm text-slate-500">Manage roles, access control, and agent approvals</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/50 outline-none w-full sm:w-60 text-slate-800"
              />
            </div>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="py-2.5 px-4 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:ring-2 focus:ring-blue-500/50 outline-none cursor-pointer"
            >
              <option value="ALL">All Roles</option>
              <option value="ADMIN">Admin</option>
              <option value="AGENT">Agent</option>
              <option value="CUSTOMER">Customer</option>
            </select>
            <button className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors shadow-sm">
              <UserPlus size={16} />
              <span className="hidden sm:inline">Add User</span>
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-semibold">
                <th className="p-4 pl-6">User</th>
                <th className="p-4">Contact</th>
                <th className="p-4">Role</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right pr-6">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-slate-400">
                    <UserIcon size={32} className="mx-auto mb-3 opacity-20" />
                    <p>No users found.</p>
                  </td>
                </tr>
              ) : filteredUsers.map((u) => (
                <tr key={u.id} className={`hover:bg-slate-50/50 transition-colors ${u.status === 'PENDING' ? 'bg-amber-50/30' : ''}`}>
                  <td className="p-4 pl-6">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center shrink-0 font-bold text-slate-600">
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-800">{u.name}</div>
                        <div className="text-xs text-slate-500">@{u.username}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="text-sm text-slate-600">{u.email || '—'}</div>
                    {(u as any).phone && <div className="text-xs text-slate-400">{(u as any).phone}</div>}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div className="p-1 bg-slate-100 rounded">{getRoleIcon(u.role)}</div>
                      {getRoleBadge(u.role, u.agentType)}
                    </div>
                  </td>
                  <td className="p-4">
                    {getStatusBadge(u.status)}
                  </td>
                  <td className="p-4 text-right pr-6">
                    <div className="flex items-center justify-end gap-2">
                      {u.status === 'PENDING' && (
                        <>
                          <button
                            onClick={() => handleApprove(u.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 rounded-lg text-xs font-bold transition-colors"
                          >
                            <CheckCircle2 size={13} />
                            Approve
                          </button>
                          <button
                            onClick={() => handleReject(u.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 rounded-lg text-xs font-bold transition-colors"
                          >
                            <XCircle size={13} />
                            Reject
                          </button>
                        </>
                      )}
                      {u.status !== 'PENDING' && u.role !== 'ADMIN' && (
                        <button
                          onClick={() => handleDelete(u.id)}
                          className="px-3 py-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 rounded-lg text-xs font-semibold transition-colors"
                        >
                          Remove
                        </button>
                      )}
                      {u.role === 'ADMIN' && (
                        <span className="text-xs text-slate-400 italic">System Account</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <p className="text-sm text-slate-500">{filteredUsers.length} of {users.length} users shown</p>
          <p className="text-xs text-slate-400">Data stored in localStorage (mock mode)</p>
        </div>
      </div>
    </div>
  );
};

export default Users;
