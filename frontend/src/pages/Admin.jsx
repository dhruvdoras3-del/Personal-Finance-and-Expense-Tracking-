import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  ShieldAlert, 
  Users, 
  Activity, 
  ArrowLeftRight, 
  TrendingUp, 
  Trash2, 
  UserX, 
  CheckCircle,
  Clock
} from 'lucide-react';

const Admin = () => {
  const [metrics, setMetrics] = useState({ totalUsers: 0, activeUsers: 0, totalTransactions: 0, totalVolume: 0 });
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const metricsRes = await axios.get('/admin/metrics');
      const usersRes = await axios.get('/admin/users');
      setMetrics(metricsRes.data);
      setUsers(usersRes.data);
    } catch (err) {
      console.error('Failed to load admin dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await axios.put(`/admin/users/${userId}/role`, { role: newRole });
      fetchAdminData();
    } catch (err) {
      console.error('Failed to update user role:', err);
      alert(err.response?.data?.message || 'Error updating user role.');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('WARNING: Deleting this user will purge all of their transactions, budgets, savings goals, reminders, and wealth trackers. This cannot be undone. Proceed?')) return;
    try {
      await axios.delete(`/admin/users/${userId}`);
      fetchAdminData();
    } catch (err) {
      console.error('Failed to delete user:', err);
      alert(err.response?.data?.message || 'Error deleting user.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Title block */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-glass-gradient glass-panel p-6">
        <div>
          <h1 className="text-xl font-bold text-white tracking-wide flex items-center gap-2">
            <ShieldAlert size={20} className="text-brand-danger" /> Admin Panel
          </h1>
          <p className="text-xs text-dark-muted mt-1">Platform analytics and administrative control panel.</p>
        </div>
      </div>

      {loading ? (
        <div className="py-24 text-center text-xs text-dark-muted glass-panel">Fetching administrative dashboard...</div>
      ) : (
        <>
          {/* KPI metrics grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="glass-panel p-5 flex items-center justify-between glass-panel-hover">
              <div className="space-y-1 text-left">
                <span className="text-[10px] font-semibold text-dark-muted uppercase tracking-wider">Total Platform Users</span>
                <h3 className="text-2xl font-extrabold text-white tracking-tight">{metrics.totalUsers}</h3>
                <span className="text-[9px] text-dark-muted">Registered in database</span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center text-brand-secondary">
                <Users size={20} />
              </div>
            </div>

            <div className="glass-panel p-5 flex items-center justify-between glass-panel-hover">
              <div className="space-y-1 text-left">
                <span className="text-[10px] font-semibold text-dark-muted uppercase tracking-wider">Total Transactions</span>
                <h3 className="text-2xl font-extrabold text-white tracking-tight">{metrics.totalTransactions}</h3>
                <span className="text-[9px] text-dark-muted">Aggregated index entries</span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-brand-secondary/10 border border-brand-secondary/20 flex items-center justify-center text-brand-secondary">
                <ArrowLeftRight size={20} />
              </div>
            </div>

            <div className="glass-panel p-5 flex items-center justify-between glass-panel-hover">
              <div className="space-y-1 text-left">
                <span className="text-[10px] font-semibold text-dark-muted uppercase tracking-wider">Total Platform Flow</span>
                <h3 className="text-2xl font-extrabold text-brand-success tracking-tight">₹{Math.round(metrics.totalVolume).toLocaleString()}</h3>
                <span className="text-[9px] text-dark-muted">Summed transaction volume</span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-brand-success/10 border border-brand-success/20 flex items-center justify-center text-brand-success">
                <TrendingUp size={20} />
              </div>
            </div>

            <div className="glass-panel p-5 flex items-center justify-between glass-panel-hover">
              <div className="space-y-1 text-left">
                <span className="text-[10px] font-semibold text-dark-muted uppercase tracking-wider">Platform Status</span>
                <h3 className="text-2xl font-extrabold text-brand-secondary tracking-tight">Healthy</h3>
                <span className="text-[9px] text-dark-muted">API Online & Cron active</span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-brand-secondary/10 border border-brand-secondary/20 flex items-center justify-center text-brand-secondary">
                <CheckCircle size={20} />
              </div>
            </div>
          </div>

          {/* User management list */}
          <div className="glass-panel p-5 overflow-x-auto text-left">
            <h3 className="text-sm font-bold text-white mb-4">User Accounts</h3>

            {users.length === 0 ? (
              <div className="py-12 text-center text-xs text-dark-muted">No user accounts found.</div>
            ) : (
              <table className="w-full text-left text-xs text-dark-text min-w-[700px]">
                <thead>
                  <tr className="border-b border-dark-border/40 text-dark-muted font-semibold">
                    <th className="py-2.5">User Details</th>
                    <th className="py-2.5">ID</th>
                    <th className="py-2.5">Registered Date</th>
                    <th className="py-2.5 text-center">Health Score</th>
                    <th className="py-2.5">Role Authorization</th>
                    <th className="py-2.5 text-center">Administrative Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-b border-dark-border/10 last:border-0 hover:bg-white/5 transition-colors">
                      <td className="py-3">
                        <h5 className="font-bold text-white">{u.name}</h5>
                        <span className="text-[10px] text-dark-muted block mt-0.5">{u.email}</span>
                      </td>
                      <td className="py-3 text-[10px] font-mono text-dark-muted">{u.id}</td>
                      <td className="py-3 text-dark-muted">
                        <span className="flex items-center gap-1">
                          <Clock size={12} /> {new Date(u.createdAt).toISOString().split('T')[0]}
                        </span>
                      </td>
                      <td className="py-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                          u.healthScore >= 80 
                            ? 'bg-brand-success/10 border-brand-success/35 text-brand-success' 
                            : u.healthScore >= 50 
                              ? 'bg-brand-warning/10 border-brand-warning/35 text-brand-warning' 
                              : 'bg-brand-danger/10 border-brand-danger/35 text-brand-danger'
                        }`}>
                          {u.healthScore || 70}
                        </span>
                      </td>
                      <td className="py-3">
                        <select
                          value={u.role}
                          onChange={(e) => handleRoleChange(u.id, e.target.value)}
                          className="glass-input py-1.5 px-3 bg-dark-bg text-[10px] font-bold"
                        >
                          <option value="user">User</option>
                          <option value="admin">Administrator</option>
                          <option value="blocked">Blocked / Restricted</option>
                        </select>
                      </td>
                      <td className="py-3">
                        <div className="flex justify-center">
                          <button
                            onClick={() => handleDeleteUser(u.id)}
                            className="glass-btn-danger py-1 px-3 text-[9px] flex items-center gap-1 cursor-pointer font-bold uppercase tracking-wider"
                          >
                            <UserX size={12} /> Delete User
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Admin;
