import { useState, useEffect } from 'react';
import { fetchApi } from '../lib/api';
import { Shield, Unlock, RefreshCw, CheckCircle2, Users, CreditCard, Activity, BarChart2, DollarSign } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useAuth } from '../contexts/AuthContext';

type Tab = 'overview' | 'users' | 'payments' | 'referrals' | 'audit';

export default function Admin() {
  const { user } = useAuth();
  const isAdmin = user?.email === 'mohitboura342@gmail.com';

  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [password, setPassword] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError('');
    
    try {
      const results = await Promise.allSettled([
        fetchApi('/api/admin/stats').then(res => res.json()),
        fetchApi('/api/admin/users').then(res => res.json()),
        fetchApi('/api/admin/payments').then(res => res.json()),
        fetchApi('/api/admin/audit').then(res => res.json())
      ]);

      const [statsRes, usersRes, paymentsRes, auditRes] = results;

      if (statsRes.status === 'fulfilled' && statsRes.value.error?.includes('Forbidden')) {
        throw new Error('You do not have permission to access the admin dashboard.');
      }

      if (statsRes.status === 'fulfilled' && !statsRes.value.error) {
        setStats(statsRes.value);
      } else {
        console.warn("Failed to load stats:", statsRes.status === 'fulfilled' ? statsRes.value.error : 'Network Error');
        setStats({
          totalUsers: 0, aiUnlocked: 0, lockedUsers: 0,
          totalRevenue: 0, successfulPayments: 0, referralRewards: 0,
          pendingPayments: 0, failedPayments: 0
        });
      }

      if (usersRes.status === 'fulfilled' && !usersRes.value.error) {
        setUsers(usersRes.value);
      } else {
        console.warn("Failed to load users:", usersRes.status === 'fulfilled' ? usersRes.value.error : 'Network Error');
        setUsers([]);
      }

      if (paymentsRes.status === 'fulfilled' && !paymentsRes.value.error) {
        setPayments(paymentsRes.value);
      } else {
        console.warn("Failed to load payments:", paymentsRes.status === 'fulfilled' ? paymentsRes.value.error : 'Network Error');
        setPayments([]);
      }

      if (auditRes.status === 'fulfilled' && !auditRes.value.error) {
        setAuditLogs(auditRes.value);
      } else {
        console.warn("Failed to load audit logs:", auditRes.status === 'fulfilled' ? auditRes.value.error : 'Network Error');
        setAuditLogs([]);
      }
    } catch (e: any) {
      setError(e.message || 'An unexpected error occurred loading admin data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isUnlocked) {
      loadData();
    }
  }, [isUnlocked]);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'MOH.123123') {
      setIsUnlocked(true);
    } else {
      alert('Incorrect password');
    }
  };

  const handleManualUnlock = async (uid: string) => {
    if (!confirm('Are you sure you want to manually unlock AI Adviser for this user?')) return;
    try {
      const res = await fetchApi('/api/admin/unlock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid })
      });
      if (!res.ok) throw new Error('Unlock failed');
      loadData();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleApprovePayment = async (paymentId: string) => {
    if (!confirm('Approve this payment and unlock AI Adviser?')) return;
    try {
      const res = await fetchApi('/api/admin/payments/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId })
      });
      if (!res.ok) throw new Error('Approval failed');
      loadData();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleRejectPayment = async (paymentId: string) => {
    if (!confirm('Reject this payment?')) return;
    try {
      const res = await fetchApi('/api/admin/payments/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId })
      });
      if (!res.ok) throw new Error('Rejection failed');
      loadData();
    } catch (e: any) {
      alert(e.message);
    }
  };

  if (!isAdmin) {
    return (
      <div className="max-w-xl mx-auto mt-12 text-center text-red-400 p-8 border border-red-500/50 bg-[#151B2B] shadow-lg shadow-red-900/10 rounded-2xl animate-in fade-in zoom-in-95">
        <Shield className="w-12 h-12 mx-auto mb-4 text-red-500 opacity-80" />
        <h3 className="text-lg font-bold mb-2">Access Denied</h3>
        <p className="text-sm text-red-300/80 mb-6">You do not have permission to view this page.</p>
        <button 
          onClick={() => window.location.href = '/'}
          className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors"
        >
          Return to App
        </button>
      </div>
    );
  }

  if (!isUnlocked) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="bg-[#151B2B] border border-slate-800 p-8 rounded-2xl shadow-xl max-w-md w-full animate-in zoom-in-95">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-indigo-500/10 rounded-full flex items-center justify-center">
              <Shield className="w-8 h-8 text-indigo-500" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-center text-white mb-2">Admin Access</h2>
          <p className="text-slate-400 text-center mb-8 text-sm">Please enter the admin password to continue.</p>
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password..."
                className="w-full bg-[#0B0F1A] border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                autoFocus
              />
            </div>
            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 rounded-xl transition-colors"
            >
              Access Dashboard
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (loading && !stats) return (
    <div className="text-slate-400 p-8 flex flex-col items-center justify-center gap-4 h-64">
      <RefreshCw className="w-8 h-8 animate-spin text-indigo-500" />
      <span className="text-sm font-medium">Loading admin dashboard securely...</span>
    </div>
  );
  
  if (error) return (
    <div className="max-w-xl mx-auto mt-12 text-center text-red-400 p-8 border border-red-500/50 bg-[#151B2B] shadow-lg shadow-red-900/10 rounded-2xl animate-in fade-in zoom-in-95">
      <Shield className="w-12 h-12 mx-auto mb-4 text-red-500 opacity-80" />
      <h3 className="text-lg font-bold mb-2">Access Denied</h3>
      <p className="text-sm text-red-300/80 mb-6">{error}</p>
      <button 
        onClick={() => window.location.href = '/'}
        className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors"
      >
        Return to App
      </button>
    </div>
  );

  const pieData = stats ? [
    { name: 'Unlocked', value: stats.aiUnlocked },
    { name: 'Locked', value: stats.lockedUsers }
  ] : [];
  const COLORS = ['#10b981', '#334155'];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <header className="flex justify-between items-center bg-[#151B2B] p-6 rounded-2xl border border-slate-800 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 p-16 bg-indigo-500/5 rounded-full blur-3xl" />
        <div className="relative z-10">
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <Shield className="w-8 h-8 text-indigo-500" /> Admin Dashboard
          </h1>
          <p className="text-slate-400 mt-1 ml-11">Enterprise user & payment management</p>
        </div>
        <button 
          onClick={loadData}
          className="relative z-10 p-2.5 bg-slate-800 rounded-xl hover:bg-slate-700 transition-colors border border-slate-700"
        >
          <RefreshCw className={`w-5 h-5 text-slate-300 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </header>

      {/* Tabs */}
      <div className="flex space-x-1 border-b border-slate-800">
        {[
          { id: 'overview', label: 'Overview', icon: BarChart2 },
          { id: 'users', label: 'Users', icon: Users },
          { id: 'payments', label: 'Payments', icon: CreditCard },
          { id: 'referrals', label: 'Referrals', icon: Activity },
          { id: 'audit', label: 'Audit Log', icon: Shield },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as Tab)}
            className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors border-b-2 ${
              activeTab === tab.id
                ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-300 hover:bg-slate-800/30'
            }`}
          >
            <tab.icon className="w-4 h-4" /> {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && stats && (
        <div className="space-y-6 animate-in fade-in">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#151B2B] border border-slate-800 p-6 rounded-2xl shadow-lg">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-indigo-500/10 rounded-lg">
                  <Users className="w-5 h-5 text-indigo-400" />
                </div>
                <h3 className="text-sm font-medium text-slate-400">Total Users</h3>
              </div>
              <div className="text-3xl font-bold text-white">{stats.totalUsers}</div>
            </div>
            
            <div className="bg-[#151B2B] border border-slate-800 p-6 rounded-2xl shadow-lg">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-emerald-500/10 rounded-lg">
                  <DollarSign className="w-5 h-5 text-emerald-400" />
                </div>
                <h3 className="text-sm font-medium text-slate-400">Total Revenue</h3>
              </div>
              <div className="text-3xl font-bold text-emerald-400">₹{stats.totalRevenue.toLocaleString()}</div>
            </div>

            <div className="bg-[#151B2B] border border-slate-800 p-6 rounded-2xl shadow-lg">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-purple-500/10 rounded-lg">
                  <Activity className="w-5 h-5 text-purple-400" />
                </div>
                <h3 className="text-sm font-medium text-slate-400">AI Unlocked</h3>
              </div>
              <div className="text-3xl font-bold text-white">{stats.aiUnlocked} <span className="text-sm font-normal text-slate-500">/ {stats.totalUsers}</span></div>
            </div>

            <div className="bg-[#151B2B] border border-slate-800 p-6 rounded-2xl shadow-lg">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <CheckCircle2 className="w-5 h-5 text-blue-400" />
                </div>
                <h3 className="text-sm font-medium text-slate-400">Referral Rewards</h3>
              </div>
              <div className="text-3xl font-bold text-blue-400">{stats.referralRewards}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-[#151B2B] border border-slate-800 p-6 rounded-2xl shadow-lg">
              <h3 className="text-lg font-bold text-white mb-6">AI Adviser Adoption</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '0.5rem', color: '#f8fafc' }}
                      itemStyle={{ color: '#f8fafc' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-6 mt-4">
                {pieData.map((entry, index) => (
                  <div key={entry.name} className="flex items-center gap-2 text-sm">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index] }} />
                    <span className="text-slate-400">{entry.name}</span>
                    <span className="font-bold text-white">{entry.value}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="bg-[#151B2B] border border-slate-800 p-6 rounded-2xl shadow-lg">
              <h3 className="text-lg font-bold text-white mb-6">Recent Activity</h3>
              <div className="space-y-4">
                {users.slice(0, 5).map(u => (
                  <div key={u.uid} className="flex justify-between items-center p-3 bg-slate-800/30 rounded-xl border border-slate-800/50">
                    <div>
                      <p className="text-sm font-medium text-white">{u.email || 'Anonymous'}</p>
                      <p className="text-xs text-slate-500">Joined {u.createdAt ? format(parseISO(u.createdAt), 'MMM d, yyyy') : 'Recently'}</p>
                    </div>
                    {u.adviserUnlocked && (
                      <span className="text-[10px] uppercase tracking-wider font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-md">Unlocked</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="bg-[#151B2B] border border-slate-800 rounded-2xl overflow-hidden shadow-lg animate-in fade-in">
          <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-800/20">
            <h3 className="font-semibold text-white">All Users ({users.length})</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-300">
              <thead className="text-xs text-slate-400 uppercase bg-slate-800/50 border-b border-slate-800">
                <tr>
                  <th className="px-6 py-4 font-semibold">User</th>
                  <th className="px-6 py-4 font-semibold">Referral Info</th>
                  <th className="px-6 py-4 font-semibold">AI Adviser</th>
                  <th className="px-6 py-4 font-semibold">Joined</th>
                  <th className="px-6 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.uid} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-white">{user.email || 'No email'}</div>
                      <div className="text-xs text-slate-500 font-mono mt-1">{user.uid.substring(0,12)}...</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-slate-500">Code:</span>
                        <span className="font-mono text-indigo-300 font-medium">{user.referralCode}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs mt-1">
                        <span className="text-slate-500">Referred:</span>
                        <span className="text-emerald-400 font-medium">{user.successfulReferrals || 0}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1 items-start">
                        {user.adviserUnlocked ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] uppercase font-bold tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <CheckCircle2 className="w-3 h-3" /> Unlocked
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] uppercase font-bold tracking-wider bg-slate-800 text-slate-400 border border-slate-700">
                            Locked
                          </span>
                        )}
                        {user.unlockSource && user.unlockSource !== 'None' && (
                          <span className="text-[10px] text-slate-500">via {user.unlockSource}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-400 whitespace-nowrap">
                      {user.createdAt ? format(parseISO(user.createdAt), 'MMM d, yyyy') : '-'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {!user.adviserUnlocked && (
                        <button
                          onClick={() => handleManualUnlock(user.uid)}
                          className="px-3 py-1.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 rounded-lg transition-colors inline-flex items-center gap-1.5 text-xs font-medium border border-purple-500/20"
                        >
                          <Unlock className="w-3.5 h-3.5" /> Unlock
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {users.length === 0 && !loading && (
              <div className="p-8 text-center text-slate-400">No users found.</div>
            )}
          </div>
        </div>
      )}

      {/* Payments Tab */}
      {activeTab === 'payments' && (
        <div className="bg-[#151B2B] border border-slate-800 rounded-2xl overflow-hidden shadow-lg animate-in fade-in">
          <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-800/20">
            <h3 className="font-semibold text-white">Payment History ({payments.length})</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-300">
              <thead className="text-xs text-slate-400 uppercase bg-slate-800/50 border-b border-slate-800">
                <tr>
                  <th className="px-6 py-4 font-semibold">Transaction ID / Order ID</th>
                  <th className="px-6 py-4 font-semibold">User</th>
                  <th className="px-6 py-4 font-semibold">Amount</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold">Date</th>
                  <th className="px-6 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment, idx) => (
                  <tr key={idx} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-mono text-white text-xs">{payment.id}</div>
                      <div className="text-[10px] text-slate-500 font-mono mt-1">{payment.orderId}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-300">{payment.email || 'Unknown'}</div>
                      <div className="text-[10px] text-slate-500 font-mono mt-1">{payment.uid?.substring(0,8)}...</div>
                    </td>
                    <td className="px-6 py-4 font-bold text-white">
                      ₹{payment.amount?.toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 rounded-md text-[10px] uppercase font-bold tracking-wider ${
                        payment.status === 'completed' 
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : payment.status === 'rejected'
                          ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                          : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                      }`}>
                        {payment.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-400 whitespace-nowrap">
                      {payment.date ? format(parseISO(payment.date), 'MMM d, yyyy HH:mm') : '-'}
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      {payment.status === 'pending' && (
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleApprovePayment(payment.id)}
                            className="px-3 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg text-xs font-medium transition-colors border border-emerald-500/20"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleRejectPayment(payment.id)}
                            className="px-3 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-xs font-medium transition-colors border border-red-500/20"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {payments.length === 0 && !loading && (
              <div className="p-8 text-center text-slate-400">No payments recorded.</div>
            )}
          </div>
        </div>
      )}
      {/* Referrals Tab */}
      {activeTab === 'referrals' && (
        <div className="bg-[#151B2B] border border-slate-800 rounded-2xl overflow-hidden shadow-lg animate-in fade-in">
          <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-800/20">
            <h3 className="font-semibold text-white">Referral Network</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-300">
              <thead className="text-xs text-slate-400 uppercase bg-slate-800/50 border-b border-slate-800">
                <tr>
                  <th className="px-6 py-4 font-semibold">User</th>
                  <th className="px-6 py-4 font-semibold">Referred By Code</th>
                  <th className="px-6 py-4 font-semibold">Joined</th>
                  <th className="px-6 py-4 font-semibold">Payment Status</th>
                  <th className="px-6 py-4 font-semibold">AI Adviser</th>
                </tr>
              </thead>
              <tbody>
                {users.filter(u => u.referredBy).map((user) => (
                  <tr key={user.uid} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-white">{user.email || 'Anonymous'}</div>
                      <div className="text-xs text-slate-500 font-mono mt-1">{user.uid.substring(0,8)}...</div>
                    </td>
                    <td className="px-6 py-4 font-mono text-indigo-300">
                      {user.referredBy}
                    </td>
                    <td className="px-6 py-4 text-slate-400 whitespace-nowrap">
                      {user.createdAt ? format(parseISO(user.createdAt), 'MMM d, yyyy') : '-'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 rounded-md text-[10px] uppercase font-bold tracking-wider ${
                        user.paymentStatus === 'completed' 
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                      }`}>
                        {user.paymentStatus || 'pending'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {user.adviserUnlocked ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] uppercase font-bold tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <CheckCircle2 className="w-3 h-3" /> Unlocked
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] uppercase font-bold tracking-wider bg-slate-800 text-slate-400 border border-slate-700">
                          Locked
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {users.filter(u => u.referredBy).length === 0 && !loading && (
              <div className="p-8 text-center text-slate-400">No referrals found.</div>
            )}
          </div>
        </div>
      )}

      {/* Audit Log Tab */}
      {activeTab === 'audit' && (
        <div className="bg-[#151B2B] border border-slate-800 rounded-2xl overflow-hidden shadow-lg animate-in fade-in">
          <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-800/20">
            <h3 className="font-semibold text-white">Security & Action Logs ({auditLogs.length})</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-300">
              <thead className="text-xs text-slate-400 uppercase bg-slate-800/50 border-b border-slate-800">
                <tr>
                  <th className="px-6 py-4 font-semibold">Date & Time</th>
                  <th className="px-6 py-4 font-semibold">Action</th>
                  <th className="px-6 py-4 font-semibold">Payment ID</th>
                  <th className="px-6 py-4 font-semibold">Target User UID</th>
                  <th className="px-6 py-4 font-semibold">Admin UID</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map((log) => (
                  <tr key={log.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4 text-slate-400 whitespace-nowrap">
                      {log.date ? format(parseISO(log.date), 'MMM d, yyyy HH:mm:ss') : '-'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 rounded-md text-[10px] uppercase font-bold tracking-wider ${
                        log.action.includes('Approve')
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : log.action.includes('Reject')
                          ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                          : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                      }`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-500">
                      {log.paymentId || '-'}
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-500">
                      {log.uid || '-'}
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-500">
                      {log.adminUid || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {auditLogs.length === 0 && !loading && (
              <div className="p-8 text-center text-slate-400">No audit logs recorded yet.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}