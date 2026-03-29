/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { auth, db, googleProvider } from '../services/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Button } from '../components/ui/Button';
import { useLanguageStore } from '../store/languageStore';
import { ADMIN_ROUTE_PATH } from '../config/constants';
import { ArrowLeft, ArrowRight, LogOut } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [deniedUid, setDeniedUid] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { setUser } = useAuthStore();
  const { language, isRTL } = useLanguageStore();
  const googleBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    // Focus and scroll to the Google button when the page loads
    if (googleBtnRef.current) {
      googleBtnRef.current.focus();
      googleBtnRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, []);

  const verifyAdmin = async (uid: string, userEmail: string) => {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists() && userDoc.data().role === 'admin') {
      setUser({
        uid,
        email: userEmail,
        role: 'admin'
      });
      navigate(ADMIN_ROUTE_PATH);
      return true;
    }
    setDeniedUid(uid);
    return false;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setDeniedUid('');

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const isAdmin = await verifyAdmin(userCredential.user.uid, userCredential.user.email!);
      if (!isAdmin) {
        setError(language === 'he' ? 'גישה נדחתה. משתמש זה אינו מנהל.' : 'Access denied. User is not an admin.');
        await auth.signOut();
      }
    } catch (err: any) {
      setError(language === 'he' ? 'פרטי התחברות שגויים' : 'Invalid credentials');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError('');
    setDeniedUid('');
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const isAdmin = await verifyAdmin(result.user.uid, result.user.email!);
      if (!isAdmin) {
        setError(language === 'he' ? 'גישה נדחתה. משתמש זה אינו מנהל.' : 'Access denied. User is not an admin.');
        await auth.signOut();
      }
    } catch (err: any) {
      setError(language === 'he' ? 'התחברות עם גוגל נכשלה' : 'Google login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-20 px-6 space-y-8">
      <Link 
        to="/" 
        className="inline-flex items-center gap-2 text-ink-500 hover:text-ink-900 transition-colors text-[10px] font-bold uppercase tracking-widest"
      >
        {isRTL ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
        {language === 'he' ? 'חזרה לפלטפורמה' : 'Back to Platform'}
      </Link>

      <div className="glass p-8 sm:p-10 rounded-[2.5rem] shadow-2xl shadow-ink-900/5 space-y-8">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 bg-ink-900 rounded-2xl mx-auto flex items-center justify-center shadow-xl shadow-ink-900/20 mb-6">
            <LogOut className="w-8 h-8 text-white rotate-180" />
          </div>
          <h1 className="text-3xl font-sans font-extrabold tracking-tighter uppercase italic text-ink-900">
            {language === 'he' ? 'כניסת מנהל' : 'Admin Access'}
          </h1>
          <p className="text-ink-500 text-xs font-bold uppercase tracking-widest opacity-60">
            {language === 'he' ? 'התחבר לניהול הפלטפורמה' : 'Sign in to manage platform'}
          </p>
        </div>

        <Button 
          ref={googleBtnRef}
          variant="outline" 
          className="w-full flex gap-3 h-14 rounded-2xl border-black/5 hover:bg-white focus:ring-2 focus:ring-accent-peach" 
          onClick={handleGoogleLogin}
          isLoading={isLoading}
        >
          <img src="https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png" className="w-5 h-5" alt="Google" />
          <span className="text-sm font-bold uppercase tracking-tight">
            {language === 'he' ? 'התחברות עם Google' : 'Sign in with Google'}
          </span>
        </Button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-black/5"></span></div>
          <div className="relative flex justify-center text-[10px] font-bold uppercase tracking-widest">
            <span className="bg-white/40 backdrop-blur-md px-4 text-ink-500">{language === 'he' ? 'או' : 'OR'}</span>
          </div>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-ink-500 ml-1">
              {language === 'he' ? 'אימייל' : 'Email'}
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-5 py-4 bg-white border border-black/5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-accent-peach transition-all text-sm font-medium"
              placeholder="admin@thehub.com"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-ink-500 ml-1">
              {language === 'he' ? 'סיסמה' : 'Password'}
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-5 py-4 bg-white border border-black/5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-accent-peach transition-all text-sm font-medium"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="space-y-3">
              <p className="text-red-500 text-xs text-center font-bold uppercase tracking-tight">{error}</p>
              {deniedUid && (
                <div className="p-4 bg-red-50 rounded-2xl border border-red-100 text-center">
                  <p className="text-[9px] text-red-400 uppercase font-bold tracking-widest mb-1">
                    {language === 'he' ? 'ה-UID שלך:' : 'Your UID:'}
                  </p>
                  <code className="text-[10px] font-mono text-red-600 break-all">{deniedUid}</code>
                </div>
              )}
            </div>
          )}

          <Button type="submit" className="w-full h-14 rounded-2xl shadow-lg shadow-ink-900/10" isLoading={isLoading}>
            <span className="text-sm font-bold uppercase tracking-widest">
              {language === 'he' ? 'התחברות' : 'Login'}
            </span>
          </Button>
        </form>
      </div>
    </div>
  );
}
