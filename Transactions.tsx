import { useState, useEffect } from 'react';
import { Transaction } from '../types';
import { Plus, Trash2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { fetchApi } from '../lib/api';

const CATEGORIES = [
  'Food', 'Rent', 'Transport', 'Shopping', 'Bills', 
  'Entertainment', 'Healthcare', 'Investments', 'Miscellaneous', 'Income'
];

export default function Transactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form state
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');

  const fetchTransactions = () => {
    fetchApi('/api/transactions')
      .then(r => r.json())
      .then(data => {
        setTransactions(data);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || isNaN(Number(amount))) return;

    await fetchApi('/api/transactions', {
      method: 'POST',
      body: JSON.stringify({
        type,
        amount: Number(amount),
        category,
        date,
        description
      })
    });

    setAmount('');
    setDescription('');
    fetchTransactions();
  };

  const handleDelete = async (id: number) => {
    await fetchApi(`/api/transactions/${id}`, { method: 'DELETE' });
    fetchTransactions();
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-white">Transactions</h1>
        <p className="text-slate-400 mt-1">Manage your income and expenses</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <div className="bg-[#151B2B] border border-slate-800 rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-bold text-white mb-6">Add Transaction</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Type</label>
                <div className="flex bg-[#0B0F1A] p-1 rounded-lg border border-slate-800">
                  <button
                    type="button"
                    onClick={() => { setType('expense'); setCategory('Food'); }}
                    className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${type === 'expense' ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:text-white'}`}
                  >
                    Expense
                  </button>
                  <button
                    type="button"
                    onClick={() => { setType('income'); setCategory('Income'); }}
                    className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${type === 'income' ? 'bg-teal-500 text-white' : 'text-slate-400 hover:text-white'}`}
                  >
                    Income
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Amount (₹)</label>
                <input
                  type="number"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  className="w-full bg-\[#0B0F1A\] border border-slate-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                  placeholder="0.00"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Category</label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="w-full bg-\[#0B0F1A\] border border-slate-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                >
                  {CATEGORIES.filter(c => type === 'income' ? c === 'Income' : c !== 'Income').map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="w-full bg-[#0B0F1A] border border-slate-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all [color-scheme:dark]"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Description (optional)</label>
                <input
                  type="text"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full bg-\[#0B0F1A\] border border-slate-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                  placeholder="Groceries, salary, etc."
                />
              </div>

              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 mt-6"
              >
                <Plus className="w-4 h-4" />
                Add Transaction
              </button>
            </form>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-[#151B2B] border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#0B0F1A] border-b border-slate-800">
                  <th className="px-6 py-4 text-xs font-medium text-slate-400 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-4 text-xs font-medium text-slate-400 uppercase tracking-wider">Details</th>
                  <th className="px-6 py-4 text-xs font-medium text-slate-400 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-4 text-xs font-medium text-slate-400 uppercase tracking-wider text-right">Amount</th>
                  <th className="px-6 py-4 text-xs font-medium text-slate-400 uppercase tracking-wider text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                      No transactions found. Add one to get started.
                    </td>
                  </tr>
                ) : (
                  transactions.map((t) => (
                    <tr key={t.id} className="hover:bg-[#1E2536] transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                        {format(parseISO(t.date), 'MMM d, yyyy')}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-white">{t.description || '—'}</div>
                        <div className="text-xs text-slate-500 capitalize">{t.type}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">
                          {t.category}
                        </span>
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium text-right ${t.type === 'income' ? 'text-teal-400' : 'text-white'}`}>
                        {t.type === 'income' ? '+' : '-'}₹{t.amount.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <button
                          onClick={() => handleDelete(t.id)}
                          className="text-slate-500 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
