import { useEffect, useState } from 'react';
import { Goal } from '../types';
import { Plus, Trash2 } from 'lucide-react';
import { parseISO, format, differenceInMonths } from 'date-fns';
import { fetchApi } from '../lib/api';

export default function Goals() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [currentSavings, setCurrentSavings] = useState('');
  const [targetDate, setTargetDate] = useState('');

  const fetchGoals = () => {
    fetchApi('/api/goals')
      .then(r => r.json())
      .then(setGoals);
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !amount || !targetDate) return;

    await fetchApi('/api/goals', {
      method: 'POST',
      body: JSON.stringify({
        name,
        amount: Number(amount),
        current_savings: Number(currentSavings) || 0,
        target_date: targetDate,
      })
    });

    setName('');
    setAmount('');
    setCurrentSavings('');
    setTargetDate('');
    fetchGoals();
  };

  const handleDelete = async (id: number) => {
    await fetchApi(`/api/goals/${id}`, { method: 'DELETE' });
    fetchGoals();
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-white">Savings Planner</h1>
        <p className="text-slate-400 mt-1">Set and track your financial goals</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <div className="bg-[#151B2B] border border-slate-800 rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-bold text-white mb-6">New Goal</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Goal Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full bg-[#0B0F1A] border border-slate-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  placeholder="e.g. Buy Car"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Target Amount (₹)</label>
                <input
                  type="number"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  className="w-full bg-[#0B0F1A] border border-slate-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  placeholder="1000000"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Current Savings (₹)</label>
                <input
                  type="number"
                  value={currentSavings}
                  onChange={e => setCurrentSavings(e.target.value)}
                  className="w-full bg-[#0B0F1A] border border-slate-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  placeholder="250000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Target Date</label>
                <input
                  type="date"
                  value={targetDate}
                  onChange={e => setTargetDate(e.target.value)}
                  className="w-full bg-[#0B0F1A] border border-slate-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 [color-scheme:dark]"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 mt-6"
              >
                <Plus className="w-4 h-4" />
                Add Goal
              </button>
            </form>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          {goals.length === 0 ? (
            <div className="text-center p-12 bg-[#151B2B] border border-slate-800 rounded-2xl shadow-sm">
              <p className="text-slate-400">No goals found. Create your first saving goal!</p>
            </div>
          ) : (
            goals.map(goal => {
              const remainingAmount = goal.amount - goal.current_savings;
              const monthsLeft = Math.max(1, differenceInMonths(parseISO(goal.target_date), new Date()));
              const monthlyNeeded = remainingAmount / monthsLeft;
              const progress = Math.min(100, Math.max(0, (goal.current_savings / goal.amount) * 100));

              return (
                <div key={goal.id} className="bg-[#151B2B] border border-slate-800 rounded-2xl p-6 shadow-sm relative group">
                  <button
                    onClick={() => handleDelete(goal.id)}
                    className="absolute top-4 right-4 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-white pr-8">{goal.name}</h3>
                      <p className="text-sm text-slate-400">Target: {format(parseISO(goal.target_date), 'MMM yyyy')}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-indigo-400">₹{goal.amount.toLocaleString()}</div>
                      <div className="text-sm text-slate-400">Goal Amount</div>
                    </div>
                  </div>

                  <div className="w-full bg-slate-800 rounded-full h-3 mb-2 overflow-hidden">
                    <div className="bg-indigo-500 h-3 rounded-full transition-all" style={{ width: `${progress}%` }}></div>
                  </div>
                  <div className="flex justify-between text-sm mb-6">
                    <span className="text-slate-300">₹{goal.current_savings.toLocaleString()} saved</span>
                    <span className="text-slate-400">{progress.toFixed(1)}%</span>
                  </div>

                  <div className="bg-[#0B0F1A] rounded-lg p-4 flex justify-between items-center border border-slate-800/50">
                    <div>
                      <div className="text-sm font-medium text-slate-400">Needed Monthly</div>
                      <div className="text-lg font-bold text-white">₹{monthlyNeeded.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-slate-400">Remaining</div>
                      <div className="text-lg font-bold text-white">₹{remainingAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
