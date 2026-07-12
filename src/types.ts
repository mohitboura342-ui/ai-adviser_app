export type Transaction = {
  id: number;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  date: string;
  description: string;
};

export type Summary = {
  totalIncome: number;
  totalExpenses: number;
  totalSavings: number;
  savingsRate: number;
  expensesByCategory: Record<string, number>;
  thisMonthIncome: number;
  thisMonthExpenses: number;
  thisMonthSavings: number;
  lastMonthExpenses: number;
};

export type Goal = {
  id: number;
  name: string;
  amount: number;
  current_savings: number;
  target_date: string;
};

export type Forecast = {
  forecastNextMonth: number;
  forecastByCategory: { category: string; forecast: number }[];
};
