import { useState, useEffect } from 'react';
import { auth } from '../lib/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  GithubAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  sendEmailVerification
} from 'firebase/auth';
import { Activity, Mail, Lock, Eye, EyeOff, CheckCircle2, XCircle, Loader2, Github } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx } from 'clsx';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const { setGuestMode } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  
  const [referralCode, setReferralCode] = useState('');
  
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref) {
      setReferralCode(ref);
      setIsLogin(false); // Switch to signup if referral code is present
    }
  }, []);
  
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [githubLoading, setGithubLoading] = useState(false);
  
  const [toast, setToast] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  // Clear toast after 5s
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
  };

  const getPasswordStrength = (pass: string) => {
    let score = 0;
    if (!pass) return score;
    if (pass.length >= 8) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[a-z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;
    return score;
  };

  const passwordScore = getPasswordStrength(password);
  
  const validateForm = () => {
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      showToast('error', 'Please enter a valid email address.');
      return false;
    }
    if (!isLogin) {
      if (passwordScore < 5) {
        showToast('error', 'Please ensure your password meets all requirements.');
        return false;
      }
      if (!acceptTerms) {
        showToast('error', 'You must accept the Terms & Privacy Policy.');
        return false;
      }
    } else {
      if (!password) {
        showToast('error', 'Please enter your password.');
        return false;
      }
    }
    return true;
  };

  const syncUser = async (user: any, referral?: string) => {
    try {
      const token = await user.getIdToken();
      await fetch('/api/sync-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ referralCode: referral || null })
      });
    } catch (e) {
      console.error("Failed to sync user:", e);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      if (isLogin) {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        await syncUser(userCredential.user);
        showToast('success', 'Successfully signed in!');
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await syncUser(userCredential.user, referralCode);
        await sendEmailVerification(userCredential.user);
        showToast('success', 'Account created! Please check your email to verify.');
      }
    } catch (err: any) {
      showToast('error', err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      await syncUser(userCredential.user, referralCode);
      showToast('success', 'Successfully signed in with Google!');
    } catch (err: any) {
      showToast('error', err.message || 'Google sign-in failed');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleGithubSignIn = async () => {
    setGithubLoading(true);
    try {
      const provider = new GithubAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      await syncUser(userCredential.user, referralCode);
      showToast('success', 'Successfully signed in with GitHub!');
    } catch (err: any) {
      showToast('error', err.message || 'GitHub sign-in failed');
    } finally {
      setGithubLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      showToast('error', 'Please enter your email address first to reset password.');
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      showToast('success', 'Password reset email sent! Check your inbox.');
    } catch (err: any) {
      showToast('error', err.message || 'Failed to send reset email');
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F1A] flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-600/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-purple-600/20 blur-[120px] pointer-events-none" />

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-6 py-3 rounded-full shadow-lg border backdrop-blur-md"
            style={{
              backgroundColor: toast.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
              borderColor: toast.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)',
            }}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            ) : (
              <XCircle className="w-5 h-5 text-red-400" />
            )}
            <span className={clsx("text-sm font-medium", toast.type === 'success' ? 'text-emerald-400' : 'text-red-400')}>
              {toast.message}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="sm:mx-auto sm:w-full sm:max-w-md z-10"
      >
        <div className="flex justify-center">
          <motion.div 
            whileHover={{ scale: 1.05, rotate: 5 }}
            className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(79,70,229,0.3)] border border-white/10"
          >
            <Activity className="w-8 h-8 text-white" />
          </motion.div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-white tracking-tight">
          {isLogin ? 'Welcome back' : 'Create your account'}
        </h2>
        <p className="mt-2 text-center text-sm text-slate-400">
          {isLogin ? 'Enter your details to access your account' : 'Start managing your finances beautifully'}
        </p>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10"
      >
        <motion.div 
          animate={toast?.type === 'error' ? { x: [-10, 10, -10, 10, 0] } : {}}
          transition={{ duration: 0.4 }}
          className="bg-white/[0.02] backdrop-blur-xl py-8 px-4 sm:rounded-[24px] sm:px-10 border border-white/[0.05] shadow-[0_8px_32px_rgba(0,0,0,0.4)]"
        >
          <form className="space-y-5" onSubmit={handleSubmit} noValidate>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-300">Email Address</label>
              <div className="mt-1 relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none transition-colors group-focus-within:text-indigo-400 text-slate-500">
                  <Mail className="h-5 w-5" />
                </div>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-11 px-4 py-3 border border-white/10 rounded-xl bg-black/20 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all sm:text-sm shadow-inner"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-300">Password</label>
              <div className="mt-1 relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none transition-colors group-focus-within:text-indigo-400 text-slate-500">
                  <Lock className="h-5 w-5" />
                </div>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-11 pr-11 px-4 py-3 border border-white/10 rounded-xl bg-black/20 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all sm:text-sm shadow-inner"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>

              {!isLogin && (
                <>
                  <div className="mt-5">
                    <label htmlFor="referral" className="block text-sm font-medium text-slate-300">Referral Code (Optional)</label>
                    <div className="mt-1 relative group">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none transition-colors group-focus-within:text-indigo-400 text-slate-500">
                        <Activity className="h-5 w-5" />
                      </div>
                      <input
                        id="referral"
                        type="text"
                        value={referralCode}
                        onChange={(e) => setReferralCode(e.target.value)}
                        className="block w-full pl-11 px-4 py-3 border border-white/10 rounded-xl bg-black/20 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all sm:text-sm shadow-inner"
                        placeholder="Enter referral code"
                      />
                    </div>
                  </div>
                  <div className="mt-3 space-y-2">
                    <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((level) => (
                      <div 
                        key={level} 
                        className={clsx(
                          "h-1 flex-1 rounded-full transition-all duration-300",
                          passwordScore >= level 
                            ? passwordScore <= 2 ? 'bg-red-400' : passwordScore <= 4 ? 'bg-amber-400' : 'bg-emerald-400'
                            : "bg-slate-800"
                        )}
                      />
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[10px] text-slate-400">
                    <span className={clsx("flex items-center gap-1", password.length >= 8 && "text-emerald-400")}>
                      <CheckCircle2 className="w-3 h-3" /> 8+ characters
                    </span>
                    <span className={clsx("flex items-center gap-1", /[A-Z]/.test(password) && "text-emerald-400")}>
                      <CheckCircle2 className="w-3 h-3" /> Uppercase letter
                    </span>
                    <span className={clsx("flex items-center gap-1", /[a-z]/.test(password) && "text-emerald-400")}>
                      <CheckCircle2 className="w-3 h-3" /> Lowercase letter
                    </span>
                    <span className={clsx("flex items-center gap-1", /[0-9]/.test(password) && "text-emerald-400")}>
                      <CheckCircle2 className="w-3 h-3" /> Number
                    </span>
                    <span className={clsx("flex items-center gap-1", /[^A-Za-z0-9]/.test(password) && "text-emerald-400")}>
                      <CheckCircle2 className="w-3 h-3" /> Special character
                    </span>
                  </div>
                </div>
                </>
              )}
            </div>

            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center">
                {isLogin ? (
                  <>
                    <input
                      id="remember-me"
                      name="remember-me"
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-700 bg-black/20 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-slate-900"
                    />
                    <label htmlFor="remember-me" className="ml-2 block text-xs text-slate-400">
                      Remember me
                    </label>
                  </>
                ) : (
                  <>
                    <input
                      id="accept-terms"
                      name="accept-terms"
                      type="checkbox"
                      checked={acceptTerms}
                      onChange={(e) => setAcceptTerms(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-700 bg-black/20 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-slate-900"
                    />
                    <label htmlFor="accept-terms" className="ml-2 block text-xs text-slate-400">
                      I accept the <a href="#" className="text-indigo-400 hover:text-indigo-300">Terms</a> & <a href="#" className="text-indigo-400 hover:text-indigo-300">Privacy</a>
                    </label>
                  </>
                )}
              </div>

              {isLogin && (
                <div className="text-xs">
                  <button type="button" onClick={handleForgotPassword} className="font-medium text-indigo-400 hover:text-indigo-300 transition-colors">
                    Forgot password?
                  </button>
                </div>
              )}
            </div>

            <div>
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-[0_0_20px_rgba(79,70,229,0.3)] text-sm font-semibold text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 focus:ring-offset-[#0B0F1A] disabled:opacity-70 transition-all"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  isLogin ? 'Sign In' : 'Create Account'
                )}
              </motion.button>
            </div>
          </form>

          <div className="mt-7">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center text-xs uppercase tracking-widest">
                <span className="px-3 bg-[#111624] text-slate-500 font-semibold rounded-full">
                  Or continue with
                </span>
              </div>
            </div>

            <div className="mt-7 grid grid-cols-2 gap-4">
              <motion.button
                whileHover={{ scale: 1.02, backgroundColor: 'rgba(255,255,255,0.05)' }}
                whileTap={{ scale: 0.98 }}
                onClick={handleGoogleSignIn}
                disabled={googleLoading}
                className="w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-white/10 rounded-xl shadow-sm bg-white/[0.02] text-sm font-medium text-white hover:bg-white/[0.05] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 focus:ring-offset-[#0B0F1A] transition-colors"
              >
                {googleLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                )}
                Google
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.02, backgroundColor: 'rgba(255,255,255,0.05)' }}
                whileTap={{ scale: 0.98 }}
                onClick={handleGithubSignIn}
                disabled={githubLoading}
                className="w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-white/10 rounded-xl shadow-sm bg-white/[0.02] text-sm font-medium text-white hover:bg-white/[0.05] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 focus:ring-offset-[#0B0F1A] transition-colors"
              >
                {githubLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Github className="w-5 h-5" />}
                GitHub
              </motion.button>
            </div>
          </div>

          <div className="mt-8 text-center flex flex-col gap-4">
            <p className="text-sm text-slate-400">
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <button
                onClick={() => {
                  setIsLogin(!isLogin);
                  setEmail('');
                  setPassword('');
                  setToast(null);
                }}
                className="font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                {isLogin ? 'Sign up' : 'Sign in instead'}
              </button>
            </p>
            
            <div className="pt-4 border-t border-white/10">
              <button
                onClick={() => setGuestMode(true)}
                className="text-sm font-medium text-slate-400 hover:text-white transition-colors"
              >
                ← Back to Dashboard (Continue as Guest)
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
