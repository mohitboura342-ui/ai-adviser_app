import { useEffect, useState } from 'react';
import { Summary } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis } from 'recharts';
import { AlertTriangle, TrendingDown, Lock, Unlock, Copy, Check, Users, Sparkles, X } from 'lucide-react';
import { fetchApi } from '../lib/api';
import { Link } from 'react-router-dom';
import QRCode from 'react-qr-code';

const COLORS = ['#6366f1', '#ec4899', '#14b8a6', '#f59e0b', '#8b5cf6', '#3b82f6'];

export default function Dashboard() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [paymentTxn, setPaymentTxn] = useState('');
  const [isPaying, setIsPaying] = useState(false);
  const [payError, setPayError] = useState('');
  const [paySuccess, setPaySuccess] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  useEffect(() => {
    Promise.all([
      fetchApi('/api/summary').then(r => r.ok ? r.json() : Promise.reject(new Error('Failed to load dashboard'))),
      fetchApi('/api/user/profile').then(r => r.ok ? r.json() : Promise.reject(new Error('Failed to load profile')))
    ])
      .then(([summaryData, profileData]) => {
        setSummary(summaryData);
        setProfile(profileData);
        setLoading(false);
      })
      .catch(e => {
        setError(e.message);
        setLoading(false);
      });
  }, []);

  const copyToClipboard = () => {
    if (!profile) return;
    const url = `${window.location.origin}?ref=${profile.referralCode}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSimulatePayment = async () => {
    if (!paymentTxn) {
      setPayError('Please enter a Transaction ID');
      return;
    }
    setIsPaying(true);
    setPayError('');
    try {
      const res = await fetchApi('/api/pay/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionId: paymentTxn })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Payment failed');
      
      setPaySuccess(data.message);
      // Update profile
      setProfile({ ...profile, adviserUnlocked: true });
      setShowPaymentModal(false);
    } catch (e: any) {
      setPayError(e.message);
    } finally {
      setIsPaying(false);
    }
  };

  if (loading) return <div className="animate-pulse flex space-x-4">Loading...</div>;
  if (error) return <div className="text-red-400 p-4 border border-red-500/50 bg-red-500/10 rounded-xl">{error}</div>;
  if (!summary || !profile) return <div>No data</div>;

  const pieData = Object.entries(summary.expensesByCategory).map(([name, value]) => ({ name, value }));

  // Basic Smart Alerts
  const alerts = [];
  if (summary.savingsRate < 20 && summary.totalIncome > 0) {
    alerts.push({ type: 'warning', msg: 'Your savings rate is below the recommended 20%.' });
  }
  if (summary.thisMonthExpenses > summary.lastMonthExpenses * 1.2 && summary.lastMonthExpenses > 0) {
    alerts.push({ type: 'danger', msg: 'Unusual spending detected! 20% higher than last month.' });
  }
  if (summary.totalSavings < summary.totalExpenses * 1.5) {
    alerts.push({ type: 'info', msg: 'Emergency fund low. Aim for at least 3-6 months of expenses.' });
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Dashboard</h1>
          <p className="text-slate-400 mt-1">Your financial overview</p>
        </div>
        <div className={`px-4 py-2 rounded-full border flex items-center gap-2 ${profile.adviserUnlocked ? 'bg-indigo-500/10 border-indigo-500/50 text-indigo-400' : 'bg-slate-800/50 border-slate-700 text-slate-400'}`}>
          {profile.adviserUnlocked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
          <span className="text-sm font-semibold">AI Adviser {profile.adviserUnlocked ? 'Unlocked' : 'Locked'}</span>
        </div>
      </header>

      {alerts.length > 0 && (
        <div className="flex flex-col gap-3">
          {alerts.map((alert, i) => (
            <div key={i} className={`flex items-center gap-3 p-4 rounded-xl border ${alert.type === 'danger' ? 'bg-red-500/10 border-red-500/50 text-red-400' : alert.type === 'warning' ? 'bg-amber-500/10 border-amber-500/50 text-amber-400' : 'bg-indigo-500/10 border-indigo-500/50 text-indigo-400'}`}>
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <div className="text-sm font-medium">{alert.msg}</div>
            </div>
          ))}
        </div>
      )}

      {/* AI Adviser & Referral Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Referral System */}
        <div className="bg-gradient-to-br from-[#151B2B] to-[#1a1f35] border border-slate-700 rounded-2xl p-6 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 p-16 bg-indigo-500/5 rounded-full blur-3xl" />
          <div className="relative z-10">
            <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-400" /> Referral Program
            </h2>
            <p className="text-sm text-slate-400 mb-6">
              Invite friends. If they unlock the AI Adviser, you both get it unlocked for free!
            </p>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-black/20 rounded-xl p-4 border border-white/5">
                <div className="text-2xl font-bold text-white">{profile.referralCount || 0}</div>
                <div className="text-xs text-slate-400 font-medium">Total Signups</div>
              </div>
              <div className="bg-black/20 rounded-xl p-4 border border-white/5">
                <div className="text-2xl font-bold text-emerald-400">{profile.successfulReferrals || 0}</div>
                <div className="text-xs text-slate-400 font-medium">Successful Paid Referrals</div>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Your Unique Link</label>
              <div className="flex bg-black/40 border border-slate-700 rounded-xl overflow-hidden focus-within:border-indigo-500 transition-colors">
                <div className="px-4 py-3 text-sm text-slate-300 bg-black/40 truncate flex-1 font-mono">
                  {window.location.origin}?ref={profile.referralCode}
                </div>
                <button 
                  onClick={copyToClipboard}
                  className="px-4 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-colors flex items-center gap-2"
                >
                  {copied ? <><Check className="w-4 h-4"/> Copied</> : <><Copy className="w-4 h-4"/> Copy</>}
                </button>
              </div>
              <div className="text-xs text-slate-500 mt-2">
                Referral Code: <span className="font-mono text-indigo-300">{profile.referralCode}</span>
              </div>
            </div>
          </div>
        </div>

        {/* AI Adviser Status / Payment */}
        <div className="bg-gradient-to-br from-[#151B2B] to-[#1f192b] border border-slate-700 rounded-2xl p-6 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 p-16 bg-purple-500/5 rounded-full blur-3xl" />
          <div className="relative z-10 h-full flex flex-col">
            <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-400" /> AI Financial Adviser
            </h2>
            
            {profile.adviserUnlocked ? (
              <div className="flex-1 flex flex-col items-center justify-center py-6">
                <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mb-4">
                  <Check className="w-8 h-8 text-emerald-400" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Unlocked & Ready</h3>
                <p className="text-slate-400 text-center text-sm mb-6">
                  You have full access to personalized AI insights and financial coaching.
                </p>
                {paySuccess && <div className="text-emerald-400 text-sm font-medium mb-4">{paySuccess}</div>}
                <Link 
                  to="/advisor"
                  className="px-6 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-medium transition-colors shadow-[0_0_15px_rgba(147,51,234,0.3)] inline-block text-center"
                >
                  Ask AI Adviser
                </Link>
              </div>
            ) : (
              <div className="flex-1 flex flex-col">
                <p className="text-sm text-slate-400 mb-6">
                  Unlock advanced AI-driven financial insights, budget recommendations, and future projections for a one-time fee of <strong className="text-white">₹49</strong>.
                </p>
                
                <div className="bg-black/20 rounded-xl p-4 border border-white/5 mb-6 text-sm text-slate-300">
                  <div className="flex justify-between mb-2">
                    <span>AI Adviser Access</span>
                    <span className="text-white font-medium">₹49.00</span>
                  </div>
                  <div className="border-t border-white/10 pt-2 flex justify-between font-bold">
                    <span>Total</span>
                    <span className="text-purple-400">₹49.00</span>
                  </div>
                </div>

                <div className="mt-auto space-y-3">
                  {payError && <div className="text-red-400 text-xs">{payError}</div>}
                  <button 
                    onClick={() => setShowPaymentModal(true)}
                    className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-sm rounded-xl transition-all shadow-[0_0_15px_rgba(147,51,234,0.2)] whitespace-nowrap"
                  >
                    Pay ₹49 with UPI
                  </button>
                  <div className="text-[10px] text-slate-500 text-center">
                    Secure UPI payment via QR code.
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Income" value={`₹${summary.totalIncome.toLocaleString()}`} />
        <StatCard title="Total Expenses" value={`₹${summary.totalExpenses.toLocaleString()}`} />
        <StatCard title="Total Savings" value={`₹${summary.totalSavings.toLocaleString()}`} />
        <StatCard title="Savings Rate" value={`${summary.savingsRate.toFixed(1)}%`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#151B2B] border border-slate-800 rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-bold text-white mb-6">Expenses by Category</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
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
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f8fafc' }}
                  itemStyle={{ color: '#f8fafc' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-4 mt-4 justify-center">
            {pieData.map((entry, i) => (
              <div key={entry.name} className="flex items-center gap-2 text-sm text-slate-300">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                {entry.name}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#151B2B] border border-slate-800 rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-bold text-white mb-6">Recent Overview</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-4 border-b border-slate-800">
              <div className="text-slate-400">This Month Income</div>
              <div className="font-medium">₹{summary.thisMonthIncome.toLocaleString()}</div>
            </div>
            <div className="flex justify-between items-center pb-4 border-b border-slate-800">
              <div className="text-slate-400">This Month Expenses</div>
              <div className="font-medium">₹{summary.thisMonthExpenses.toLocaleString()}</div>
            </div>
            <div className="flex justify-between items-center pb-4 border-b border-slate-800">
              <div className="text-slate-400">This Month Savings</div>
              <div className="font-medium">₹{summary.thisMonthSavings.toLocaleString()}</div>
            </div>
            <div className="flex justify-between items-center">
              <div className="text-slate-400">Last Month Expenses</div>
              <div className="font-medium">₹{summary.lastMonthExpenses.toLocaleString()}</div>
            </div>
          </div>
        </div>
      </div>
      
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-[#151B2B] border border-slate-700 rounded-2xl p-6 shadow-2xl max-w-sm w-full relative">
            <button 
              onClick={() => setShowPaymentModal(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-800 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="text-center mb-6 pt-2">
              <div className="w-12 h-12 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-6 h-6 text-indigo-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-1">Unlock AI Adviser</h3>
              <p className="text-sm text-slate-400">Pay ₹49.00 securely using UPI</p>
            </div>
            
            <div className="bg-white p-4 rounded-xl flex justify-center mb-4">
              <QRCode 
                value="upi://pay?pa=mohitbora741-1@oksbi&pn=Mohit%20Bora&am=49.00&cu=INR" 
                size={200}
                level="H"
              />
            </div>
            
            <div className="text-center mb-6">
              <p className="text-sm text-slate-300 font-medium">Mohit Bora</p>
              <p className="text-xs text-slate-500 font-mono mt-1">UPI ID: mohitbora741-1@oksbi</p>
              <p className="text-xs text-slate-500 mt-2">Scan to pay with any UPI app</p>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Transaction ID</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="Enter 12-digit UTR/Txn ID" 
                  value={paymentTxn}
                  onChange={e => setPaymentTxn(e.target.value)}
                  className="flex-1 bg-black/40 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
              {payError && <div className="text-red-400 text-xs">{payError}</div>}
              <button 
                onClick={handleSimulatePayment}
                disabled={isPaying || !paymentTxn}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm rounded-xl transition-all shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isPaying ? 'Verifying...' : 'Verify Payment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value }: { title: string, value: string }) {
  return (
    <div className="bg-[#151B2B] border border-slate-800 rounded-2xl p-5 flex flex-col justify-center shadow-sm">
      <span className="text-xs uppercase tracking-wider text-slate-500 font-bold mb-1">{title}</span>
      <div className="text-2xl font-bold text-white">{value}</div>
    </div>
  );
}
