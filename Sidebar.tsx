import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  WalletCards, 
  TrendingUp, 
  Target, 
  MessageSquare,
  Activity,
  Settings,
  Shield
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useAuth } from '../contexts/AuthContext';

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

export function Sidebar() {
  const location = useLocation();
  const { user } = useAuth();

  const isAdmin = user?.email === 'mohitboura342@gmail.com';

  const links = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/transactions', icon: WalletCards, label: 'Transactions' },
    { to: '/forecast', icon: TrendingUp, label: 'Forecast' },
    { to: '/goals', icon: Target, label: 'Savings Planner' },
    { to: '/advisor', icon: MessageSquare, label: 'AI Advisor' },
  ];

  return (
    <div className="w-64 bg-[#0B0F1A] h-screen text-slate-300 flex flex-col fixed left-0 top-0 bottom-0 border-r border-slate-800">
      <div className="h-16 flex items-center px-6 border-b border-slate-800 text-white font-bold text-lg tracking-tight gap-3">
        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
          <Activity className="w-5 h-5 text-white" />
        </div>
        ProVision AI
      </div>
      <div className="flex-1 py-6 px-3 flex flex-col gap-1">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = location.pathname === link.to;
          return (
            <Link
              key={link.to}
              to={link.to}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                isActive 
                  ? "bg-indigo-500/10 text-indigo-400" 
                  : "hover:bg-slate-800/50 hover:text-white"
              )}
            >
              <Icon className="w-4 h-4" />
              {link.label}
            </Link>
          );
        })}
      </div>
      <div className="p-3 border-t border-slate-800">
        <Link
          to="/settings"
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
            location.pathname === '/settings'
              ? "bg-indigo-500/10 text-indigo-400" 
              : "hover:bg-slate-800/50 hover:text-white"
          )}
        >
          <Settings className="w-4 h-4" />
          Settings
        </Link>
        {isAdmin && (
          <Link
            to="/admin"
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 mt-1 rounded-md text-sm font-medium transition-colors",
              location.pathname === '/admin'
                ? "bg-indigo-500/10 text-indigo-400" 
                : "hover:bg-slate-800/50 hover:text-white"
            )}
          >
            <Shield className="w-4 h-4" />
            Admin Panel
          </Link>
        )}
      </div>
    </div>
  );
}
