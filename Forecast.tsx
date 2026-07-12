import { fetchApi } from "../lib/api";
import { useEffect, useState } from 'react';
import { Forecast } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function ForecastPage() {
  const [forecast, setForecast] = useState<Forecast | null>(null);

  useEffect(() => {
    fetchApi('/api/forecast')
      .then(r => r.json())
      .then(setForecast);
  }, []);

  if (!forecast) return <div>Loading...</div>;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-white">Expense Prediction</h1>
        <p className="text-slate-400 mt-1">AI-powered forecasts based on your spending history</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#151B2B] border border-slate-800 rounded-2xl p-6 md:col-span-1 shadow-sm">
          <h2 className="text-lg font-bold text-white mb-2">Expected Total Expenses</h2>
          <p className="text-sm text-slate-400 mb-6">Next 30 Days Forecast</p>
          <div className="text-4xl font-bold text-indigo-400">
            ₹{forecast.forecastNextMonth.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </div>
          <div className="mt-6 space-y-3">
            <h3 className="text-sm font-medium text-slate-300 border-b border-slate-800 pb-2">Breakdown</h3>
            {forecast.forecastByCategory.sort((a,b) => b.forecast - a.forecast).slice(0, 5).map(c => (
              <div key={c.category} className="flex justify-between items-center text-sm">
                <span className="text-slate-400">{c.category}</span>
                <span className="text-white font-medium">₹{c.forecast.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#151B2B] border border-slate-800 rounded-2xl p-6 md:col-span-2 shadow-sm">
          <h2 className="text-lg font-bold text-white mb-6">Predicted Spending by Category</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={forecast.forecastByCategory.sort((a,b) => b.forecast - a.forecast).slice(0, 7)}>
                <XAxis dataKey="category" stroke="#475569" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#475569" fontSize={12} tickLine={false} axisLine={false} tickFormatter={val => `₹${val}`} />
                <Tooltip
                  cursor={{ fill: '#1e293b' }}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f8fafc' }}
                />
                <Bar dataKey="forecast" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
