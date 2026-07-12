import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { auth } from '../lib/firebase';
import { updateProfile, updatePassword, sendPasswordResetEmail } from 'firebase/auth';
import { 
  LogOut, User, Shield, Bell, Settings as SettingsIcon, 
  Mail, Key, Smartphone, Globe, CreditCard, CheckCircle2, AlertTriangle, Loader2,
  MessageCircle, Phone, Copy, ExternalLink, HelpCircle, Bug 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx } from 'clsx';

type Tab = 'account' | 'security' | 'notifications' | 'preferences' | 'support';

export default function Settings() {
  const { user, isGuest, setGuestMode } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('account');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  // Form states
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [newPassword, setNewPassword] = useState('');
  
  // Mock preferences
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [pushNotifs, setPushNotifs] = useState(false);
  const [currency, setCurrency] = useState('INR');
  const [theme, setTheme] = useState('dark');

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleSignOut = () => {
    if (isGuest) {
      setGuestMode(false);
    } else {
      auth.signOut();
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    try {
      await updateProfile(user, { displayName });
      showMessage('success', 'Profile updated successfully!');
    } catch (err: any) {
      showMessage('error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newPassword) return;
    setLoading(true);
    try {
      await updatePassword(user, newPassword);
      setNewPassword('');
      showMessage('success', 'Password updated successfully!');
    } catch (err: any) {
      showMessage('error', err.message || 'Please sign in again to update your password.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!user?.email) return;
    try {
      await sendPasswordResetEmail(auth, user.email);
      showMessage('success', 'Password reset email sent!');
    } catch (err: any) {
      showMessage('error', err.message);
    }
  };

  const [isOpeningWhatsApp, setIsOpeningWhatsApp] = useState(false);
  const supportNumber = "+917037957098";
  
  const handleOpenWhatsApp = () => {
    setIsOpeningWhatsApp(true);
    
    // Fallback if not opened within 2s
    const timer = setTimeout(() => {
      setIsOpeningWhatsApp(false);
      showMessage('error', 'Unable to open WhatsApp. Please try again later.');
    }, 2000);
    
    try {
      const message = `Hello Support Team,

I need help with the AI Adviser application.

Name: ${user?.displayName || 'Not provided'}
Registered Email: ${user?.email || 'Not provided'}
Issue: 

Please assist me.

Thank you.`;
      
      const whatsappUrl = `https://wa.me/917037957098?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');
      
      // Assume success if no immediate error thrown
      clearTimeout(timer);
      setIsOpeningWhatsApp(false);
    } catch (error) {
      clearTimeout(timer);
      setIsOpeningWhatsApp(false);
      showMessage('error', 'Unable to open WhatsApp. Please try again later.');
    }
  };

  const handleCopyNumber = () => {
    navigator.clipboard.writeText('+91 7037957098').then(() => {
      showMessage('success', 'Phone number copied to clipboard!');
    }).catch(() => {
      showMessage('error', 'Failed to copy phone number.');
    });
  };

  const tabs = [
    { id: 'account', label: 'Account', icon: User },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'preferences', label: 'Preferences', icon: SettingsIcon },
    { id: 'support', label: 'Help & Support', icon: Phone },
  ] as const;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Settings</h1>
          <p className="text-slate-400 mt-1">Manage your account and app preferences</p>
        </div>
      </header>

      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={clsx(
              "flex items-center gap-3 p-4 rounded-xl border",
              message.type === 'success' ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : "bg-red-500/10 border-red-500/30 text-red-400"
            )}
          >
            {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
            <span className="text-sm font-medium">{message.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        <div className="md:col-span-3 space-y-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={clsx(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm",
                  isActive 
                    ? "bg-indigo-600/10 text-indigo-400 border border-indigo-500/30" 
                    : "text-slate-400 hover:bg-[#151B2B] hover:text-slate-200 border border-transparent"
                )}
              >
                <Icon className="w-5 h-5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="md:col-span-9 space-y-6">
          {activeTab === 'account' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div className="bg-[#151B2B] border border-slate-800 rounded-2xl p-6 shadow-sm">
                <h2 className="text-lg font-bold text-white mb-6">Profile Information</h2>
                <form onSubmit={handleUpdateProfile} className="space-y-5">
                  <div className="flex items-center gap-6 pb-6 border-b border-slate-800">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white text-3xl font-bold uppercase shadow-lg shadow-indigo-500/20">
                      {user?.displayName ? user.displayName[0] : user?.email?.[0]}
                    </div>
                    <div>
                      <h3 className="text-white font-medium">Profile Picture</h3>
                      <p className="text-sm text-slate-400 mt-1">PNG, JPG up to 5MB</p>
                      <button type="button" className="mt-3 px-4 py-1.5 text-xs font-semibold bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors">
                        Upload new
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-medium text-slate-400 mb-2">Display Name</label>
                      <input
                        type="text"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        className="w-full bg-[#0B0F1A] border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all sm:text-sm"
                        placeholder="John Doe"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-400 mb-2">Email Address</label>
                      <div className="w-full bg-[#0B0F1A]/50 border border-slate-800 rounded-lg px-4 py-2.5 text-slate-500 sm:text-sm flex items-center gap-2 cursor-not-allowed">
                        <Mail className="w-4 h-4" />
                        {user?.email}
                      </div>
                    </div>
                  </div>
                  <div className="pt-2 flex justify-end">
                    <button
                      type="submit"
                      disabled={loading || displayName === user?.displayName}
                      className="flex justify-center items-center gap-2 py-2.5 px-6 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 focus:ring-offset-[#0B0F1A] disabled:opacity-50 transition-colors"
                    >
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Changes'}
                    </button>
                  </div>
                </form>
              </div>

              <div className="bg-[#151B2B] border border-slate-800 rounded-2xl p-6 shadow-sm">
                <h2 className="text-lg font-bold text-white mb-2">Account Management</h2>
                <p className="text-sm text-slate-400 mb-6">Manage your data and account status.</p>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-[#0B0F1A] border border-slate-800 rounded-xl">
                    <div>
                      <h4 className="text-white font-medium text-sm">Export Data</h4>
                      <p className="text-xs text-slate-400 mt-1">Download a copy of all your financial data in CSV format.</p>
                    </div>
                    <button className="px-4 py-2 text-sm font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors">
                      Export
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-red-500/5 border border-red-500/20 rounded-xl">
                    <div>
                      <h4 className="text-red-400 font-medium text-sm">Sign Out</h4>
                      <p className="text-xs text-slate-400 mt-1">Sign out of your account on this device.</p>
                    </div>
                    <button
                      onClick={handleSignOut}
                      className="px-4 py-2 text-sm font-medium text-red-400 bg-red-500/10 hover:bg-red-500/20 rounded-lg transition-colors flex items-center gap-2"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'security' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div className="bg-[#151B2B] border border-slate-800 rounded-2xl p-6 shadow-sm">
                <h2 className="text-lg font-bold text-white mb-6">Change Password</h2>
                <form onSubmit={handleUpdatePassword} className="space-y-5">
                  <div className="grid grid-cols-1 gap-5 max-w-md">
                    <div>
                      <label className="block text-sm font-medium text-slate-400 mb-2">New Password</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                          <Key className="w-5 h-5" />
                        </div>
                        <input
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="w-full pl-10 bg-[#0B0F1A] border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all sm:text-sm"
                          placeholder="••••••••"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <button
                      type="submit"
                      disabled={loading || !newPassword || newPassword.length < 6}
                      className="py-2.5 px-6 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                    >
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Update Password'}
                    </button>
                    <button
                      type="button"
                      onClick={handlePasswordReset}
                      className="text-sm font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
                    >
                      Send reset email
                    </button>
                  </div>
                </form>
              </div>

              <div className="bg-[#151B2B] border border-slate-800 rounded-2xl p-6 shadow-sm">
                <h2 className="text-lg font-bold text-white mb-6">Active Sessions</h2>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 bg-[#0B0F1A] border border-indigo-500/30 rounded-xl">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center">
                        <Globe className="w-5 h-5 text-indigo-400" />
                      </div>
                      <div>
                        <h4 className="text-white font-medium text-sm flex items-center gap-2">
                          Mac OS • Chrome 
                          <span className="text-[10px] uppercase font-bold tracking-wider bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded">Current</span>
                        </h4>
                        <p className="text-xs text-slate-400 mt-1">Delhi, India • Active now</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-[#0B0F1A] border border-slate-800 rounded-xl">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center">
                        <Smartphone className="w-5 h-5 text-slate-400" />
                      </div>
                      <div>
                        <h4 className="text-white font-medium text-sm">iOS • Safari</h4>
                        <p className="text-xs text-slate-400 mt-1">Delhi, India • Last active 2 hours ago</p>
                      </div>
                    </div>
                    <button className="text-xs font-medium text-slate-400 hover:text-red-400 transition-colors">
                      Revoke
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'notifications' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-[#151B2B] border border-slate-800 rounded-2xl p-6 shadow-sm">
              <h2 className="text-lg font-bold text-white mb-6">Notification Preferences</h2>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-white font-medium text-sm">Email Summaries</h4>
                    <p className="text-xs text-slate-400 mt-1">Receive weekly and monthly financial summary reports.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={emailNotifs} onChange={(e) => setEmailNotifs(e.target.checked)} />
                    <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-white font-medium text-sm">Budget Alerts</h4>
                    <p className="text-xs text-slate-400 mt-1">Get notified when you approach or exceed category budgets.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={pushNotifs} onChange={(e) => setPushNotifs(e.target.checked)} />
                    <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'preferences' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-[#151B2B] border border-slate-800 rounded-2xl p-6 shadow-sm">
              <h2 className="text-lg font-bold text-white mb-6">App Preferences</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Display Currency</label>
                  <div className="relative max-w-xs">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <select 
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="w-full pl-10 bg-[#0B0F1A] border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all sm:text-sm appearance-none"
                    >
                      <option value="INR">₹ Indian Rupee (INR)</option>
                      <option value="USD">$ US Dollar (USD)</option>
                      <option value="EUR">€ Euro (EUR)</option>
                      <option value="GBP">£ British Pound (GBP)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Theme</label>
                  <div className="flex gap-4">
                    <button 
                      onClick={() => setTheme('dark')}
                      className={clsx(
                        "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
                        theme === 'dark' ? "border-indigo-500 bg-indigo-500/10" : "border-slate-800 bg-[#0B0F1A] hover:border-slate-700"
                      )}
                    >
                      <div className="w-16 h-12 rounded bg-[#0B0F1A] border border-slate-700 flex items-center justify-center">
                        <div className="w-8 h-2 bg-slate-800 rounded-full" />
                      </div>
                      <span className="text-xs font-medium text-slate-300">Dark Mode</span>
                    </button>
                    <button 
                      onClick={() => setTheme('light')}
                      className={clsx(
                        "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
                        theme === 'light' ? "border-indigo-500 bg-indigo-500/10" : "border-slate-800 bg-[#0B0F1A] hover:border-slate-700"
                      )}
                    >
                      <div className="w-16 h-12 rounded bg-slate-100 border border-slate-300 flex items-center justify-center">
                        <div className="w-8 h-2 bg-slate-300 rounded-full" />
                      </div>
                      <span className="text-xs font-medium text-slate-300">Light Mode</span>
                    </button>
                    <button 
                      onClick={() => setTheme('system')}
                      className={clsx(
                        "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
                        theme === 'system' ? "border-indigo-500 bg-indigo-500/10" : "border-slate-800 bg-[#0B0F1A] hover:border-slate-700"
                      )}
                    >
                      <div className="w-16 h-12 rounded bg-gradient-to-br from-slate-100 to-[#0B0F1A] border border-slate-700 flex items-center justify-center">
                        <div className="w-8 h-2 bg-slate-500 rounded-full" />
                      </div>
                      <span className="text-xs font-medium text-slate-300">System</span>
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
          {activeTab === 'support' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div className="bg-[#151B2B] border border-slate-800 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center">
                    <MessageCircle className="w-6 h-6 text-emerald-500" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Contact Support</h2>
                    <p className="text-sm text-slate-400">Get help with your account or app issues</p>
                  </div>
                </div>

                <div className="bg-[#0B0F1A] border border-slate-800 rounded-xl p-6 text-center space-y-4">
                  <div className="w-16 h-16 bg-[#25D366]/10 rounded-full flex items-center justify-center mx-auto mb-2">
                    <svg viewBox="0 0 24 24" className="w-8 h-8 fill-[#25D366]" xmlns="http://www.w3.org/2000/svg">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
                    </svg>
                  </div>
                  <h3 className="text-white font-semibold text-lg">WhatsApp Support</h3>
                  <p className="text-slate-400 text-sm max-w-md mx-auto pb-4">
                    Get instant help directly on WhatsApp. Our support team is available to assist you with any issues.
                  </p>
                  
                  <button 
                    onClick={handleOpenWhatsApp}
                    disabled={isOpeningWhatsApp}
                    className="w-full sm:w-auto px-8 py-3.5 bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold rounded-xl shadow-lg shadow-[#25D366]/20 transition-all flex items-center justify-center gap-3 mx-auto disabled:opacity-75 disabled:cursor-not-allowed"
                  >
                    {isOpeningWhatsApp ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Opening WhatsApp...
                      </>
                    ) : (
                      <>
                        <MessageCircle className="w-5 h-5" />
                        Chat on WhatsApp
                      </>
                    )}
                  </button>

                  <div className="flex flex-wrap items-center justify-center gap-3 pt-6 border-t border-slate-800">
                    <span className="text-slate-400 font-mono text-sm tracking-wide bg-[#151B2B] px-3 py-1.5 rounded-lg border border-slate-800">
                      +91 7037957098
                    </span>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={handleCopyNumber}
                        className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors border border-transparent hover:border-slate-700 tooltip-trigger"
                        title="Copy Number"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <a 
                        href="tel:+917037957098"
                        className="p-2 text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors border border-transparent hover:border-indigo-500/30 tooltip-trigger"
                        title="Call Support"
                      >
                        <Phone className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-[#151B2B] border border-slate-800 rounded-2xl p-5 shadow-sm hover:border-slate-700 transition-colors cursor-pointer group">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                      <HelpCircle className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-white font-medium text-sm">FAQs</h3>
                      <p className="text-slate-400 text-xs mt-1">Frequently asked questions</p>
                    </div>
                    <ExternalLink className="w-4 h-4 text-slate-500 ml-auto group-hover:text-white transition-colors" />
                  </div>
                </div>

                <div className="bg-[#151B2B] border border-slate-800 rounded-2xl p-5 shadow-sm hover:border-slate-700 transition-colors cursor-pointer group">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-amber-500/10 rounded-lg flex items-center justify-center group-hover:bg-amber-500/20 transition-colors">
                      <Bug className="w-5 h-5 text-amber-400" />
                    </div>
                    <div>
                      <h3 className="text-white font-medium text-sm">Report a Bug</h3>
                      <p className="text-slate-400 text-xs mt-1">Help us improve the app</p>
                    </div>
                    <ExternalLink className="w-4 h-4 text-slate-500 ml-auto group-hover:text-white transition-colors" />
                  </div>
                </div>
              </div>

              <div className="text-center pt-4">
                <p className="text-slate-500 text-xs">AI Adviser Version 1.0.0 (Build 42)</p>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
