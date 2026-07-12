import { fetchApi } from "../lib/api";
import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, AlertCircle, Lock } from 'lucide-react';
import { clsx } from 'clsx';
import ReactMarkdown from 'react-markdown';
import { Link } from 'react-router-dom';

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

export default function Advisor() {
  const [profile, setProfile] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: "Hello! I am your AI Financial Advisor. I have analyzed your spending data. Ask me any questions like: 'How can I save more?' or 'Where did I spend the most this month?'" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchApi('/api/user/profile')
      .then(res => res.json())
      .then(data => {
        setProfile(data);
      })
      .catch(console.error)
      .finally(() => setProfileLoading(false));
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);
    setError(null);

    try {
      const res = await fetchApi('/api/advisor/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to get response');
      }

      setMessages(prev => [...prev, { role: 'assistant', content: data.text }]);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  if (profileLoading) return <div className="animate-pulse">Loading Advisor...</div>;

  if (profile && !profile.adviserUnlocked) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)] animate-in fade-in zoom-in-95 duration-500">
        <div className="w-24 h-24 bg-purple-500/10 rounded-full flex items-center justify-center mb-6">
          <Lock className="w-12 h-12 text-purple-400" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-white mb-2">AI Adviser is Locked</h1>
        <p className="text-slate-400 max-w-md text-center mb-8">
          Unlock personalized AI insights, budget coaching, and smart alerts by purchasing access or inviting a friend.
        </p>
        <Link 
          to="/"
          className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-medium rounded-xl transition-all shadow-[0_0_20px_rgba(147,51,234,0.3)]"
        >
          Unlock on Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="mb-6 shrink-0">
        <h1 className="text-3xl font-bold tracking-tight text-white">AI Financial Advisor</h1>
        <p className="text-slate-400 mt-1">Get personalized insights and answers from your financial AI</p>
      </header>

      {error && (
        <div className="mb-4 bg-red-500/10 border border-red-500/50 rounded-lg p-4 flex items-start gap-3 text-red-400 shrink-0">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium">Connection Error</p>
            <p>{error}. Ensure you have provided a valid GEMINI_API_KEY in the Settings menu.</p>
          </div>
        </div>
      )}

      <div className="flex-1 bg-indigo-900/10 border border-indigo-500/30 rounded-2xl overflow-hidden flex flex-col min-h-0 shadow-inner">
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.map((m, i) => (
            <div key={i} className={clsx("flex gap-4 max-w-3xl", m.role === 'user' ? "ml-auto flex-row-reverse" : "")}>
              <div className={clsx("w-8 h-8 rounded-full flex items-center justify-center shrink-0", m.role === 'user' ? "bg-indigo-600" : "bg-teal-600")}>
                {m.role === 'user' ? <User className="w-5 h-5 text-white" /> : <Bot className="w-5 h-5 text-white" />}
              </div>
              <div className={clsx("px-5 py-3.5 rounded-2xl text-sm leading-relaxed", m.role === 'user' ? "bg-indigo-600 text-white rounded-tr-none" : "bg-[#1E2536] border border-slate-700 text-slate-300 rounded-tl-none")}>
                {m.role === 'assistant' ? (
                  <div className="markdown-body prose prose-invert max-w-none text-sm">
                    <ReactMarkdown>{m.content}</ReactMarkdown>
                  </div>
                ) : (
                  m.content
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex gap-4 max-w-3xl">
              <div className="w-8 h-8 rounded-full bg-teal-600 flex items-center justify-center shrink-0">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div className="px-5 py-3.5 rounded-2xl bg-[#1E2536] border border-slate-700 text-slate-400 rounded-tl-none flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <form onSubmit={handleSubmit} className="p-4 shrink-0">
          <div className="relative flex items-center">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask about your budget, savings, or spending..."
              className="w-full bg-[#151B2B] border border-slate-800 rounded-full pl-5 pr-12 py-3.5 text-sm text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="absolute right-2 p-2 rounded-full text-slate-400 hover:text-indigo-400 hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-slate-400"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
